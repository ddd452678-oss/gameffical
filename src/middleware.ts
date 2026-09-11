import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env, hasSupabase } from "./lib/env";

/**
 * 요청마다 로그인 세션 쿠키를 갱신한다 (Supabase SSR 권장 패턴).
 * 이게 없으면 액세스 토큰이 만료됐을 때 서버 컴포넌트에서 세션이 끊긴 것처럼 보일 수 있다.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!hasSupabase) return response;

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // 세션 갱신 트리거 (반환값은 안 쓰지만 호출 자체가 쿠키를 최신화한다)
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // 정적 파일/이미지 최적화 경로는 제외
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
