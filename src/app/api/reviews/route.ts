import { NextResponse } from "next/server";
import {
  createReview,
  deleteReview,
  listReviews,
  updateReview,
} from "@/lib/reviews";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { ReviewInput } from "@/lib/types";

export const dynamic = "force-dynamic";

/** 리뷰 목록 조회 — 로그인 없이 누구나. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameId = Number(searchParams.get("game_id"));
  if (!Number.isInteger(gameId)) {
    return NextResponse.json(
      { ok: false, error: "game_id 가 필요합니다." },
      { status: 400 },
    );
  }
  try {
    const reviews = await listReviews(gameId);
    return NextResponse.json({ ok: true, reviews });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "조회 실패" },
      { status: 500 },
    );
  }
}

/** 로그인한 사용자만 — 로그인 세션이 없으면 401. */
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

  let payload: ReviewInput;
  try {
    payload = (await request.json()) as ReviewInput;
  } catch {
    return NextResponse.json(
      { ok: false, error: "잘못된 요청 형식입니다." },
      { status: 400 },
    );
  }

  const result = await createReview(
    {
      game_id: Number(payload.game_id),
      author_name: payload.author_name,
      fun_rating: Number(payload.fun_rating),
      cost_burden: Number(payload.cost_burden),
      gacha_transparency:
        payload.gacha_transparency == null
          ? null
          : Number(payload.gacha_transparency),
      body: String(payload.body ?? ""),
    },
    auth.supabase,
    auth.user.id,
  );

  if (!result.ok) {
    return NextResponse.json(result, { status: result.duplicate ? 409 : 400 });
  }
  return NextResponse.json(result, { status: 201 });
}

/** 본인 리뷰 수정. body 에 id 포함. */
export async function PATCH(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  let payload: ReviewInput & { id?: string };
  try {
    payload = (await request.json()) as ReviewInput & { id?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: "잘못된 요청 형식입니다." },
      { status: 400 },
    );
  }
  if (!payload.id) {
    return NextResponse.json(
      { ok: false, error: "리뷰 id 가 필요합니다." },
      { status: 400 },
    );
  }

  const result = await updateReview(
    payload.id,
    {
      game_id: Number(payload.game_id),
      author_name: payload.author_name,
      fun_rating: Number(payload.fun_rating),
      cost_burden: Number(payload.cost_burden),
      gacha_transparency:
        payload.gacha_transparency == null
          ? null
          : Number(payload.gacha_transparency),
      body: String(payload.body ?? ""),
    },
    auth.supabase,
    auth.user.id,
  );

  if (!result.ok) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}

/** 본인 리뷰 삭제. body 에 { id }. */
export async function DELETE(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  let payload: { id?: string };
  try {
    payload = (await request.json()) as { id?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: "잘못된 요청 형식입니다." },
      { status: 400 },
    );
  }
  if (!payload.id) {
    return NextResponse.json(
      { ok: false, error: "리뷰 id 가 필요합니다." },
      { status: 400 },
    );
  }

  const result = await deleteReview(payload.id, auth.supabase, auth.user.id);
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}
