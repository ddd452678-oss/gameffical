import { NextResponse } from "next/server";
import { gracEnrichCached } from "@/lib/games";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 캐시된 게임을 GRAC(게임물관리위원회) 정보로 보강 (한국어 장르·이용등급 등).
 * Vercel 크론이 `Authorization: Bearer $CRON_SECRET` 로 호출.
 * 수동: `/api/grac-sync?key=$CRON_SECRET&limit=150`
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    const provided =
      url.searchParams.get("key") ??
      (auth?.startsWith("Bearer ") ? auth.slice(7) : null);
    if (provided !== secret) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }
  }

  const limit = Math.min(
    Math.max(Number(url.searchParams.get("limit")) || 150, 1),
    400,
  );

  try {
    const result = await gracEnrichCached(limit);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "grac-sync 실패" },
      { status: 500 },
    );
  }
}
