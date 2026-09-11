import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

/** "abcdef" -> "ab****" (앞 2글자만 보여주고 나머지는 마스킹) */
function maskUsername(username: string): string {
  if (username.length <= 2) return username[0] + "*".repeat(username.length - 1);
  return username.slice(0, 2) + "*".repeat(username.length - 2);
}

/** 가입한 이메일로 아이디(username) 찾기. */
export async function POST(request: Request) {
  let payload: { email?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "잘못된 요청 형식입니다." },
      { status: 400 },
    );
  }

  const email = payload.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json(
      { ok: false, error: "이메일을 입력해 주세요." },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "서버 설정 오류" },
      { status: 500 },
    );
  }

  const { data } = await admin
    .from("profiles")
    .select("username")
    .eq("email", email)
    .not("username", "is", null)
    .maybeSingle();

  if (!data?.username) {
    return NextResponse.json({
      ok: true,
      found: false,
    });
  }

  return NextResponse.json({
    ok: true,
    found: true,
    maskedUsername: maskUsername(data.username),
  });
}
