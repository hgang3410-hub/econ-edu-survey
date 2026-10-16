// Design Ref: §2.4 — Supabase는 서버 코드에서만, 서버 전용 비공개 키로 접근한다.
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | undefined;

/** 서버 전용 Supabase 클라이언트 (RLS를 우회하므로 권한 확인은 lib/data에서 직접 한다) */
export function db(): SupabaseClient {
  if (!cached) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) {
      throw new Error("SUPABASE_URL, SUPABASE_SECRET_KEY 환경 변수가 필요합니다.");
    }
    cached = createClient(url, key, { auth: { persistSession: false } });
  }
  return cached;
}
