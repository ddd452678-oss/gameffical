import { NextResponse } from "next/server";
import { createReview, listReviews } from "@/lib/reviews";
import type { ReviewInput } from "@/lib/types";

export const dynamic = "force-dynamic";

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

export async function POST(request: Request) {
  let payload: ReviewInput;
  try {
    payload = (await request.json()) as ReviewInput;
  } catch {
    return NextResponse.json(
      { ok: false, error: "잘못된 요청 형식입니다." },
      { status: 400 },
    );
  }

  const result = await createReview({
    game_id: Number(payload.game_id),
    author_name: payload.author_name,
    fun_rating: Number(payload.fun_rating),
    cost_burden: Number(payload.cost_burden),
    gacha_transparency:
      payload.gacha_transparency == null
        ? null
        : Number(payload.gacha_transparency),
    body: String(payload.body ?? ""),
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result, { status: 201 });
}
