import type { Game, PlatformKind } from "./types";

const GRAC_ENDPOINT =
  "https://www.grac.or.kr/WebService/GameSearchSvc.asmx/game";

export interface GracItem {
  rateno: string;
  rateddate: string; // yyyy-mm-dd
  gametitle: string; // "한글명(English name)" 형태가 많음
  entname: string; // 배급/신청 업체
  summary: string; // 한국어 개요
  givenrate: string; // 이용등급
  genre: string; // 한국어 장르
  platform: string; // "PC/온라인 게임" | "모바일 게임" | "비디오 게임" | "아케이드 게임" ...
  descriptors: string[]; // 내용정보 (폭력성, 사행성 ...)
  cancelled: boolean;
}

// 우리 서비스와 무관한 장르 (아케이드/웹보드/교육용 등) — 매칭 제외
const JUNK_GENRES = new Set([
  "",
  "기타",
  "크레인",
  "교육용",
  "보드게임(베팅성)",
  "웹보드",
]);

// GRAC 오분류가 확인된 타이틀 (정규화된 검색어) — 매칭 강제 제외
const QUERY_BLOCKLIST = new Set(["nierautomata"]);

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function parseGracXml(xml: string): GracItem[] {
  const items: GracItem[] = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const body = m[1];
    const get = (tag: string): string => {
      const mm = body.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
      return mm ? decodeXml(mm[1]) : "";
    };
    items.push({
      rateno: get("rateno"),
      rateddate: get("rateddate"),
      gametitle: get("gametitle"),
      entname: get("entname"),
      summary: get("summary"),
      givenrate: get("givenrate"),
      genre: get("genre"),
      platform: get("platform"),
      descriptors: get("descriptors")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      cancelled: /true/i.test(get("cancelstatus")),
    });
  }
  return items;
}

/** GRAC 게임 정보 검색 (인증키 불필요). 실패 시 빈 배열. */
export async function searchGrac(
  title: string,
  display = 20,
): Promise<GracItem[]> {
  const q = title.trim();
  if (!q) return [];
  try {
    const url =
      `${GRAC_ENDPOINT}?gametitle=${encodeURIComponent(q)}` +
      `&entname=&rateno=&display=${display}&pageno=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GamPicial/1.0)" },
      next: { revalidate: 60 * 60 * 24 * 7 }, // 7일
    });
    if (!res.ok) return [];
    return parseGracXml(await res.text());
  } catch {
    return [];
  }
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\s　]+/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function titleCandidates(gametitle: string): string[] {
  const cands = [gametitle];
  const parenAt = gametitle.lastIndexOf("(");
  const paren = gametitle.match(/\(([^)]+)\)\s*$/);
  if (paren && parenAt > 0) {
    cands.push(paren[1]);
    cands.push(gametitle.slice(0, parenAt));
  }
  return cands.map((c) => c.trim()).filter(Boolean);
}

/**
 * 접두어 매칭에서, 긴 쪽이 짧은 쪽 뒤에 숫자만 덧붙은 형태인지 확인한다
 * (예: "psychonauts" vs "psychonauts2"). 이런 경우 시리즈 후속작(속편)일
 * 가능성이 높아 같은 게임으로 보면 안 된다 — 실제로 "Psychonauts" 검색이
 * "Psychonauts 2" GRAC 항목에 매칭되는 오탐이 있었다.
 */
function isSequelNumberSuffix(a: string, b: string): boolean {
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  return /^\d+$/.test(longer.slice(shorter.length));
}

/**
 * 검색어와 가장 잘 맞는 GRAC 항목을 고른다. 확신이 낮으면 null.
 * GRAC 검색은 제목 문자열(한/영)에 민감해서 오매칭 방지를 위해 보수적으로 잡는다:
 * - 정규화 완전일치(100) 또는
 * - 한쪽이 다른 쪽의 접두사이고 길이비가 0.55 이상(75)
 * 인 경우만 인정. 단순 부분포함은 제외 (예: "테라" → "테라리움").
 * 단, 접두사 뒤에 숫자만 붙어 갈리는 경우(속편 번호)는 매칭에서 제외한다.
 */
export function pickGracMatch(
  query: string,
  items: GracItem[],
): GracItem | null {
  const nq = norm(query);
  if (nq.length < 2 || QUERY_BLOCKLIST.has(nq)) return null;

  let best: { item: GracItem; score: number } | null = null;
  for (const item of items) {
    if (item.cancelled) continue;
    if (JUNK_GENRES.has(item.genre)) continue;
    if (item.platform.includes("아케이드")) continue;

    let score = 0;
    for (const cand of titleCandidates(item.gametitle)) {
      const nc = norm(cand);
      if (nc.length < 2) continue;
      if (nc === nq) {
        score = Math.max(score, 100);
      } else if (
        (nc.startsWith(nq) || nq.startsWith(nc)) &&
        !isSequelNumberSuffix(nc, nq)
      ) {
        const ratio =
          Math.min(nc.length, nq.length) / Math.max(nc.length, nq.length);
        if (ratio >= 0.7) score = Math.max(score, 78);
      }
    }
    if (score === 0) continue;

    // 최신 등급분류 약한 가산점 (동점 tie-break)
    const year = Number(item.rateddate.slice(0, 4)) || 0;
    score += Math.min(Math.max(year - 2000, 0), 25) / 100;

    if (!best || score > best.score) best = { item, score };
  }
  return best && best.score >= 78 ? best.item : null;
}

const PLATFORM_RULES: Array<[RegExp, PlatformKind]> = [
  [/모바일/, "mobile"],
  [/비디오/, "console"],
  [/PC|온라인|패키지/, "pc"],
];

export function gracPlatformKind(platform: string): PlatformKind | null {
  for (const [re, kind] of PLATFORM_RULES) if (re.test(platform)) return kind;
  return null;
}

/**
 * GRAC gametitle 은 보통 "English name(한글명)" 형태다(예: "Elden Ring(엘든 링)").
 * 괄호 안/밖 두 후보 중 한글이 포함된 쪽을 한글명으로 뽑는다 — 표기가 뒤바뀐
 * 항목도 있을 수 있어 순서를 가정하지 않고 둘 다 확인한다.
 */
function extractKoreanTitle(gametitle: string): string | null {
  const parenAt = gametitle.lastIndexOf("(");
  const paren = gametitle.match(/\(([^)]+)\)\s*$/);
  const before = (parenAt > 0 ? gametitle.slice(0, parenAt) : gametitle).trim();
  const inside = paren ? paren[1].trim() : null;
  if (inside && /[가-힣]/.test(inside)) return inside;
  if (/[가-힣]/.test(before)) return before;
  return null;
}

/** GRAC 항목으로 기존 Game 을 보강한 새 객체를 반환한다. */
export function applyGrac(game: Game, item: GracItem): Game {
  const next: Game = {
    ...game,
    name_ko: game.name_ko ?? extractKoreanTitle(item.gametitle),
    genres_ko:
      item.genre && !JUNK_GENRES.has(item.genre)
        ? [item.genre]
        : game.genres_ko,
    age_rating: item.givenrate || game.age_rating,
    content_descriptors: item.descriptors.length
      ? item.descriptors
      : game.content_descriptors,
    publisher: item.entname || game.publisher,
  };
  // 한국어 개요가 없고 현재 설명이 한글이 아니면 GRAC 개요로 채운다
  if (item.summary && !/[가-힣]/.test(game.description ?? "")) {
    next.description = item.summary;
  }
  return next;
}
