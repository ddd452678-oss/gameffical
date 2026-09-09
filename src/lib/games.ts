import { getSupabase, getSupabaseAdmin } from "./supabase";
import { fetchGameDetail, fetchGamesByPlatform, searchGames } from "./rawg";
import { enrichSteamRatings, fetchSteamKoreanDescription } from "./steam";
import {
  getSampleGame,
  getSampleGamesByPlatform,
  SAMPLE_GAMES,
} from "./sample-games";
import type { Game, PlatformKind } from "./types";

// 카탈로그(이름/이미지/장르 등) 갱신 주기: 7일
const CATALOG_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// 소개문에 한글이 들어있는지 (한국어 소개 보강 여부 판단용)
const HANGUL_RE = /[가-힣]/;
// 덜 정제된 HTML 태그/엔티티 흔적 (예전 캐시 자가 치유용)
const HTML_ARTIFACT_RE = /<\/?[a-z]|&#|&[a-z]+;/i;

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
 * 상세 페이지용 보강: 소개문(RAWG) + Steam 긍정비율.
 * 변경이 있었으면 changed=true 를 함께 반환한다(캐시 재기록 판단용).
 */
async function enrichForDetail(
  game: Game,
): Promise<{ game: Game; changed: boolean }> {
  let g = game;
  let changed = false;

  // 1) 소개문이 없으면 RAWG 상세로 보강 (Steam 필드는 기존 값 유지)
  if (!g.description) {
    try {
      const detail = await fetchGameDetail(g.id);
      if (detail) {
        g = {
          ...detail,
          steam_appid: g.steam_appid ?? detail.steam_appid,
          steam_positive_pct: g.steam_positive_pct ?? detail.steam_positive_pct,
          steam_review_count: g.steam_review_count ?? detail.steam_review_count,
        };
        changed = true;
      }
    } catch (e) {
      console.error("[games] 상세 보강 실패:", e);
    }
  }

  // 2) Steam appid 확정 후 긍정비율 보강
  const appid = extractSteamAppId(g);
  if (appid && appid !== g.steam_appid) {
    g = { ...g, steam_appid: appid };
    changed = true;
  }
  const withSteam = await enrichSteamRatings(g);
  if (withSteam !== g) {
    g = withSteam;
    changed = true;
  }

  // 3) 한국어 소개 보강 (Steam 스토어)
  //    - 소개가 없거나 / 한글이 아니거나 / 예전 캐시에 HTML 흔적이 남아있으면 교체 시도
  if (
    g.steam_appid &&
    (!g.description ||
      !HANGUL_RE.test(g.description) ||
      HTML_ARTIFACT_RE.test(g.description))
  ) {
    const ko = await fetchSteamKoreanDescription(g.steam_appid);
    if (ko) {
      g = { ...g, description: ko };
      changed = true;
    }
  }

  return { game: g, changed };
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
      const { game, changed } = await enrichForDetail(
        rowToGame(data as Record<string, unknown>),
      );
      if (changed) await cacheGames([game]);
      return game;
    }
  }

  try {
    const detail = await fetchGameDetail(idOrSlug);
    if (detail) {
      const { game } = await enrichForDetail(detail);
      await cacheGames([game]);
      return game;
    }
  } catch (e) {
    console.error("[games] RAWG 상세 조회 실패, 샘플로 폴백:", e);
  }

  return getSampleGame(idOrSlug) ?? null;
}

/**
 * 이름으로 게임 검색.
 * 1) Supabase 캐시에서 이름 부분일치 (trigram 인덱스)
 * 2) 없으면 RAWG 검색 → 캐시에 저장
 * 3) RAWG 키도 없으면 샘플에서 필터
 */
export async function searchGamesByName(query: string): Promise<Game[]> {
  const q = query.trim();
  if (!q) return [];

  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .ilike("name", `%${q}%`)
      .order("rawg_ratings_count", { ascending: false })
      .limit(24);
    if (!error && data && data.length > 0) {
      return data.map(rowToGame);
    }
  }

  try {
    const results = await searchGames(q);
    if (results.length > 0) {
      await cacheGames(results);
      return results;
    }
  } catch (e) {
    console.error("[games] RAWG 검색 실패, 샘플로 폴백:", e);
  }

  const lower = q.toLowerCase();
  return SAMPLE_GAMES.filter((g) => g.name.toLowerCase().includes(lower));
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
