export type PlatformKind = "pc" | "mobile" | "console";

export const PLATFORM_LABELS: Record<PlatformKind, string> = {
  pc: "PC 게임",
  mobile: "모바일 게임",
  console: "콘솔 게임",
};

export interface StoreLink {
  store: string;
  url: string;
}

export interface Game {
  id: number;
  slug: string;
  name: string;
  name_ko: string | null; // 한국어 이름 (시드 목록 또는 GRAC 등록명 기준, 없으면 null)
  description: string | null;
  background_image: string | null;
  genres: string[];
  platform_kinds: PlatformKind[];
  raw_platforms: string[];
  released: string | null;
  metacritic: number | null;
  rawg_rating: number | null;
  rawg_ratings_count: number;
  stores: StoreLink[];
  steam_appid: string | null;
  steam_positive_pct: number | null;
  steam_review_count: number | null;
  // GRAC(게임물관리위원회) 보강 필드
  genres_ko: string[]; // 한국어 장르 (있으면 genres 대신 표시)
  age_rating: string | null; // 이용등급 (전체이용가 ~ 청소년이용불가)
  content_descriptors: string[]; // 내용정보 (폭력성, 사행성, 선정성 등)
  publisher: string | null; // 배급사
  source: string; // 'rawg' | 'sample' | 'grac'
}

export interface Review {
  id: string;
  game_id: number;
  user_id: string; // 작성자 계정 (로그인 필수 — 카카오/구글/이메일)
  author_name: string;
  fun_rating: number;
  cost_burden: number;
  gacha_transparency: number | null;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewInput {
  game_id: number;
  author_name?: string;
  fun_rating: number;
  cost_burden: number;
  gacha_transparency?: number | null;
  body: string;
}

export interface ReviewStats {
  review_count: number;
  avg_fun: number | null;
  avg_cost_burden: number | null;
  avg_gacha_transparency: number | null;
}

/**
 * 카드/상세 제목에 쓰는 표시용 이름. 한글명이 있으면 "한글명 | 영문명" 형태로,
 * 없으면 원래 이름만 반환한다.
 */
export function displayTitle(game: Game): string {
  return game.name_ko ? `${game.name_ko} | ${game.name}` : game.name;
}

const MOBILE_PLATFORM_NAMES = new Set(["iOS", "Android"]);

/**
 * 모바일이 "주" 플랫폼인 게임인지 판별한다. platform_kinds 에 mobile 이
 * 포함돼 있어도, PC/콘솔 게임에 예전 모바일 포트가 하나 끼어있는 경우
 * (예: Psychonauts 의 2011년 iPad판)까지 모바일 카테고리에 넣지 않기 위함.
 *
 * raw_platforms 중 모바일(iOS/Android) 비중이 1/3 이상이면 모바일 주력으로 본다.
 * 절반 기준이 아니라 1/3 로 완화한 이유: 원신처럼 모바일 우선으로 기획된
 * 라이브서비스 게임도 PS4/PS5/Switch 등 콘솔 버전이 여러 개라 플랫폼 개수 자체가
 * 많아지는데, 절반 기준이면 이런 게임까지 걸러져 버린다.
 */
export function isPrimaryMobile(game: Game): boolean {
  if (!game.platform_kinds.includes("mobile")) return false;
  const mobileCount = game.raw_platforms.filter((p) =>
    MOBILE_PLATFORM_NAMES.has(p),
  ).length;
  if (mobileCount === 0) return false;
  return game.raw_platforms.length <= mobileCount * 3;
}

/**
 * 종합 평점(0~100). 공식 데이터가 있으면 가중 평균해서 계산한다.
 * - metacritic (0~100)          가중치 0.5
 * - rawg_rating (0~5 → 0~100)   가중치 0.3
 * - steam_positive_pct (0~100)  가중치 0.2
 * 사용 가능한 소스만으로 가중치를 재정규화한다. 하나도 없으면 null.
 */
export function computeOverallScore(game: Game): number | null {
  const parts: Array<{ value: number; weight: number }> = [];
  if (typeof game.metacritic === "number") {
    parts.push({ value: game.metacritic, weight: 0.5 });
  }
  if (typeof game.rawg_rating === "number" && game.rawg_rating > 0) {
    parts.push({ value: (game.rawg_rating / 5) * 100, weight: 0.3 });
  }
  if (typeof game.steam_positive_pct === "number") {
    parts.push({ value: game.steam_positive_pct, weight: 0.2 });
  }
  if (parts.length === 0) return null;
  const totalWeight = parts.reduce((s, p) => s + p.weight, 0);
  const score = parts.reduce((s, p) => s + p.value * p.weight, 0) / totalWeight;
  return Math.round(score);
}
