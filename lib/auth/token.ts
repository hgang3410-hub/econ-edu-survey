// Design Ref: §2.2·S4 — 로그인 입장권(세션)은 HS256으로 서명한 짧은 토큰이다. 안에는 계정 id만 넣는다.
// 역할·센터는 토큰이 아니라 매 요청마다 DB에서 다시 확인한다.
import { SignJWT, jwtVerify } from "jose";
import { SESSION_HOURS } from "@/lib/survey/rules";

export const SESSION_COOKIE = "session";

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET은 32자 이상이어야 합니다.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(secretKey());
}

/** 서명과 만료를 확인하고 계정 id를 돌려준다. 올바르지 않으면 null */
export async function verifySessionToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
