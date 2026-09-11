import { getSupabase, getSupabaseAdmin } from "./supabase";
import {
  fetchGameDetail,
  fetchGamesByPlatform,
  fetchGamesByTitles,
  searchGames,
} from "./rawg";
import { enrichSteamRatings, fetchSteamKoreanDescription } from "./steam";
import { applyGrac, pickGracMatch, searchGrac, type GracItem } from "./grac";
import { SEED_GAMES, SEED_KO_BY_EN, SEED_TITLES } from "./seed-titles";
import {
  getSampleGame,
  getSampleGamesByPlatform,
  SAMPLE_GAMES,
} from "./sample-games";
import type { Game, PlatformKind } from "./types";

// Supabase(PostgREST) 기본 응답 행 제한과 맞춰 안전하게 잡은 상한.
// 카탈로그 자체는 refreshPlatformCatalog 가 계속 넓혀가며, 목록 페이지는 이 안에서
// 페이지네이션한다 ([platform]/page.tsx 참고).
const PLATFORM_LIST_LIMIT = 1000;

// 카탈로그(이름/이미지/장르 등) 갱신 주기: 7일
const CATALOG_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// 시드 타이틀(국내/주요 게임) 정규화 집합 — 목록 상단 노출용
const SEED_NORM = new Set(
  SEED_TITLES.map((t) => t.toLowerCase().replace(/[^a-z0-9]/g, "")),
);
const KOREAN_PUBLISHER_RE =
  /넥슨|엔씨|엔씨소프트|스마일게이트|카카오게임즈|넷마블|펄어비스|위메이드|그라비티|웹젠|네오위즈|엑스엘게임즈|나딕|시프트업|라이엇게임즈코리아|블루홀|크래프톤|호요버스|호요|미호요/;

/**
 * 실제 국내(한국) 게임사 배급/개발 게임 판별용 — GRAC 등록 업체명(publisher) 기준.
 * 위 KOREAN_PUBLISHER_RE 는 "한국 유저 관련도"(목록 노출 우선순위) 용도라
 * 라이엇게임즈코리아·호요버스처럼 해외 원산 게임의 한국 법인/배급명도 포함하지만,
 * 국내/해외 카테고리 분류는 실제 한국 게임사만 좁혀서 사용한다.
 */
const DOMESTIC_PUBLISHER_RE =
  /넥슨|엔씨소프트|스마일게이트|카카오게임즈|넷마블|펄어비스|위메이드|그라비티|웹젠|네오위즈|엑스엘게임즈|나딕|시프트업|블루홀|크래프톤|컴투스|데브시스터즈|라인게임즈/;

/**
 * 국내(한국) 게임 여부. GRAC 로 배급사 정보가 채워진 게임만 판별 가능하므로
 * best-effort 이며, 정보가 없으면 해외 카테고리로 분류된다.
 */
export function isDomesticGame(game: Game): boolean {
  return !!game.publisher && DOMESTIC_PUBLISHER_RE.test(game.publisher);
}

/** 정규화된 영문명 매칭 키 (공백/기호 제거, 소문자) */
function normKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** 한글 이름이 비어있으면 시드 목록의 한글명으로 채운다 (GRAC 매칭값이 우선). */
function withSeedKoName(game: Game): Game {
  if (game.name_ko) return game;
  const ko = SEED_KO_BY_EN[normKey(game.name)];
  return ko ? { ...game, name_ko: ko } : game;
}

/**
 * 국내 게임 노출 우선도. RAWG 평점 참여자 수만으로는 국내 게임이 목록 밖으로
 * 밀려나므로, 시드 타이틀 / GRAC 매칭 / 국내 배급사 게임을 앞으로 끌어올린다.
 */
function koreanRelevance(g: Game): number {
  let s = 0;
  if (SEED_NORM.has(g.name.toLowerCase().replace(/[^a-z0-9]/g, ""))) s += 2;
  if (g.genres_ko.length > 0) s += 1;
  if (g.publisher && KOREAN_PUBLISHER_RE.test(g.publisher)) s += 1;
  return s;
}

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

/**
 * DB row → Game 도메인 객체.
 * name_ko 가 DB 에 아직 캐시되지 않은 기존 행(마이그레이션 이전에 저장된 게임)도
 * 있으므로, 매번 시드 목록 폴백을 적용해 즉시 한글명이 보이도록 한다.
 */
