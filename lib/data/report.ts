// 결과 보고서에 쓸 숫자를 모은다. 평균·IPA·감성 비율은 AI가 아니라 이 코드가 계산한다.
// 경제교육정책팀(회사) 담당자만 쓸 수 있다.
import "server-only";
import { db } from "@/lib/data/client";
import { getCourseStats } from "@/lib/data/courses";
import { listRounds } from "@/lib/data/stats";
import type { Viewer } from "@/lib/data/users";
import { maskPersonalInfo } from "@/lib/ai/summarize";
import type { CenterRow, ItemStat, ReportFacts, Sentiment } from "@/lib/report/types";
import { SCORE_QUESTIONS } from "@/lib/survey/questions";
import { MIN_RESPONSES_FOR_STATS } from "@/lib/survey/rules";

/** AI에 보내는 센터별 서술 의견 (개인정보 가림 후, 센터·항목마다 최근 건수만) */
export type CenterComments = { center: string; good: string[]; improve: string[] };

export type ReportInput = {
  facts: ReportFacts;
  comments: CenterComments[];
};

const MAX_COMMENTS_PER_CENTER = 40;

// 키워드 기반 감성 분석: 서술 한 건에서 긍정·부정 낱말이 더 많은 쪽으로 분류한다.
const POSITIVE_WORDS = ["재미", "좋", "유익", "도움", "친절", "알차", "쉬웠", "이해", "만족", "흥미", "효과", "편하", "잘 ", "감사", "추천", "훌륭"];
const NEGATIVE_WORDS = ["아쉽", "부족", "더워", "더웠", "짧", "어렵", "불편", "좁", "시끄", "늦", "지루", "힘들", "개선", "필요", "없었", "미흡", "아쉬"];

export function classifySentiment(text: string): "positive" | "negative" | "neutral" {
  const count = (words: string[]) => words.reduce((sum, w) => sum + (text.includes(w) ? 1 : 0), 0);
  const pos = count(POSITIVE_WORDS);
  const neg = count(NEGATIVE_WORDS);
  return pos > neg ? "positive" : neg > pos ? "negative" : "neutral";
}

function gradeOf(average: number | null): string {
  if (average === null) return "산출 불가";
  if (average >= 4.5) return "매우 우수";
  if (average >= 4.0) return "우수";
  if (average >= 3.0) return "보통";
  return "미흡";
}

type ItemRow = { item: number; mean: number | string; corr_q8: number | string | null };
type StatsRow = { center_id: string; center_name: string; response_count: number | string; q1: number | null; q2: number | null; q3: number | null; q4: number | null; q5: number | null; q6: number | null; q7: number | null; q8: number | null };

async function sessionDates(round: string | null, centerId: string | null) {
  let query = db().from("sessions").select("education_date");
  if (round) query = query.eq("round_name", round);
  if (centerId) query = query.eq("center_id", centerId);
  const result = await query;
  if (result.error) throw result.error;
  return result.data as { education_date: string }[];
}

