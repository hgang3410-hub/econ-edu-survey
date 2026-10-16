// Design Ref: §6 — proxy.ts는 1차 확인일 뿐이므로, 실제 권한은 여기서 매 요청마다 다시 확인한다.
import "server-only";
import { readSessionUserId } from "@/lib/auth/session";
import { findViewerById, type Viewer } from "@/lib/data/users";

/** 로그인한 담당자를 돌려준다. 로그인하지 않았거나 계정이 없으면 null */
export async function getViewer(): Promise<Viewer | null> {
  const userId = await readSessionUserId();
  return userId ? findViewerById(userId) : null;
}
