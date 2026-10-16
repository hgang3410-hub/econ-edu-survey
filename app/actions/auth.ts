"use server";

// Design Ref: §4.2·S3 — 로그인: 연속 실패 제한 → 비밀번호 비교(없는 아이디도 같은 비교) → 입장권 발급.
import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/auth/password";
import { parseLoginRole } from "@/lib/auth/roles";
import { createSession, destroySession } from "@/lib/auth/session";
import {
  clearLoginFailures,
  countRecentLoginFailures,
  findLoginUser,
  recordLoginFailure,
} from "@/lib/data/users";
import { LOGIN_LOCK_MINUTES, LOGIN_MAX_FAILURES } from "@/lib/survey/rules";
import { loginSchema } from "@/lib/survey/schema";

export type LoginState = { message?: string };

const FAIL_MESSAGE = "아이디 또는 비밀번호가 올바르지 않습니다.";

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { message: FAIL_MESSAGE };
  const { username, password } = parsed.data;
  // 시작 화면에서 고른 역할. 계정의 실제 역할과 같을 때만 로그인시킨다.
  const chosenRole = parseLoginRole(formData.get("role"));
  if (!chosenRole) return { message: "시작 화면에서 역할을 먼저 선택해 주세요." };

  try {
    // 먼저 시도를 기록하고 횟수를 센다. (확인 → 기록 순서면 동시에 보낸 요청이 모두 통과한다)
    // 성공하면 아래에서 기록을 지운다. 현재 시도까지 포함해 최대 횟수를 넘으면 비밀번호를 비교하지 않고 막는다.
    await recordLoginFailure(username);
    if ((await countRecentLoginFailures(username)) > LOGIN_MAX_FAILURES) {
      return { message: `로그인에 여러 번 실패했습니다. ${LOGIN_LOCK_MINUTES}분 뒤에 다시 시도해 주세요.` };
    }

    const found = await findLoginUser(username);
    const ok = await verifyPassword(password, found?.passwordHash ?? null);
    if (!ok || !found) return { message: FAIL_MESSAGE };

    if (found.viewer.role !== chosenRole) {
      return { message: "선택한 역할과 계정이 맞지 않습니다. 시작 화면에서 역할을 다시 선택해 주세요." };
    }

    await clearLoginFailures(username);
    await createSession(found.viewer.id);
  } catch (error) {
    console.error("로그인 처리 실패", error instanceof Error ? error.message : "알 수 없는 오류");
    return { message: "로그인할 수 없습니다. 잠시 후 다시 시도해 주세요." };
  }
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}
