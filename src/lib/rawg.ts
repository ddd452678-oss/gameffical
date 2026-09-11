import { env, hasRawg } from "./env";
import type { Game, PlatformKind, StoreLink } from "./types";

const RAWG_BASE = "https://api.rawg.io/api";

// RAWG parent_platforms id → 겜피셜 플랫폼 구분
const PARENT_PLATFORM_KIND: Record<number, PlatformKind> = {
  1: "pc", // PC
  5: "pc", // Apple Macintosh
  6: "pc", // Linux
  2: "console", // PlayStation
  3: "console", // Xbox
  7: "console", // Nintendo
  4: "mobile", // iOS
  8: "mobile", // Android
};

// 플랫폼 구분 → RAWG 목록 조회용 parent_platforms 쿼리 값
const KIND_TO_PARENT_QUERY: Record<PlatformKind, string> = {
  pc: "1",
  console: "2,3,7",
  mobile: "4,8",
};

interface RawgListItem {
  id: number;
  slug: string;
  name: string;
  released: string | null;
  background_image: string | null;
  rating: number;
  ratings_count: number;
  metacritic: number | null;
  genres?: { name: string }[];
  parent_platforms?: { platform: { id: number; name: string } }[];
  platforms?: { platform: { id: number; name: string } }[];
}

interface RawgDetail extends RawgListItem {
  description_raw?: string;
  stores?: { store: { id: number; name: string; slug: string }; url?: string }[];
}

function rawgUrl(path: string, params: Record<string, string | number> = {}) {
  const url = new URL(`${RAWG_BASE}${path}`);
  url.searchParams.set("key", env.rawgApiKey);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  return url.toString();
}

function normalizePlatformKinds(item: RawgListItem): PlatformKind[] {
  const set = new Set<PlatformKind>();
  for (const p of item.parent_platforms ?? []) {
    const kind = PARENT_PLATFORM_KIND[p.platform.id];
    if (kind) set.add(kind);
  }
  return [...set];
}

function normalizeStores(detail: RawgDetail): StoreLink[] {
  const links: StoreLink[] = [];
  for (const s of detail.stores ?? []) {
    if (s.url) links.push({ store: s.store.name, url: s.url });
  }
  return links;
}

function toGame(item: RawgListItem, detail?: RawgDetail): Game {
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    name_ko: null,
    description: detail?.description_raw?.trim() || null,
    background_image: item.background_image,
    genres: (item.genres ?? []).map((g) => g.name),
    platform_kinds: normalizePlatformKinds(item),
    raw_platforms: (item.platforms ?? []).map((p) => p.platform.name),
    released: item.released,
    metacritic: item.metacritic,
    rawg_rating: item.rating || null,
    rawg_ratings_count: item.ratings_count ?? 0,
    stores: detail ? normalizeStores(detail) : [],
    steam_appid: null,
    steam_positive_pct: null,
    steam_review_count: null,
    genres_ko: [],
    age_rating: null,
    content_descriptors: [],
    publisher: null,
    source: "rawg",
  };
}

export interface FetchPlatformOptions {
  /** 이어서 조회를 시작할 페이지 (진행 커서). 기본 1. */
  startPage?: number;
  /** 이번 호출에서 최대 몇 페이지까지 가져올지. 기본 3. */
  maxPages?: number;
  pageSize?: number;
  /** 동시에 요청할 페이지 수 (RAWG 레이트리밋 고려해 과하게 크게 잡지 않는다). */
  concurrency?: number;
}

export interface FetchPlatformResult {
  games: Game[];
  /** 다음 호출에서 이어서 조회할 페이지. 끝까지 다 돌았으면 1로 순환한다. */
  nextPage: number;
  /** RAWG count 기준 전체 페이지 수 (카탈로그 규모 파악용). */
  totalPages: number;
}

/**
 * 플랫폼별 게임 목록을 페이지 단위로 병렬 조회한다.
 * RAWG 키가 없으면 빈 결과를 반환한다(호출부가 샘플로 폴백).
 * startPage/nextPage 를 커버리지 진행 커서로 사용해, 매 호출마다 다른 구간을 가져오면
 * (games.ts 의 refreshPlatformCatalog 참고) 하루 API 할당량 안에서도 카탈로그를 계속
 * 넓혀갈 수 있다. 실패한 페이지가 있으면 nextPage 를 그 페이지로 되돌려 다음 호출에서
 * 재시도한다(건너뛰어 유실되지 않도록).
 */
