import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * 아이디(username)로 비밀번호 재설정 메일 발송을 요청한다.
 * 계정 존재 여부를 노출하지 않기 위해, 아이디가 있든 없든 항상 같은 응답을 준다.
 */
export async function POST(request: Request) {
  let payload: { username?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "잘못된 요청 형식입니다." },
      { status: 400 },
    );
  }

  const username = payload.username?.trim();
  if (!username) {
    return NextResponse.json(
      { ok: false, error: "아이디를 입력해 주세요." },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdmin();
  const supabase = await getSupabaseServer();
  if (!admin || !supabase) {
    return NextResponse.json(
      { ok: false, error: "서버 설정 오류" },
      { status: 500 },
    );
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("username", username)
    .maybeSingle();

  if (profile?.email) {
    const origin = new URL(request.url).origin;
    // /auth/callback 이 code 교환(로그인 세션 발급)까지 해준 뒤 /reset-password 로 보낸다.
    await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
    });
  }

  // 계정이 있든 없든 동일한 응답 (계정 존재 여부 비노출)
  return NextResponse.json({ ok: true });
}
