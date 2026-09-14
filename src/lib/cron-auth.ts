import { NextResponse } from "next/server";

/**
 * Vercel 크론 전용 라우트(/api/refresh, /api/grac-sync) 인증.
 * CRON_SECRET 환경변수가 설정돼 있지 않으면 — 배포 시 깜빡 빠뜨리기 쉬운
 * 부분이다 — 무조건 요청을 거부한다(fail-closed). 예전엔 시크릿이 없을 때
 * 인증 검사 자체를 건너뛰어 API가 완전히 공개되는(fail-open) 문제가 있었다:
 * 그 상태로는 누구나 반복 호출해서 RAWG 월간 쿼터를 소진시키거나 GRAC 에
 * 불필요한 부하를 줄 수 있었다.
 */
export function checkCronAuth(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron] CRON_SECRET 이 설정되지 않아 요청을 거부합니다.");
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET not configured" },
      { status: 503 },
    );
  }

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
  return null;
}
