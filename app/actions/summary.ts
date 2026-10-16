"use server";

// Design Ref: §4.4 — 서술 의견 요약: 권한 확인 → 0건이면 호출 안 함 → 응답 수가 같으면 저장본 재사용 → AI 요약 저장.
import { refresh } from "next/cache";
import { summarizeComments } from "@/lib/ai/summarize";
import { getViewer } from "@/lib/auth/viewer";
import {
  canViewCenter,
  countCenterResponses,
  getStoredSummary,
  listComments,
  saveSummary,
} from "@/lib/data/summaries";
import { listCourseNames } from "@/lib/data/courses";
import { listRounds } from "@/lib/data/stats";

export type SummaryState = { status: "idle" | "error"; message?: string };

export async function generateSummary(_prev: SummaryState, formData: FormData): Promise<SummaryState> {
  const viewer = await getViewer();
  if (!viewer) return { status: "error", message: "로그인이 필요합니다." };

  const centerId = formData.get("centerId");
  const roundValue = formData.get("round");
  const courseValue = formData.get("course");
  if (typeof centerId !== "string" || !canViewCenter(viewer, centerId)) {
    return { status: "error", message: "볼 수 없는 센터입니다." };
  }
  // 회차 값은 이 담당자가 볼 수 있는 회차 이름일 때만 쓴다.
  const rounds = await listRounds(viewer);
  const round = typeof roundValue === "string" && rounds.includes(roundValue) ? roundValue : null;
  // 교육 이름은 이 센터에 실제로 있는 교육일 때만 쓴다.
  const courses = await listCourseNames(viewer, centerId);
  const course = typeof courseValue === "string" && courses.includes(courseValue) ? courseValue : null;

  try {
    const responseCount = await countCenterResponses(viewer, centerId, round, course);
    const stored = await getStoredSummary(viewer, centerId, round, course);
    if (stored && stored.responseCount === responseCount) {
      refresh();
      return { status: "idle" };
    }

    const comments = await listComments(viewer, centerId, round, course);
    if (comments.length === 0) return { status: "error", message: "서술 의견이 아직 없습니다." };

    const content = await summarizeComments(comments);
    await saveSummary(viewer, centerId, round, responseCount, JSON.stringify(content), course);
    refresh();
    return { status: "idle" };
  } catch (error) {
    console.error("요약 생성 실패", error instanceof Error ? error.message : "알 수 없는 오류");
    return { status: "error", message: "요약을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}