function rowToGame(row: Record<string, unknown>): Game {
  return withSeedKoName({
    id: Number(row.id),
    slug: String(row.slug),
    name: String(row.name),
    name_ko: (row.name_ko as string) ?? null,
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
    genres_ko: (row.genres_ko as string[]) ?? [],
    age_rating: (row.age_rating as string) ?? null,
    content_descriptors: (row.content_descriptors as string[]) ?? [],
    publisher: (row.publisher as string) ?? null,
    source: (row.source as string) ?? "rawg",
  });
}

function gameToRow(game: Game) {
  return {
    id: game.id,
    slug: game.slug,
    name: game.name,
    name_ko: game.name_ko ?? null,
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
    genres_ko: game.genres_ko ?? [],
    age_rating: game.age_rating ?? null,
    content_descriptors: game.content_descriptors ?? [],
    publisher: game.publisher ?? null,
    source: game.source ?? "rawg",
    metadata_updated_at: new Date().toISOString(),
  };
}

async function cacheGames(games: Game[]): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin || games.length === 0) return;
  const rows = games.map((g) => gameToRow(withSeedKoName(g)));
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
      .limit(PLATFORM_LIST_LIMIT);
    if (!error && data && data.length > 0) {
      // 국내 게임(시드/GRAC/국내 배급사)을 앞으로, 그다음 RAWG 인기순
      const games = data.map((r) => rowToGame(r as Record<string, unknown>));
      games.sort(
        (a, b) =>
          koreanRelevance(b) - koreanRelevance(a) ||
          b.rawg_ratings_count - a.rawg_ratings_count,
      );
      return games.slice(0, PLATFORM_LIST_LIMIT);
    }
  }

  try {
    // 캐시 미스 시 즉시 응답용으로는 2페이지만 (깊은 채우기는 refreshCatalog/크론이 담당)
    const { games: fromRawg0 } = await fetchGamesByPlatform(kind, { maxPages: 2 });
    const fromRawg = fromRawg0.map(withSeedKoName);
    if (fromRawg.length > 0) {
      await cacheGames(fromRawg);
      return fromRawg;
    }
  } catch (e) {
    console.error("[games] RAWG 목록 조회 실패, 샘플로 폴백:", e);
  }

  return getSampleGamesByPlatform(kind);
}

const PLATFORM_KINDS: PlatformKind[] = ["pc", "mobile", "console"];

/**
 * 플랫폼 하나를 진행 커서(catalog_progress)부터 이어서 조회한다.
 * Supabase 가 없으면(로컬 키 없이 개발 등) 커서 없이 매번 1페이지부터 조회한다.
 */
async function refreshPlatformCatalog(
  kind: PlatformKind,
  maxPages: number,
): Promise<{ games: Game[]; totalPages: number }> {
  const admin = getSupabaseAdmin();
  let startPage = 1;
  if (admin) {
    const { data } = await admin
      .from("catalog_progress")
      .select("next_page")
      .eq("platform_kind", kind)
      .maybeSingle();
    if (data?.next_page) startPage = data.next_page;
  }

  const { games, nextPage, totalPages } = await fetchGamesByPlatform(kind, {
    startPage,
    maxPages,
  });

  if (admin) {
    const { error } = await admin.from("catalog_progress").upsert(
      {
        platform_kind: kind,
        next_page: nextPage,
        total_pages: totalPages,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "platform_kind" },
    );
    if (error) console.error("[games] catalog_progress 저장 실패:", error.message);
  }

  return { games, totalPages };
}

/**
 * 카탈로그 전체 갱신: 3개 플랫폼을 진행 커서 기준으로 이어서 조회 + 국내 게임
 * 시드 타이틀을 RAWG 에서 가져와 Supabase 에 캐시한다.
 * /api/refresh 라우트와 Vercel 크론이 호출. 호출마다 플랫폼별 다음 구간을 가져오므로
 * (RAWG count 를 넘어서면 1페이지로 순환) 매일 실행할수록 카탈로그가 계속 넓어진다.
 */
