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
  ratings_updated_at: string; // Steam 긍정비율 등 "자주 바뀌는 평점"을 마지막으로 갱신한 시각 (ISO)
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
 * RAWG 장르명 -> 한국어. GRAC 로 보강된 게임은 genres_ko(GRAC 고유 장르
 * 체계)를 쓰고, 그렇지 않은 게임은 이 표로 RAWG 장르를 번역해서 쓴다 —
 * 안 그러면 같은 화면 안에서 "액션"과 "Action, Shooter"가 뒤섞여 보인다.
 * 표에 없는 장르는 원문 그대로 둔다.
 */
const RAWG_GENRE_KO: Record<string, string> = {
  Action: "액션",
  Indie: "인디",
  Adventure: "어드벤처",
  RPG: "RPG",
  Strategy: "전략",
  Shooter: "슈터",
  Casual: "캐주얼",
  Simulation: "시뮬레이션",
  Puzzle: "퍼즐",
  Arcade: "아케이드",
  Platformer: "플랫포머",
  "Massively Multiplayer": "MMO",
  Racing: "레이싱",
  Sports: "스포츠",
  Fighting: "대전 격투",
  Family: "가족",
  "Board Games": "보드게임",
  Educational: "교육",
  Card: "카드",
};

/** 선호 장르 등록(마이페이지)에 쓰는 한국어 장르 목록. */
export const GENRE_OPTIONS: string[] = Object.values(RAWG_GENRE_KO);

/** 표시용 장르 목록: genres_ko(GRAC)가 있으면 그대로, 없으면 RAWG 장르를 번역해서 반환. */
export function displayGenres(game: Game): string[] {
  if (game.genres_ko.length > 0) return game.genres_ko;
  return game.genres.map((g) => RAWG_GENRE_KO[g] ?? g);
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
 * 원신처럼 모바일 우선으로 기획됐지만 PC/PS4/PS5/Switch 등에도 동시 서비스되는
 * 라이브서비스(가챠) 게임 화이트리스트. 이런 게임은 Papers Please, XCOM: Enemy
 * Unknown 처럼 "PC 게임에 나중에 모바일 포트가 붙은" 게임과 raw_platforms 비율이
 * 똑같아져서(둘 다 iOS+Android 2개 / 전체 6개 = 1/3) 비율만으로는 구분이
 * 불가능하다 — 그래서 알려진 타이틀만 직접 화이트리스트로 관리한다.
 */
const MOBILE_FIRST_OVERRIDE = new Set(
  [
    "Genshin Impact",
    "Honkai Impact 3rd",
    "Honkai: Star Rail",
    "Zenless Zone Zero",
    "Wuthering Waves",
    "Goddess of Victory: Nikke",
    "Diablo Immortal",
    "Punishing: Gray Raven",
  ].map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, "")),
);

/**
 * 모바일이 "주" 플랫폼인 게임인지 판별한다. platform_kinds 에 mobile 이
 * 포함돼 있어도, PC/콘솔 게임에 모바일 포트가 하나 끼어있는 경우(예:
 * Psychonauts 의 2011년 iPad판, Papers Please/XCOM 의 모바일 이식판)까지
 * 모바일 카테고리에 넣지 않기 위함.
 *
 * raw_platforms 중 모바일(iOS/Android)이 과반이면 모바일 주력으로 본다.
 * 과반 기준만으로는 원신처럼 PC/콘솔 버전이 여러 개라 플랫폼 개수 자체가
 * 많아지는 라이브서비스 게임까지 걸러지므로, 그런 알려진 타이틀은
 * MOBILE_FIRST_OVERRIDE 화이트리스트로 별도 처리한다.
 */
export function isPrimaryMobile(game: Game): boolean {
  if (!game.platform_kinds.includes("mobile")) return false;
  if (MOBILE_FIRST_OVERRIDE.has(game.name.toLowerCase().replace(/[^a-z0-9]/g, ""))) {
    return true;
  }
  const mobileCount = game.raw_platforms.filter((p) =>
    MOBILE_PLATFORM_NAMES.has(p),
  ).length;
  if (mobileCount === 0) return false;
  const otherCount = game.raw_platforms.length - mobileCount;
  return mobileCount > otherCount;
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

/**
 * 종합 평점의 근거가 얇을 때(소스 1개뿐이거나 표본이 적을 때) 붙일 안내 문구.
 * 확정된 점수처럼 보이지 않게, 근거가 부족하면 명시적으로 알려준다.
 */
export function scoreConfidenceNote(game: Game): string | null {
  const hasMetacritic = typeof game.metacritic === "number";
  const hasSteam = typeof game.steam_positive_pct === "number";
  const hasRawg = typeof game.rawg_rating === "number" && game.rawg_rating > 0;
  const sourceCount = [hasMetacritic, hasSteam, hasRawg].filter(Boolean).length;
  if (sourceCount === 0) return null;

  if (sourceCount === 1 && hasRawg && game.rawg_ratings_count < 200) {
    return `RAWG 투표 ${game.rawg_ratings_count.toLocaleString()}표만 반영된 참고용 점수예요.`;
  }
  if (sourceCount === 1 && hasSteam && (game.steam_review_count ?? 0) < 200) {
    return `Steam 리뷰 ${(game.steam_review_count ?? 0).toLocaleString()}개만 반영된 참고용 점수예요.`;
  }
  if (sourceCount === 1) {
    return "공식 지표 한 곳의 데이터만 반영된 점수예요.";
  }
  return null;
}
