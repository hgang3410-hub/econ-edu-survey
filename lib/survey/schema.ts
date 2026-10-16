// Design Ref: §4.1 — 응답 제출 값을 서버에서 다시 검사한다. (화면 검사는 우회할 수 있으므로)
// Plan SC: 3 — 점수는 정수 1~5, 서술은 문항당 500자까지, 서술은 선택(0~500자).

import { z } from "zod";
import {
  COMMENT_MAX_LENGTH,
  type CommentQuestionNumber,
  type ScoreQuestionNumber,
} from "@/lib/survey/questions";

/** 글자 수는 화면·서버·DB가 같은 기준(문자 단위, 이모지는 1자)으로 센다. */
export function countChars(value: string): number {
  return [...value].length;
}

/** 링크 주소의 값 형식: 128비트 난수를 base64url로 쓴 22자 */
export const linkIdSchema = z.string().regex(/^[A-Za-z0-9_-]{22}$/);

const scoreField = z
  .string()
  .regex(/^[1-5]$/, "1~5점 중에서 하나를 선택해 주세요.")
  .transform(Number);

const commentField = z
  .string()
  .refine((v) => countChars(v) <= COMMENT_MAX_LENGTH, `${COMMENT_MAX_LENGTH}자까지 쓸 수 있습니다.`);

const submissionSchema = z.strictObject({
  q1: scoreField, q2: scoreField, q3: scoreField, q4: scoreField,
  q5: scoreField, q6: scoreField, q7: scoreField, q8: scoreField,
  q9: commentField,
  q10: commentField,
});

export type ParsedSubmission = {
  scores: Record<ScoreQuestionNumber, number>;
  comments: Record<CommentQuestionNumber, string>;
};

export type SubmissionResult =
  | { ok: true; value: ParsedSubmission }
  | { ok: false; fieldErrors: Record<string, string> };

const FIELD_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10"] as const;

/** FormData에서 정해 둔 10개 항목만 꺼내 검사한다. (그 밖의 값은 무시) */
export function parseSubmission(formData: FormData): SubmissionResult {
  const raw: Record<string, string> = {};
  for (const key of FIELD_KEYS) {
    const value = formData.get(key);
    raw[key] = typeof value === "string" ? value : "";
  }
  const parsed = submissionSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, fieldErrors };
  }
  const d = parsed.data;
  return {
    ok: true,
    value: {
      scores: { 1: d.q1, 2: d.q2, 3: d.q3, 4: d.q4, 5: d.q5, 6: d.q6, 7: d.q7, 8: d.q8 },
      comments: { 9: d.q9, 10: d.q10 },
    },
  };
}

/** 로그인 입력 검사 */
export const loginSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(200),
});
