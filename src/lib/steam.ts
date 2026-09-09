import type { Game } from "./types";

const STEAM_APPREVIEWS = "https://store.steampowered.com/appreviews";

export interface SteamReviewSummary {
  positivePct: number; // 0~100
  reviewCount: number;
}

/**
 * Steam 스토어 공개 엔드포인트에서 긍정 리뷰 비율 / 총 리뷰 수를 가져온다.
 * 이 지표는 API 키 없이 조회 가능하다 (STEAM_API_KEY 는 다른 확장용).
 * 실패하거나 리뷰가 없으면 null.
 */
export async function fetchSteamReviewSummary(
  appid: string,
): Promise<SteamReviewSummary | null> {
  try {
    const url =
      `${STEAM_APPREVIEWS}/${appid}?json=1` +
      `&language=all&purchase_type=all&num_per_page=0&filter=all`;
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 6 } }); // 6시간
    if (!res.ok) return null;
    const json = (await res.json()) as {
      success?: number;
      query_summary?: { total_positive?: number; total_reviews?: number };
    };
    if (json.success !== 1 || !json.query_summary) return null;
    const positive = json.query_summary.total_positive ?? 0;
    const total = json.query_summary.total_reviews ?? 0;
    if (total <= 0) return null;
    return {
      positivePct: Math.round((positive / total) * 100),
      reviewCount: total,
    };
  } catch {
    return null;
  }
}

/**
 * 게임에 Steam appid 가 있고 긍정비율이 아직 없으면 Steam 지표를 채워 반환한다.
 * 항상 새 객체를 반환하지 않는다 — 변경이 없으면 입력을 그대로 돌려준다(호출부에서 참조 비교 가능).
 */
export async function enrichSteamRatings(game: Game): Promise<Game> {
  const appid = game.steam_appid;
  if (!appid) return game;
  if (game.steam_positive_pct != null) return game;

  const summary = await fetchSteamReviewSummary(appid);
  if (!summary) return game;

  return {
    ...game,
    steam_positive_pct: summary.positivePct,
    steam_review_count: summary.reviewCount,
  };
}
