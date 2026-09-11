import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSupabaseServer } from "@/lib/supabase/server";

const GENERIC_ERROR = "아이디 또는 비밀번호가 올바르지 않습니다.";

/**
 * 아이디(username) + 비밀번호 로그인.
 * Supabase Auth 는 이메일/전화번호로만 로그인이 가능해서, username → email
 * 을 서버에서 먼저 찾은 뒤 그 이메일로 signInWithPassword 를 대신 호출한다.
 * (계정 존재 여부를 노출하지 않기 위해 실패 사유는 항상 동일한 메시지로 응답)
 */
export async function POST(request: Request) {
  let payload: { username?: string; password?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "잘못된 요청 형식입니다." },
      { status: 400 },
    );
  }

  const username = payload.username?.trim();
  const password = payload.password;
  if (!username || !password) {
    return NextResponse.json(
      { ok: false, error: "아이디와 비밀번호를 입력해 주세요." },
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
    .select("user_id")
    .eq("username", username)
    .maybeSingle();
  if (!profile) {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 401 });
  }

  const { data: userResp, error: userErr } = await admin.auth.admin.getUserById(
    profile.user_id,
  );
  if (userErr || !userResp.user?.email) {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 401 });
  }

  // 이 호출은 쿠키를 아는 서버 클라이언트로 해야 로그인 세션이 응답에 실린다.
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: userResp.user.email,
    password,
  });
  if (signInErr) {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