export async function refreshCatalog(pagesPerPlatform = 120): Promise<{
  ok: true;
  platforms: Record<PlatformKind, number>;
  totalPages: Record<PlatformKind, number>;
  seeded: number;
  cached: number;
}> {
  const [pc, mobile, console_, seeded] = await Promise.all([
    refreshPlatformCatalog("pc", pagesPerPlatform),
    refreshPlatformCatalog("mobile", pagesPerPlatform),
    refreshPlatformCatalog("console", pagesPerPlatform),
    fetchGamesByTitles(SEED_TITLES),
  ]);

  const byId = new Map<number, Game>();
  for (const g of [...pc.games, ...mobile.games, ...console_.games, ...seeded]) {
    byId.set(g.id, g);
  }
  const all = [...byId.values()];
  await cacheGames(all);

  return {
    ok: true,
    platforms: {
      pc: pc.games.length,
      mobile: mobile.games.length,
      console: console_.games.length,
    },
    totalPages: {
      pc: pc.totalPages,
      mobile: mobile.totalPages,
      console: console_.totalPages,
    },
    seeded: seeded.length,
    cached: all.length,
  };
}

/**
 * 캐시된 게임을 GRAC(게임물관리위원회) 정보로 보강한다.
 * genres_ko 가 아직 비어있는 게임을 이름으로 조회 → 매칭되면 한국어 장르·등급·
 * 내용정보·배급사(및 한국어 개요)를 채운다. 한 번에 limit 개씩 처리(크론이 반복).
 */
export async function gracEnrichCached(limit = 150): Promise<{
  ok: true;
  scanned: number;
  matched: number;
  updated: number;
}> {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: true, scanned: 0, matched: 0, updated: 0 };

  const { data, error } = await admin
    .from("games")
    .select("*")
    .order("rawg_ratings_count", { ascending: false })
    .limit(1000);
  if (error || !data || data.length === 0) {
    return { ok: true, scanned: 0, matched: 0, updated: 0 };
  }

  const games = data
    .map((r) => rowToGame(r as Record<string, unknown>))
    // genres_ko 가 비어있거나(미보강) name_ko 만 아직 없는(name_ko 기능 추가 이전에
    // 보강된) 게임도 다시 스캔한다.
    .filter((g) => g.genres_ko.length === 0 || !g.name_ko)
    .slice(0, limit);
  if (games.length === 0) {
    return { ok: true, scanned: 0, matched: 0, updated: 0 };
  }
  const patched: Game[] = [];
  const BATCH = 6;
  for (let i = 0; i < games.length; i += BATCH) {
    const slice = games.slice(i, i + BATCH);
    const results = await Promise.all(
      slice.map(async (g) => {
        // 영문명 + (시드에 있으면) 한글 별칭 둘 다로 조회
        const koAlias =
          SEED_KO_BY_EN[g.name.toLowerCase().replace(/[^a-z0-9]/g, "")];
        const queries = koAlias ? [koAlias, g.name] : [g.name];
        const lists = await Promise.all(queries.map((q) => searchGrac(q)));
        const flat: GracItem[] = lists.flat();
        for (const q of queries) {
          const match = pickGracMatch(q, flat);
          if (match) return applyGrac(g, match);
        }
        return null;
      }),
    );
    for (const r of results) if (r) patched.push(r);
  }

  // patched 는 완전한 Game 객체 → 전체 행 upsert (slug/name 등 NOT NULL 컬럼 포함)
  if (patched.length > 0) await cacheGames(patched);

  return {
    ok: true,
    scanned: games.length,
    matched: patched.length,
    updated: patched.length,
  };
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
          // GRAC 보강분은 유지
          genres_ko: g.genres_ko.length ? g.genres_ko : detail.genres_ko,
          age_rating: g.age_rating ?? detail.age_rating,
          content_descriptors: g.content_descriptors.length
            ? g.content_descriptors
            : detail.content_descriptors,
          publisher: g.publisher ?? detail.publisher,
          source: g.source ?? detail.source,
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
      const { game } = await enrichForDetail(withSeedKoName(detail));
      await cacheGames([game]);
      return game;
    }
  } catch (e) {
    console.error("[games] RAWG 상세 조회 실패, 샘플로 폴백:", e);
  }

  return getSampleGame(idOrSlug) ?? null;
}

/**
 * 검색어(한글)가 시드 목록의 한글명에 부분일치하면 대응하는 영문명을 반환한다.
 * RAWG 는 영문 검색만 지원하므로, 한글 검색어를 영문 검색어로 바꿔주는 용도.
 */