export async function buildReportInput(viewer: Viewer, round: string | null, centerId: string | null): Promise<ReportInput> {
  if (viewer.role !== "company") throw new Error("경제교육정책팀 담당자만 만들 수 있습니다.");
  const rounds = await listRounds(viewer);
  const selected = round && rounds.includes(round) ? round : null;

  const [centerResult, itemResult, sessionResult] = await Promise.all([
    db().rpc("center_stats", { p_round: selected, p_center: centerId, p_min: MIN_RESPONSES_FOR_STATS }),
    db().rpc("report_item_stats", { p_round: selected, p_min: MIN_RESPONSES_FOR_STATS, p_center: centerId }),
    sessionDates(selected, centerId),
  ]);
  if (centerResult.error) throw centerResult.error;
  if (itemResult.error) throw itemResult.error;

  const centerRows = (centerResult.data ?? []) as StatsRow[];
  const centerName = centerId ? (centerRows[0]?.center_name ?? null) : null;
  const centers: CenterRow[] = centerRows.map((c) => {
    const answers = [c.q1, c.q2, c.q3, c.q4, c.q5, c.q6, c.q7, c.q8];
    const average = answers.every((v) => v !== null) ? answers.reduce((s, v) => s + Number(v), 0) / answers.length : null;
    return { name: c.center_name, responseCount: Number(c.response_count), average };
  });
  const totalResponses = centers.reduce((s, c) => s + c.responseCount, 0);
  const qualified = centers.filter((c) => c.average !== null);

  // 종합 만족도: 응답이 충분한 센터들의 모든 응답 평균 (문항 평균들의 평균과 같다)
  const items: ItemStat[] = ((itemResult.data ?? []) as ItemRow[]).map((row) => {
    const question = SCORE_QUESTIONS.find((q) => q.number === row.item);
    return { number: row.item, label: question?.label ?? `문항 ${row.item}`, mean: Number(row.mean), importance: Number(row.corr_q8 ?? 0) };
  });
  const overallAverage = items.length > 0 ? items.reduce((s, i) => s + i.mean, 0) / items.length : null;

  // IPA: 전반적 만족도(Q8)는 기준 문항이라 제외하고, 만족도·중요도 평균을 기준선으로 4분면을 나눈다.
  const analyzable = items.filter((i) => i.number !== 8);
  const meanPerf = analyzable.reduce((s, i) => s + i.mean, 0) / (analyzable.length || 1);
  const meanImp = analyzable.reduce((s, i) => s + i.importance, 0) / (analyzable.length || 1);
  let keepItems = analyzable.filter((i) => i.mean >= meanPerf && i.importance >= meanImp).sort((a, b) => b.mean - a.mean);
  let fixItems = analyzable.filter((i) => i.mean < meanPerf && i.importance >= meanImp).sort((a, b) => a.mean - b.mean);
  // 해당하는 문항이 없으면 만족도 순위로 대신한다.
  if (keepItems.length === 0) keepItems = [...analyzable].sort((a, b) => b.mean - a.mean).slice(0, 2);
  if (fixItems.length === 0) fixItems = [...analyzable].sort((a, b) => a.mean - b.mean).slice(0, 2);

  // 직전 회차와 비교: 같은 범위(센터)에서 바로 앞 회차의 종합 만족도와의 차이
  let previous: ReportFacts["previous"] = null;
  const prevName = selected ? rounds[rounds.indexOf(selected) + 1] : undefined;
  if (prevName && overallAverage !== null) {
    const prev = await db().rpc("report_item_stats", { p_round: prevName, p_min: MIN_RESPONSES_FOR_STATS, p_center: centerId });
    if (prev.error) throw prev.error;
    const means = ((prev.data ?? []) as ItemRow[]).map((r) => Number(r.mean)).filter((v) => Number.isFinite(v));
    if (means.length === 8) {
      const average = means.reduce((sum, v) => sum + v, 0) / means.length;
      previous = { label: prevName, average, delta: overallAverage - average };
    }
  }

  // 비교 막대: 센터 하나를 골랐으면 그 센터의 교육별, 전체 센터이면 센터별
  let breakdown: CenterRow[] = centers;
  if (centerId) {
    const courseStats = await getCourseStats(viewer, centerId, selected);
    breakdown = courseStats.map((c) => ({ name: selected ? c.courseName : `${c.courseName} (${c.roundName})`, responseCount: c.responseCount, average: c.average }));
  }

  // 서술 의견: 응답이 충분한 센터만 가져와 개인정보를 가리고, 감성 분석은 가져온 전체로 한다.
  const sentiment: Sentiment = { total: 0, positive: 0, negative: 0, neutral: 0 };
  const comments: CenterComments[] = [];
  for (const row of centerRows) {
    const rowsResult = await db().rpc("comment_rows", { p_center: row.center_id, p_round: selected, p_limit: 200 });
    if (rowsResult.error) throw rowsResult.error;
    const rows = (rowsResult.data ?? []) as { q9: string; q10: string }[];
    const good: string[] = [];
    const improve: string[] = [];
    for (const r of rows) {
      for (const [text, bucket] of [[r.q9, good], [r.q10, improve]] as const) {
        const clean = maskPersonalInfo(text.trim());
        if (!clean) continue;
        const kind = classifySentiment(clean);
        sentiment.total += 1;
        sentiment[kind] += 1;
        if (bucket.length < MAX_COMMENTS_PER_CENTER) bucket.push(clean);
      }
    }
    if (good.length > 0 || improve.length > 0) comments.push({ center: row.center_name, good, improve });
  }

  const dates = sessionResult.map((s) => s.education_date).sort();
  const firstEducationDate = dates[0] ?? null;
  const lastEducationDate = dates[dates.length - 1] ?? null;

  return {
    facts: {
      scopeLabel: selected ?? "전체 회차",
      centerName,
      breakdownKind: centerId ? "course" : "center",
      previous,
      year: Number((lastEducationDate ?? new Date().toISOString()).slice(0, 4)),
      firstEducationDate,
      lastEducationDate,
      totalResponses,
      participatingCenters: centers.filter((c) => c.responseCount > 0).length,
      qualifiedCenters: qualified.length,
      overallAverage,
      grade: gradeOf(overallAverage),
      sentiment,
      breakdown,
      items,
      keepItems,
      fixItems,
    },
    comments,
  };
}

/** 보고서에서 고를 수 있는 센터 목록 (경제교육정책팀 담당자만) */
export async function listCenters(viewer: Viewer): Promise<{ id: string; name: string }[]> {
  if (viewer.role !== "company") return [];
  const { data, error } = await db().from("centers").select("id, name").order("name");
  if (error) throw error;
  return data as { id: string; name: string }[];
}