export async function fetchGamesByPlatform(
  kind: PlatformKind,
  opts: FetchPlatformOptions = {},
): Promise<FetchPlatformResult> {
  const { startPage = 1, maxPages = 3, pageSize = 40, concurrency = 6 } = opts;
  if (!hasRawg) return { games: [], nextPage: startPage, totalPages: 0 };

  const buildUrl = (page: number) =>
    rawgUrl("/games", {
      parent_platforms: KIND_TO_PARENT_QUERY[kind],
      ordering: "-added",
      page_size: pageSize,
      page,
    });

  const fetchPage = async (
    page: number,
  ): Promise<{ page: number; items: RawgListItem[] | null; count?: number }> => {
    try {
      const res = await fetch(buildUrl(page), {
        next: { revalidate: 60 * 60 * 6 }, // 6시간 캐시 (fetch 레벨)
      });
      if (!res.ok) return { page, items: null };
      const json = (await res.json()) as {
        results: RawgListItem[];
        count: number;
      };
      return { page, items: json.results, count: json.count };
    } catch {
      return { page, items: null };
    }
  };

  const first = await fetchPage(startPage);
  if (first.items === null) {
    if (startPage === 1) throw new Error("RAWG 목록 조회 실패");
    // 진행 커서가 끝을 넘어갔거나 일시 오류 — 처음부터 다시 돌도록 커서를 리셋
    return { games: [], nextPage: 1, totalPages: 0 };
  }

  const totalPages = Math.max(1, Math.ceil((first.count ?? 0) / pageSize));
  const out: Game[] = [];
  const seen = new Set<number>();
  const addResults = (items: RawgListItem[]) => {
    for (const r of items) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      out.push(toGame(r));
    }
  };
  addResults(first.items);

  const pagesToFetch: number[] = [];
  for (let p = startPage + 1; p < startPage + maxPages && p <= totalPages; p++) {
    pagesToFetch.push(p);
  }

  let firstFailedPage: number | null = null;
  for (let i = 0; i < pagesToFetch.length; i += concurrency) {
    const batch = pagesToFetch.slice(i, i + concurrency);
    const results = await Promise.all(batch.map(fetchPage));
    for (const r of results) {
      if (r.items === null) {
        if (firstFailedPage === null || r.page < firstFailedPage) {
          firstFailedPage = r.page;
        }
        continue;
      }
      addResults(r.items);
    }
  }

  const lastAttemptedPage = startPage + pagesToFetch.length;
  const reachedEnd = lastAttemptedPage >= totalPages && firstFailedPage === null;
  const nextPage = firstFailedPage ?? (reachedEnd ? 1 : lastAttemptedPage + 1);

  return { games: out, nextPage, totalPages };
}

/**
 * 타이틀 목록을 이름으로 검색해 각 타이틀의 대표 결과를 반환한다 (id 기준 중복 제거).
 * 국내 온라인/모바일 게임처럼 -added 정렬로 밀리는 항목을 카탈로그에 편입하는 용도.
 */
export async function fetchGamesByTitles(titles: string[]): Promise<Game[]> {
  if (!hasRawg || titles.length === 0) return [];
  const byId = new Map<number, Game>();
  const BATCH = 8;
  for (let i = 0; i < titles.length; i += BATCH) {
    const batch = titles.slice(i, i + BATCH);
    const found = await Promise.all(
      batch.map(async (title) => {
        try {
          const res = await fetch(
            rawgUrl("/games", {
              search: title,
              search_precise: "true",
              page_size: 1,
            }),
            { next: { revalidate: 60 * 60 * 24 } },
          );
          if (!res.ok) return null;
          const json = (await res.json()) as { results: RawgListItem[] };
          return json.results[0] ?? null;
        } catch {
          return null;
        }
      }),
    );
    for (const r of found) {
      if (r && !byId.has(r.id)) byId.set(r.id, toGame(r));
    }
  }
  return [...byId.values()];
}

/** 게임 상세. RAWG 키가 없으면 null. */
export async function fetchGameDetail(id: number | string): Promise<Game | null> {
  if (!hasRawg) return null;
  const [detailRes, storesRes] = await Promise.all([
    fetch(rawgUrl(`/games/${id}`), { next: { revalidate: 60 * 60 * 24 } }),
    fetch(rawgUrl(`/games/${id}/stores`), { next: { revalidate: 60 * 60 * 24 } }),
  ]);
  if (!detailRes.ok) {
    if (detailRes.status === 404) return null;
    throw new Error(`RAWG 상세 조회 실패: ${detailRes.status}`);
  }
  const detail = (await detailRes.json()) as RawgDetail;
  if (storesRes.ok) {
    const storesJson = (await storesRes.json()) as {
      results: { store_id: number; url: string }[];
    };
    // /stores 엔드포인트는 store_id + url 만 주므로 detail.stores 와 병합
    const byId = new Map((detail.stores ?? []).map((s) => [s.store.id, s.store.name]));
    detail.stores = storesJson.results.map((r) => ({
      store: { id: r.store_id, name: byId.get(r.store_id) ?? "스토어", slug: "" },
      url: r.url,
    }));
  }
  return toGame(detail, detail);
}

/** 이름으로 검색. */
export async function searchGames(query: string, pageSize = 20): Promise<Game[]> {
  if (!hasRawg || !query.trim()) return [];
  const res = await fetch(
    rawgUrl("/games", { search: query, page_size: pageSize }),
    { next: { revalidate: 60 * 60 } },
  );
  if (!res.ok) throw new Error(`RAWG 검색 실패: ${res.status}`);
  const json = (await res.json()) as { results: RawgListItem[] };
  return json.results.map((r) => toGame(r));
}
