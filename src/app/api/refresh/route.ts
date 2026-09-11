import { NextResponse } from "next/server";
import { refreshCatalog } from "@/lib/games";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 카탈로그 갱신 트리거.
 * - Vercel 크론이 `Authorization: Bearer $CRON_SECRET` 로 호출한다.
 * - 수동 호출은 `/api/refresh?key=$CRON_SECRET&pages=N`.
 * - CRON_SECRET 환경변수가 없으면 인증 없이 허용 (최악의 경우 카탈로그 재조회만 발생).
 * - pages: 이번 호출에서 플랫폼당 몇 페이지(1페이지=40개)를 가져올지. 기본 120(=4,800개).
 *   catalog_progress 커서로 이어서 조회하므로, 매일 자동 실행될수록 카탈로그가 계속
 *   넓어진다. 초기 카탈로그를 빨리 채우고 싶으면 pages 를 크게 줘서 한 번 더 호출하면 된다.
 *   (RAWG 무료 플랜 월 2만 요청 기준, 기본값은 하루치 요청량이 넉넉히 안전권에 들도록 잡음)
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

  const pages = Math.min(
    Math.max(Number(url.searchParams.get("pages")) || 120, 1),
    300,
  );

  try {
    const result = await refreshCatalog(pages);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "refresh 실패" },
      { status: 500 },
    );
  }
}
