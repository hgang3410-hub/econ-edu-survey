"use server";

// Design Ref: §4.1 — 응답 제출: 값 검사 → 링크·마감 확인 → 저장. 수정·삭제 동작은 만들지 않는다.
import { saveResponse } from "@/lib/data/responses";
import { linkIdSchema, parseSubmission } from "@/lib/survey/schema";

export type SubmitState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export async function submitSurvey(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  const linkId = formData.get("linkId");
  if (typeof linkId !== "string" || !linkIdSchema.safeParse(linkId).success) {
    return { status: "error", message: "유효하지 않은 링크입니다." };
  }

  const parsed = parseSubmission(formData);
  if (!parsed.ok) {
    return { status: "error", message: "입력한 내용을 다시 확인해 주세요.", fieldErrors: parsed.fieldErrors };
  }

  try {
    const outcome = await saveResponse(linkId, parsed.value);
    if (outcome === "saved") return { status: "success" };
    if (outcome === "closed") return { status: "error", message: "마감되어 제출되지 않았습니다." };
    if (outcome === "too-many") return { status: "error", message: "지금 제출이 몰리고 있습니다. 잠시 후 다시 시도해 주세요." };
    return { status: "error", message: "유효하지 않은 링크입니다." };
  } catch (error) {
    // 서술 원문이 남지 않도록 오류 종류만 기록한다.
    console.error("응답 저장 실패", error instanceof Error ? error.message : "알 수 없는 오류");
    return { status: "error", message: "저장하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}
