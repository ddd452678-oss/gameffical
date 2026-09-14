import { describe, expect, it } from "vitest";
import { computeOverallScore, isPrimaryMobile, type Game } from "./types";

/** 테스트용 최소 Game 객체 — 필요한 필드만 override 해서 쓴다. */
function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 1,
    slug: "test-game",
    name: "Test Game",
    name_ko: null,
    description: null,
    background_image: null,
    genres: [],
    platform_kinds: [],
    raw_platforms: [],
    released: null,
    metacritic: null,
    rawg_rating: null,
    rawg_ratings_count: 0,
    stores: [],
    steam_appid: null,
    steam_positive_pct: null,
    steam_review_count: null,
    ratings_updated_at: new Date(0).toISOString(),
    genres_ko: [],
    age_rating: null,
    content_descriptors: [],
    publisher: null,
    source: "rawg",
    ...overrides,
  };
}

describe("computeOverallScore", () => {
  it("공식 데이터가 하나도 없으면 null", () => {
    expect(computeOverallScore(makeGame())).toBeNull();
  });

  it("소스 하나만 있으면 그 값을 그대로 재정규화한다", () => {
    // metacritic 만 있는 경우: 가중치 재정규화 후에도 metacritic 값 그대로여야 함
    expect(computeOverallScore(makeGame({ metacritic: 80 }))).toBe(80);
  });

  it("여러 소스를 가중 평균한다 (metacritic 0.5, rawg 0.3, steam 0.2)", () => {
    const score = computeOverallScore(
      makeGame({
        metacritic: 80, // -> 80 * 0.5
        rawg_rating: 4, // -> (4/5*100=80) * 0.3
        steam_positive_pct: 80, // -> 80 * 0.2
      }),
    );
    // 세 소스 모두 80으로 맞춰뒀으니 가중 평균도 80이어야 함
    expect(score).toBe(80);
  });

  it("일부 소스만 있을 때 남은 가중치로 재정규화한다 (metacritic 0.5 + steam 0.2 -> 0.7 기준)", () => {
    // (100*0.5 + 50*0.2) / 0.7 = 60/0.7 ≈ 85.71 -> 반올림 86
    const score = computeOverallScore(
      makeGame({ metacritic: 100, steam_positive_pct: 50 }),
    );
    expect(score).toBe(86);
  });

  it("rawg_rating 이 0이면 소스로 치지 않는다 (미평가로 취급)", () => {
    expect(
      computeOverallScore(makeGame({ metacritic: 80, rawg_rating: 0 })),
    ).toBe(80);
  });
});

describe("isPrimaryMobile", () => {
  it("platform_kinds 에 mobile 이 없으면 false", () => {
    expect(
      isPrimaryMobile(makeGame({ platform_kinds: ["pc"], raw_platforms: ["PC"] })),
    ).toBe(false);
  });

  it("실제 회귀 케이스: Papers Please 처럼 PC 게임에 모바일 포트만 붙은 경우 제외", () => {
    const papersPlease = makeGame({
      name: "Papers, Please",
      platform_kinds: ["pc", "console", "mobile"],
      raw_platforms: ["Linux", "macOS", "PC", "iOS", "Android", "PS Vita"],
    });
    expect(isPrimaryMobile(papersPlease)).toBe(false);
  });

  it("과반이 모바일이면 모바일 주력으로 본다", () => {
    const clashRoyale = makeGame({
      name: "Clash Royale",
      platform_kinds: ["mobile"],
      raw_platforms: ["Android", "iOS"],
    });
    expect(isPrimaryMobile(clashRoyale)).toBe(true);
  });

  it("화이트리스트: 원신은 플랫폼이 많아도(모바일 비과반) 모바일 주력으로 본다", () => {
    const genshin = makeGame({
      name: "Genshin Impact",
      platform_kinds: ["pc", "console", "mobile"],
      raw_platforms: ["PC", "PlayStation 5", "PlayStation 4", "Nintendo Switch", "iOS", "Android"],
    });
    expect(isPrimaryMobile(genshin)).toBe(true);
  });
});
