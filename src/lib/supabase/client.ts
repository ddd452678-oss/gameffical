"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env, hasSupabase } from "../env";

/**
 * 브라우저(클라이언트 컴포넌트) 전용 Supabase 클라이언트.
 * 로그인/로그아웃, 세션 구독(onAuthStateChange) 등에 사용한다.
 * 환경 변수가 없으면 null — 호출부에서 로그인 UI 자체를 숨긴다.
 */
export function getSupabaseBrowser() {
  if (!hasSupabase) return null;
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
