// Design Ref: §2.2·S4 — 쿠키는 HttpOnly·SameSite=Lax(운영에서는 Secure), 8시간 뒤 만료.
import "server-only";
import { cookies } from "next/headers";
import { SESSION_HOURS } from "@/lib/survey/rules";
import { SESSION_COOKIE, signSessionToken, verifySessionToken } from "@/lib/auth/token";

export async function createSession(userId: string): Promise<void> {
  const token = await signSessionToken(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** 쿠키의 입장권이 올바르면 계정 id를 돌려준다. */
export async function readSessionUserId(): Promise<string | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}
