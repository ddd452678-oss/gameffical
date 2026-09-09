import { NextResponse } from "next/server";
import { refreshCatalog } from "@/lib/games";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 카탈로그 갱신 트리거.
 * - Vercel 크론이 `Authorization: Bearer $CRON_SECRET` 로 호출한다.
 * - 수동 호출은 `/api/refresh?key=$CRON_SECRET`.
 * - CRON_SECRET 환경변수가 없으면 인증 없이 허용 (최악의 경우 카탈로그 재조회만 발생).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const url = new URL(request.url);
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

  try {
    const result = await refreshCatalog();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "refresh 실패" },
      { status: 500 },
    );
  }
}
