import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env, hasSupabase } from "../env";

/**
 * 요청(쿠키) 컨텍스트를 아는 Supabase 클라이언트 — 서버 컴포넌트/라우트 핸들러 전용.
 * 로그인 세션을 읽고, 이 클라이언트로 DB 쿼리를 날리면 RLS 의 auth.uid() 가
 * 정상적으로 채워진다(로그인한 사용자 본인 권한으로 실행됨).
 *
 * 라우트 핸들러(POST/PATCH/DELETE)에서는 쿠키를 다시 써야 할 수도 있어 여기서
 * set/remove 도 그대로 연결한다. 서버 컴포넌트(읽기 전용 렌더링)에서 호출할 때는
 * Next.js 가 쿠키 쓰기를 막아 예외가 날 수 있으므로 try/catch 로 무시한다
 * (다음 요청에서 미들웨어가 세션을 갱신해주므로 문제 없음).
 */
export async function getSupabaseServer() {
  if (!hasSupabase) return null;
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // 서버 컴포넌트 렌더링 중에는 쿠키를 못 쓴다 — 미들웨어가 대신 갱신해준다.
        }
      },
    },
  });
}
