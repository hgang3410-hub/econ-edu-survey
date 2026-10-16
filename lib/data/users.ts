// Design Ref: §5 User — 담당자 계정 조회. 비밀번호 암호문은 로그인 확인에만 쓰고 화면으로 내보내지 않는다.
import "server-only";
import { db } from "@/lib/data/client";
import type { UserRole } from "@/lib/data/types";
import { LOGIN_LOCK_MINUTES } from "@/lib/survey/rules";

/** 화면에서 쓸 수 있는 로그인 사용자 정보 (비밀번호 암호문 없음) */
export type Viewer = {
  id: string;
  username: string;
  role: UserRole;
  centerId: string | null;
  centerName: string | null;
};

type UserRow = {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  center_id: string | null;
  centers: { name: string } | null;
};

function toViewer(row: UserRow): Viewer {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    centerId: row.center_id,
    centerName: row.centers?.name ?? null,
  };
}

const USER_COLUMNS = "id, username, password_hash, role, center_id, centers(name)";

/** 로그인 확인용: 암호문까지 돌려주므로 이 파일 밖으로 내보내지 않는다. */
export async function findLoginUser(username: string): Promise<{ viewer: Viewer; passwordHash: string } | null> {
  const { data, error } = await db()
    .from("app_users")
    .select(USER_COLUMNS)
    .eq("username", username)
    .maybeSingle<UserRow>();
  if (error) throw error;
  return data ? { viewer: toViewer(data), passwordHash: data.password_hash } : null;
}

/** 입장권의 계정 id로 현재 역할·센터를 DB에서 다시 확인한다. */
export async function findViewerById(id: string): Promise<Viewer | null> {
  const { data, error } = await db()
    .from("app_users")
    .select(USER_COLUMNS)
    .eq("id", id)
    .maybeSingle<UserRow>();
  if (error) throw error;
  return data ? toViewer(data) : null;
}

export async function countRecentLoginFailures(username: string): Promise<number> {
  const since = new Date(Date.now() - LOGIN_LOCK_MINUTES * 60_000).toISOString();
  const { count, error } = await db()
    .from("login_attempts")
    .select("*", { count: "exact", head: true })
    .eq("username", username)
    .gte("attempted_at", since);
  if (error) throw error;
  return count ?? 0;
}

export async function recordLoginFailure(username: string): Promise<void> {
  const { error } = await db().from("login_attempts").insert({ username });
  if (error) throw error;
}

export async function clearLoginFailures(username: string): Promise<void> {
  const { error } = await db().from("login_attempts").delete().eq("username", username);
  if (error) throw error;
}
