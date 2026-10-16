"use server";

// 교육별 AI 요약·비교 만들기: 권한 확인 → 교육마다 서술 요약(응답 수가 같으면 저장본 재사용) → 교육이 2개 이상이면 비교 요약.
import { refresh } from "next/cache";
import { compareCourses, type CourseForCompare } from "@/lib/ai/compare";
import { summarizeComments } from "@/lib/ai/summarize";
import { getViewer } from "@/lib/auth/viewer";
import { getCourseStats } from "@/lib/data/courses";
import { listRounds } from "@/lib/data/stats";
import { canViewCenter, COMPARE_KEY, getStoredSummary, listComments, saveSummary } from "@/lib/data/summaries";

export type CourseInsightState = { status: "idle" | "error"; message?: string };

export async function generateCourseInsights(_prev: CourseInsightState, formData: FormData): Promise<CourseInsightState> {
  const viewer = await getViewer();
  if (!viewer) return { status: "error", message: "로그인이 필요합니다." };

  const centerId = formData.get("centerId");
  const roundValue = formData.get("round");
  if (typeof centerId !== "string" || !canViewCenter(viewer, centerId)) return { status: "error", message: "볼 수 없는 센터입니다." };
  const rounds = await listRounds(viewer);
  const round = typeof roundValue === "string" && rounds.includes(roundValue) ? roundValue : null;

  try {
    const stats = await getCourseStats(viewer, centerId, round);
    // 같은 교육이 여러 회차에 있으면 교육 이름 기준으로 합친다.
    const byCourse = new Map<string, { count: number; rows: typeof stats }>();
    for (const row of stats) {
      const entry = byCourse.get(row.courseName) ?? { count: 0, rows: [] };
      entry.count += row.responseCount;
      entry.rows.push(row);
      byCourse.set(row.courseName, entry);
    }

    // 교육별 요약 (서술 의견이 있고, 저장된 요약이 낡았거나 없을 때만 새로 만든다)
    await Promise.all(
      [...byCourse.entries()].map(async ([courseName, entry]) => {
        if (entry.count === 0 || !courseName) return;
        const stored = await getStoredSummary(viewer, centerId, round, courseName);
        if (stored && stored.responseCount === entry.count) return;
        const comments = await listComments(viewer, centerId, round, courseName);
        if (comments.length === 0) return;
        const content = await summarizeComments(comments);
        await saveSummary(viewer, centerId, round, entry.count, JSON.stringify(content), courseName);
      }),
    );

    // 교육 비교 요약: 교육×회차마다 한 항목으로 비교한다. (점수를 비교할 수 있는 항목이 2개 이상일 때)
    const rowsWithResponses = stats.filter((row) => row.courseName && row.responseCount > 0).slice(0, 6);
    const comparable = rowsWithResponses.filter((row) => row.hasEnough && row.average !== null);
    if (comparable.length >= 2) {
      const total = rowsWithResponses.reduce((sum, row) => sum + row.responseCount, 0);
      const stored = await getStoredSummary(viewer, centerId, round, COMPARE_KEY);
      if (!(stored && stored.responseCount === total)) {
        const forCompare: CourseForCompare[] = await Promise.all(
          rowsWithResponses.map(async (row) => {
            const comments = await listComments(viewer, centerId, row.roundName, row.courseName);
            return {
              courseName: row.courseName,
              roundName: row.roundName,
              responseCount: row.responseCount,
              average: row.average,
              questionAverages: row.questionAverages,
              good: comments.map((c) => c.q9).filter(Boolean),
              improve: comments.map((c) => c.q10).filter(Boolean),
            };
          }),
        );
        const content = await compareCourses(forCompare);
        await saveSummary(viewer, centerId, round, total, JSON.stringify(content), COMPARE_KEY);
      }
    }
    refresh();
    return { status: "idle" };
  } catch (error) {
    console.error("교육별 요약 실패", error instanceof Error ? error.message : "알 수 없는 오류");
    return { status: "error", message: "교육별 요약을 만들지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}
