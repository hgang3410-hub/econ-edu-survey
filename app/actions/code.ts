"use server";

// 프로토타입: 수강생이 입력한 숫자 6자리 코드로 설문 링크를 찾아 그 설문으로 보낸다.
import { redirect } from "next/navigation";
import { findLinkIdByCode } from "@/lib/data/links";

export type CodeState = { message?: string };

export async function enterWithCode(_prev: CodeState, formData: FormData): Promise<CodeState> {
  const code = String(formData.get("code") ?? "").trim();
  if (!/^[0-9]{6}$/.test(code)) return { message: "숫자 6자리를 입력해 주세요." };

  let linkId: Awaited<ReturnType<typeof findLinkIdByCode>>;
  try {
    linkId = await findLinkIdByCode(code);
  } catch (error) {
    console.error("코드 확인 실패", error instanceof Error ? error.message : "알 수 없는 오류");
    return { message: "코드를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요." };
  }
  if (linkId === "too_many") return { message: "잘못된 코드 입력이 많았습니다. 잠시 후 다시 시도해 주세요." };
  if (!linkId) return { message: "없는 코드입니다. 담당자에게 받은 숫자 6자리를 다시 확인해 주세요." };
  redirect(`/survey/${linkId}`);
}
