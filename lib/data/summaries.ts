// Design Ref: §4.4 — 서술 의견 요약의 권한 확인·저장. 요약 결과만 저장하고 서술 원문은 저장하지 않는다.
import "server-only";
import { db } from "@/lib/data/client";
import type { Viewer } from "@/lib/data/users";
import { ALL_ROUNDS_LABEL } from "@/lib/survey/rules";

/** 이 담당자가 해당 센터를 볼 수 있는가 */
export function canViewCenter(viewer: Viewer, centerId: string): boolean {
  return viewer.role === "company" || viewer.centerId === centerId;
}

/** 권한이 없으면 오류를 던진다. 요약·서술 원문을 다루는 모든 함수가 가장 먼저 호출한다. */
function assertCanView(viewer: Viewer, centerId: string): void {
  if (!canViewCenter(viewer, centerId)) throw new Error("볼 수 없는 센터입니다.");
}

export type StoredSummary = {
  responseCount: number;
  content: string;
  createdAt: string;
};

/** 교육별 비교 요약을 저장할 때 쓰는 교육 이름 칸의 예약값 */
export const COMPARE_KEY = "__compare__";

export async function getStoredSummary(viewer: Viewer, centerId: string, round: string | null, course: string | null = null): Promise<StoredSummary | null> {
  assertCanView(viewer, centerId);
  const { data, error } = await db()
    .from("summaries")
    .select("response_count, content, created_at")
    .eq("center_id", centerId)
    .eq("round_name", round ?? ALL_ROUNDS_LABEL)
    .eq("course_name", course ?? "")
    .maybeSingle<{ response_count: number; content: string; created_at: string }>();
  if (error) throw error;
  return data ? { responseCount: data.response_count, content: data.content, createdAt: data.created_at } : null;
}

export async function saveSummary(viewer: Viewer, centerId: string, round: string | null, responseCount: number, content: string, course: string | null = null): Promise<void> {
  assertCanView(viewer, centerId);
  const { error } = await db().from("summaries").upsert(
    {
      center_id: centerId,
      round_name: round ?? ALL_ROUNDS_LABEL,
      course_name: course ?? "",
      response_count: responseCount,
      content,
      created_at: new Date().toISOString(),
    },
    { onConflict: "center_id,round_name,course_name" },
  );
  if (error) throw error;
}

/** 요약에 쓰는 서술 의견의 최대 건수 (최근 순). 화면에도 "최근 200건 기준"이라고 알린다. */
export const MAX_COMMENTS_FOR_SUMMARY = 200;

/** 요약할 서술 의견 원문 (최근 순, 최대 200건) */
export async function listComments(viewer: Viewer, centerId: string, round: string | null, course: string | null = null): Promise<{ q9: string; q10: string }[]> {
  assertCanView(viewer, centerId);
  const { data, error } = await db().rpc("comment_rows", { p_center: centerId, p_round: round, p_limit: MAX_COMMENTS_FOR_SUMMARY, p_course: course });
  if (error) throw error;
  return (data ?? []) as { q9: string; q10: string }[];
}

/** 센터 하나의 응답 수 (회차 조건 포함) */
export async function countCenterResponses(viewer: Viewer, centerId: string, round: string | null, course: string | null = null): Promise<number> {
  assertCanView(viewer, centerId);
  const { data, error } = await db().rpc("center_stats", { p_round: round, p_center: centerId, p_min: 0, p_course: course });
  if (error) throw error;
  const rows = (data ?? []) as { response_count: number | string }[];
  return Number(rows[0]?.response_count ?? 0);
}
