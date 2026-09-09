import { getSupabase, getSupabaseAdmin } from "./supabase";
import { fetchGameDetail, fetchGamesByPlatform } from "./rawg";
import {
  getSampleGame,
  getSampleGamesByPlatform,
  SAMPLE_GAMES,
} from "./sample-games";
import type { Game, PlatformKind } from "./types";

// 카탈로그(이름/이미지/장르 등) 갱신 주기: 7일
const CATALOG_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function extractSteamAppId(game: Game): string | null {
  if (game.steam_appid) return game.steam_appid;
  for (const s of game.stores) {
    const m = s.url.match(/store\.steampowered\.com\/app\/(\d+)/);
    if (m) return m[1];
  }
  return null;
}

/** DB row → Game 도메인 객체 */
function rowToGame(row: Record<string, unknown>): Game {
  return {
    id: Number(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: (row.description as string) ?? null,
    background_image: (row.background_image as string) ?? null,
    genres: (row.genres as string[]) ?? [],
    platform_kinds: (row.platform_kinds as PlatformKind[]) ?? [],
    raw_platforms: (row.raw_platforms as string[]) ?? [],
    released: (row.released as string) ?? null,
    metacritic: (row.metacritic as number) ?? null,
    rawg_rating: (row.rawg_rating as number) ?? null,
    rawg_ratings_count: (row.rawg_ratings_count as number) ?? 0,
    stores: (row.stores as Game["stores"]) ?? [],
    steam_appid: (row.steam_appid as string) ?? null,
    steam_positive_pct: (row.steam_positive_pct as number) ?? null,
    steam_review_count: (row.steam_review_count as number) ?? null,
  };
}

function gameToRow(game: Game) {
  return {
    id: game.id,
    slug: game.slug,
    name: game.name,
    description: game.description,
    background_image: game.background_image,
    genres: game.genres,
    platform_kinds: game.platform_kinds,
    raw_platforms: game.raw_platforms,
    released: game.released,
    metacritic: game.metacritic,
    rawg_rating: game.rawg_rating,
    rawg_ratings_count: game.rawg_ratings_count,
    stores: game.stores,
    steam_appid: extractSteamAppId(game),
    steam_positive_pct: game.steam_positive_pct,
    steam_review_count: game.steam_review_count,
    metadata_updated_at: new Date().toISOString(),
  };
}

async function cacheGames(games: Game[]): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin || games.length === 0) return;
  const rows = games.map(gameToRow);
  const { error } = await admin.from("games").upsert(rows, { onConflict: "id" });
  if (error) console.error("[games] 캐시 upsert 실패:", error.message);
}

/**
 * 플랫폼별 게임 목록.
 * 1) Supabase 캐시에 유효한 데이터가 있으면 사용
 * 2) 없으면 RAWG 에서 가져와 캐시에 저장
 * 3) RAWG 키도 없으면 샘플 데이터
 */
export async function listGamesByPlatform(kind: PlatformKind): Promise<Game[]> {
  const supabase = getSupabase();

  if (supabase) {
    const freshAfter = new Date(Date.now() - CATALOG_TTL_MS).toISOString();
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .contains("platform_kinds", [kind])
      .gte("metadata_updated_at", freshAfter)
      .order("rawg_ratings_count", { ascending: false })
      .limit(48);
    if (!error && data && data.length > 0) {
      return data.map(rowToGame);
    }
  }

  try {
    const fromRawg = await fetchGamesByPlatform(kind);
    if (fromRawg.length > 0) {
      await cacheGames(fromRawg);
      return fromRawg;
    }
  } catch (e) {
    console.error("[games] RAWG 목록 조회 실패, 샘플로 폴백:", e);
  }

  return getSampleGamesByPlatform(kind);
}

/**
 * 게임 상세 (id 또는 slug).
 */
export async function getGame(idOrSlug: string): Promise<Game | null> {
  const supabase = getSupabase();
  const numericId = /^\d+$/.test(idOrSlug) ? Number(idOrSlug) : null;

  if (supabase) {
    const query = supabase.from("games").select("*");
    const { data } = numericId
      ? await query.eq("id", numericId).maybeSingle()
      : await query.eq("slug", idOrSlug).maybeSingle();
    if (data) {
      const game = rowToGame(data as Record<string, unknown>);
      // 상세 소개문이 아직 없으면 RAWG 에서 보강
      if (!game.description) {
        try {
          const detail = await fetchGameDetail(game.id);
          if (detail) {
            await cacheGames([detail]);
            return detail;
          }
        } catch (e) {
          console.error("[games] 상세 보강 실패:", e);
        }
      }
      return game;
    }
  }

  try {
    const detail = await fetchGameDetail(idOrSlug);
    if (detail) {
      await cacheGames([detail]);
      return detail;
    }
  } catch (e) {
    console.error("[games] RAWG 상세 조회 실패, 샘플로 폴백:", e);
  }

  return getSampleGame(idOrSlug) ?? null;
}

/** 메인 페이지용: 플랫폼별 소수의 대표 게임 */
export async function listFeatured(): Promise<Record<PlatformKind, Game[]>> {
  const [pc, mobile, console_] = await Promise.all([
    listGamesByPlatform("pc"),
    listGamesByPlatform("mobile"),
    listGamesByPlatform("console"),
  ]);
  return {
    pc: pc.slice(0, 6),
    mobile: mobile.slice(0, 6),
    console: console_.slice(0, 6),
  };
}

export { SAMPLE_GAMES };