function seedEnglishMatches(query: string): string[] {
  // 띄어쓰기 차이(예: "리그오브레전드" vs "리그 오브 레전드")를 무시하고 비교한다.
  const stripSpace = (s: string) => s.replace(/\s+/g, "");
  const nq = stripSpace(query);
  const seen = new Set<string>();
  for (const s of SEED_GAMES) {
    if (s.ko && stripSpace(s.ko).includes(nq)) seen.add(s.en);
  }
  return [...seen];
}

/**
 * 이름으로 게임 검색 (영문/한글 모두 지원).
 * 1) Supabase 캐시에서 이름(영문/한글) 부분일치 (trigram 인덱스)
 * 2) 없으면 RAWG 검색 → 캐시에 저장 (한글 검색어는 시드 목록으로 영문 변환)
 * 3) RAWG 키도 없으면 샘플에서 필터
 */
export async function searchGamesByName(query: string): Promise<Game[]> {
  const q = query.trim();
  if (!q) return [];
  const seedEnMatches = seedEnglishMatches(q);

  const supabase = getSupabase();
  if (supabase) {
    // .or() 는 값에 특수문자가 있으면 이스케이프가 까다로워서, 대신 컬럼별로
    // 나눠 안전한 .ilike() 로 조회한 뒤 합친다.
    const queries = [
      supabase.from("games").select("*").ilike("name", `%${q}%`),
      supabase.from("games").select("*").ilike("name_ko", `%${q}%`),
      ...seedEnMatches.map((en) =>
        supabase.from("games").select("*").ilike("name", `%${en}%`),
      ),
    ];
    const responses = await Promise.all(
      queries.map((qb) =>
        qb.order("rawg_ratings_count", { ascending: false }).limit(24),
      ),
    );
    const byId = new Map<number, Game>();
    for (const r of responses) {
      if (r.error || !r.data) continue;
      for (const row of r.data) {
        const g = rowToGame(row as Record<string, unknown>);
        byId.set(g.id, g);
      }
    }
    if (byId.size > 0) {
      return [...byId.values()]
        .sort((a, b) => b.rawg_ratings_count - a.rawg_ratings_count)
        .slice(0, 24);
    }
  }

  try {
    // 한글 검색어가 시드 목록에 매칭되면 그 영문명으로 RAWG 검색
    const rawgQuery = seedEnMatches[0] ?? q;
    const results = (await searchGames(rawgQuery)).map(withSeedKoName);
    if (results.length > 0) {
      await cacheGames(results);
      return results;
    }
  } catch (e) {
    console.error("[games] RAWG 검색 실패, 샘플로 폴백:", e);
  }

  const lower = q.toLowerCase();
  return SAMPLE_GAMES.filter(
    (g) =>
      g.name.toLowerCase().includes(lower) ||
      (g.name_ko && g.name_ko.includes(q)),
  );
}

/**
 * 국내/해외 카테고리용: PC·모바일·콘솔 전체에서 모아 배급사 기준으로 분류한다.
 * (isDomesticGame 은 GRAC 배급사 정보가 채워진 게임만 판별 가능한 best-effort 기준)
 */
export async function listGamesByRegion(
  region: "domestic" | "overseas",
): Promise<Game[]> {
  const featured = await Promise.all(PLATFORM_KINDS.map(listGamesByPlatform));
  const byId = new Map<number, Game>();
  for (const g of featured.flat()) byId.set(g.id, g);
  const filtered = [...byId.values()].filter(
    (g) => isDomesticGame(g) === (region === "domestic"),
  );
  filtered.sort((a, b) => b.rawg_ratings_count - a.rawg_ratings_count);
  return filtered;
}

/** 메인 페이지용: 플랫폼별 소수의 대표 게임 */
export async function listFeatured(): Promise<Record<PlatformKind, Game[]>> {
  const [pc, mobile, console_] = await Promise.all([
    listGamesByPlatform("pc"),
    listGamesByPlatform("mobile"),
    listGamesByPlatform("console"),
  ]);
  return {
    pc: pc.slice(0, 12),
    mobile: mobile.slice(0, 12),
    console: console_.slice(0, 12),
  };
}

export { SAMPLE_GAMES };
