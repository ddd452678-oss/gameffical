import { NextResponse } from "next/server";
import { createComment, deleteComment } from "@/lib/posts";
import { getSupabaseServer } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await getSupabaseServer();
  if (!supabase) {
    return { error: NextResponse.json({ ok: false, error: "서버 설정 오류" }, { status: 500 }) };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: NextResponse.json(
        { ok: false, error: "로그인이 필요합니다.", requiresLogin: true },
        { status: 401 },
      ),
    };
  }
  return { supabase, user };
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  let payload: { post_id?: string; body?: string; author_name?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청 형식입니다." }, { status: 400 });
  }
  if (!payload.post_id) {
    return NextResponse.json({ ok: false, error: "게시글 id 가 필요합니다." }, { status: 400 });
  }

  const result = await createComment(
    {
      post_id: payload.post_id,
      body: String(payload.body ?? ""),
      author_name: payload.author_name,
    },
    auth.supabase,
    auth.user.id,
  );
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result, { status: 201 });
}

export async function DELETE(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  let payload: { id?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청 형식입니다." }, { status: 400 });
  }
  if (!payload.id) {
    return NextResponse.json({ ok: false, error: "댓글 id 가 필요합니다." }, { status: 400 });
  }

  const result = await deleteComment(payload.id, auth.supabase, auth.user.id);
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}
