// Design Ref: §4.1 — 응답 저장. 링크 확인 → 마감 확인 → 제출 속도 확인 → 저장을 DB 함수(submit_response) 한 번으로 처리한다.
// 링크별 잠금 안에서 확인과 저장을 같이 하므로 동시에 많이 보내도 속도 제한을 넘을 수 없다.
// 응답은 한 번 저장하면 수정·삭제하지 않는다. (이 파일에는 수정·삭제 함수가 없다)
import "server-only";
import { db } from "@/lib/data/client";
import { MAX_RESPONSES_PER_LINK_PER_MINUTE } from "@/lib/survey/rules";
import type { ParsedSubmission } from "@/lib/survey/schema";

export type SubmitOutcome = "saved" | "invalid-link" | "closed" | "too-many";

export async function saveResponse(linkId: string, submission: ParsedSubmission): Promise<SubmitOutcome> {
  const { scores, comments } = submission;
  // 중복 제출은 막지 않지만, 한 링크로 1분에 너무 많이 들어오면 잠시 막는다. (접속 주소는 저장하지 않는다)
  const { data, error } = await db().rpc("submit_response", {
    p_link_id: linkId,
    p_q1: scores[1], p_q2: scores[2], p_q3: scores[3], p_q4: scores[4],
    p_q5: scores[5], p_q6: scores[6], p_q7: scores[7], p_q8: scores[8],
    p_q9: comments[9],
    p_q10: comments[10],
    p_max_per_minute: MAX_RESPONSES_PER_LINK_PER_MINUTE,
  });
  if (error) throw error;
  return data as SubmitOutcome;
}
