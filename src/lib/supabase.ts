import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, hasSupabase, hasSupabaseAdmin } from "./env";

/**
 * 공개(anon) 클라이언트 — 읽기 및 리뷰 작성용.
 * 환경 변수가 없으면 null 을 반환하고, 호출부에서 폴백 처리한다.
 */
export function getSupabase(): SupabaseClient | null {
  if (!hasSupabase) return null;
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

/**
 * 서버 전용 관리자(service_role) 클라이언트 — 게임 메타데이터 캐시 쓰기용.
 * 절대 클라이언트 번들에 포함되면 안 된다 (server component / route handler 에서만 import).
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!hasSupabaseAdmin) return null;
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
}
