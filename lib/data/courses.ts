// 교육(course)별 분석용 데이터: 한 센터의 교육 목록과, 교육·회차별 응답 수와 문항별 평균.
// 모든 함수는 로그인한 담당자(viewer)를 받아 그 센터를 볼 수 있는지 먼저 확인한다.
import "server-only";
import { db } from "@/lib/data/client";
import { canViewCenter } from "@/lib/data/summaries";
import type { Viewer } from "@/lib/data/users";
import { MIN_RESPONSES_FOR_STATS } from "@/lib/survey/rules";

export type CourseStat = {
  courseName: string;
  roundName: string;
  /** 교육일 (YYYY-MM-DD) */
  educationDate: string;
  responseCount: number;
  /** 응답이 충분한가 (5건 미만이면 평균을 내보내지 않는다) */
  hasEnough: boolean;
  /** 문항 1~8번 평균. 응답 부족이면 null */
  questionAverages: number[] | null;
  /** 8문항 전체 평균. 응답 부족이면 null */
  average: number | null;
};

type CourseRow = {
  course_name: string;
  round_name: string;
  education_date: string;
  response_count: number | string;
  q1: number | null; q2: number | null; q3: number | null; q4: number | null;
  q5: number | null; q6: number | null; q7: number | null; q8: number | null;
};

function assertCanView(viewer: Viewer, centerId: string): void {
  if (!canViewCenter(viewer, centerId)) throw new Error("볼 수 없는 센터입니다.");
}

/** 한 센터가 가진 교육 이름 목록 (이름이 있는 것만, 교육일 순) */
export async function listCourseNames(viewer: Viewer, centerId: string): Promise<string[]> {
  assertCanView(viewer, centerId);
  const { data, error } = await db()
    .from("sessions")
    .select("course_name, education_date")
    .eq("center_id", centerId)
    .neq("course_name", "")
    .returns<{ course_name: string; education_date: string }[]>();
  if (error) throw error;
  const first = new Map<string, string>();
  for (const row of data) {
    const prev = first.get(row.course_name);
    if (!prev || prev > row.education_date) first.set(row.course_name, row.education_date);
  }
  return [...first.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([name]) => name);
}

/** 한 센터의 교육·회차별 집계 (회차를 고르면 그 회차만) */
export async function getCourseStats(viewer: Viewer, centerId: string, round: string | null): Promise<CourseStat[]> {
  assertCanView(viewer, centerId);
  const { data, error } = await db().rpc("course_stats", { p_center: centerId, p_round: round, p_min: MIN_RESPONSES_FOR_STATS });
  if (error) throw error;
  return ((data ?? []) as CourseRow[]).map((row) => {
    const responseCount = Number(row.response_count);
    const answers = [row.q1, row.q2, row.q3, row.q4, row.q5, row.q6, row.q7, row.q8];
    const hasEnough = responseCount >= MIN_RESPONSES_FOR_STATS && answers.every((v) => v !== null);
    const questionAverages = hasEnough ? answers.map(Number) : null;
    const average = questionAverages ? questionAverages.reduce((sum, v) => sum + v, 0) / questionAverages.length : null;
    return { courseName: row.course_name, roundName: row.round_name, educationDate: row.education_date, responseCount, hasEnough, questionAverages, average };
  });
}
