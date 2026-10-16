// Design Ref: §4.3 — 대시보드 집계. 모든 함수는 로그인한 담당자(viewer)를 필수로 받아 범위를 서버에서 거른다.
// 센터 담당자는 자기 센터만 받는다. 전체 평균은 숫자 하나만 돌려주는 별도 함수로 계산한다.
import "server-only";
import { db } from "@/lib/data/client";
import { listCourseNames } from "@/lib/data/courses";
import type { Viewer } from "@/lib/data/users";
import { roundScore } from "@/lib/survey/format";
import { MIN_CENTERS_FOR_OVERALL_AVERAGE, MIN_RESPONSES_FOR_STATS } from "@/lib/survey/rules";

export type CenterStat = {
  centerId: string;
  centerName: string;
  responseCount: number;
  /** 응답이 충분한가 (5건 미만이면 평균을 내보내지 않는다) */
  hasEnough: boolean;
  /** 문항 1~8번 평균. 응답 부족이면 null */
  questionAverages: number[] | null;
  /** 8문항 전체 평균. 응답 부족이면 null */
  average: number | null;
};

export type Dashboard = {
  /** 조회할 수 있는 회차 이름 목록 */
  rounds: string[];
  /** 선택한 회차 (전체이면 null) */
  selectedRound: string | null;
  /** 센터 담당자가 고를 수 있는 교육 이름 목록 (회사 담당자는 비어 있음) */
  courses: string[];
  /** 선택한 교육 (전체이면 null) */
  selectedCourse: string | null;
  centers: CenterStat[];
  /** 5건 이상인 센터들의 전체 평균. 계산할 수 없으면 null */
  overallAverage: number | null;
};

type StatsRow = {
  center_id: string;
  center_name: string;
  response_count: number | string;
  q1: number | null; q2: number | null; q3: number | null; q4: number | null;
  q5: number | null; q6: number | null; q7: number | null; q8: number | null;
};

/** 센터 담당자는 자기 센터만, 회사 담당자는 전체. 센터가 없는 센터 담당자는 아무것도 볼 수 없다. */
function visibleCenterId(viewer: Viewer): string | null | "none" {
  if (viewer.role === "company") return null;
  return viewer.centerId ?? "none";
}

export async function listRounds(viewer: Viewer): Promise<string[]> {
  const scope = visibleCenterId(viewer);
  if (scope === "none") return [];
  let query = db().from("sessions").select("round_name, education_date");
  if (scope) query = query.eq("center_id", scope);
  const { data, error } = await query.returns<{ round_name: string; education_date: string }[]>();
  if (error) throw error;
  const latest = new Map<string, string>();
  for (const row of data) {
    const prev = latest.get(row.round_name);
    if (!prev || prev < row.education_date) latest.set(row.round_name, row.education_date);
  }
  return [...latest.entries()].sort((a, b) => b[1].localeCompare(a[1])).map(([name]) => name);
}

function toStat(row: StatsRow): CenterStat {
  const responseCount = Number(row.response_count);
  const hasEnough = responseCount >= MIN_RESPONSES_FOR_STATS;
  if (!hasEnough) {
    return { centerId: row.center_id, centerName: row.center_name, responseCount, hasEnough, questionAverages: null, average: null };
  }
  const questionAverages = [row.q1, row.q2, row.q3, row.q4, row.q5, row.q6, row.q7, row.q8].map(Number);
  const average = questionAverages.reduce((sum, v) => sum + v, 0) / questionAverages.length;
  return { centerId: row.center_id, centerName: row.center_name, responseCount, hasEnough, questionAverages, average };
}

export async function getDashboard(viewer: Viewer, round: string | null, course: string | null = null): Promise<Dashboard> {
  const rounds = await listRounds(viewer);
  const selectedRound = round && rounds.includes(round) ? round : null;
  const scope = visibleCenterId(viewer);
  if (scope === "none") {
    return { rounds, selectedRound, courses: [], selectedCourse: null, centers: [], overallAverage: null };
  }

  // 교육 필터는 센터 담당자(자기 센터 하나만 보는 화면)에서만 쓴다.
  const courses = viewer.role === "center" && scope ? await listCourseNames(viewer, scope) : [];
  const selectedCourse = course && courses.includes(course) ? course : null;

  const [statsResult, overallResult] = await Promise.all([
    db().rpc("center_stats", { p_round: selectedRound, p_center: scope, p_min: MIN_RESPONSES_FOR_STATS, p_course: selectedCourse }),
    db().rpc("overall_stats", { p_round: selectedRound, p_min: MIN_RESPONSES_FOR_STATS }),
  ]);
  if (statsResult.error) throw statsResult.error;
  if (overallResult.error) throw overallResult.error;

  // 전체 평균: 기준이 된 센터가 너무 적으면 센터 담당자에게는 숨기고(다른 센터의 평균을 알아낼 수 있음),
  // 보여 줄 때도 소수 첫째 자리로 맞춰 정밀한 값이 화면 데이터에 남지 않게 한다.
  const overall = ((overallResult.data ?? []) as { average: number | null; center_count: number }[])[0];
  const enoughCenters = viewer.role === "company" || (overall?.center_count ?? 0) >= MIN_CENTERS_FOR_OVERALL_AVERAGE;
  const overallAverage = overall?.average != null && enoughCenters ? roundScore(Number(overall.average)) : null;

  return {
    rounds,
    selectedRound,
    courses,
    selectedCourse,
    centers: ((statsResult.data ?? []) as StatsRow[]).map(toStat),
    overallAverage,
  };
}
