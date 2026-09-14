import { NextResponse } from "next/server";
import { gracEnrichCached } from "@/lib/games";
import { checkCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 캐시된 게임을 GRAC(게임물관리위원회) 정보로 보강 (한국어 장르·이용등급 등).
 * Vercel 크론이 `Authorization: Bearer $CRON_SECRET` 로 호출.
 * 수동: `/api/grac-sync?key=$CRON_SECRET&limit=400`
 */
export async function GET(request: Request) {
  const authError = checkCronAuth(request);
  if (authError) return authError;

  const url = new URL(request.url);
  // 기본값을 넉넉히 잡음 - GRAC 는 RAWG 처럼 월간 쿼터가 없고, 크론이 하루
  // 1회뿐이라 카탈로그 증가 속도를 따라가려면 한 번에 최대한 많이 훑어야 한다.
  const limit = Math.min(
    Math.max(Number(url.searchParams.get("limit")) || 400, 1),
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
