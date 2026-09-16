import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * 회원탈퇴. 로그인 세션에서 본인 확인 후 관리자 API 로 계정을 삭제한다.
 * profiles/reviews/posts/game_likes/review_likes 는 전부 auth.users 를
 * on delete cascade 로 참조하고 있어 자동으로 같이 정리된다.
 */
export async function POST() {
  const supabase = await getSupabaseServer();
  const admin = getSupabaseAdmin();
  if (!supabase || !admin) {
    return NextResponse.json({ ok: false, error: "서버 설정 오류" }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
