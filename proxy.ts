// Design Ref: §6 — 로그인하지 않은 사람을 로그인 화면으로 보내는 1차 확인이다.
// 실제 권한(역할·센터)은 lib/auth/viewer.ts와 lib/data에서 매번 다시 확인한다.
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/token";

export async function proxy(request: NextRequest) {
  const userId = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!userId) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
