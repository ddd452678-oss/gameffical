import { describe, expect, it } from "vitest";
import { pickGracMatch, type GracItem } from "./grac";

function makeItem(overrides: Partial<GracItem> = {}): GracItem {
  return {
    rateno: "TEST-001",
    rateddate: "2020-01-01",
    gametitle: "Test Game",
    entname: "테스트게임즈",
    summary: "테스트용 게임 개요",
    givenrate: "전체이용가",
    genre: "액션",
    platform: "PC/온라인 게임",
    descriptors: [],
    cancelled: false,
    ...overrides,
  };
}

describe("pickGracMatch", () => {
  it("정규화 완전 일치는 매칭된다", () => {
    const items = [makeItem({ gametitle: "Elden Ring(엘든 링)" })];
    expect(pickGracMatch("Elden Ring", items)).toBe(items[0]);
  });

  it("회귀: Psychonauts 검색이 Psychonauts 2 항목에 오매칭되지 않는다", () => {
    // 실제로 발생했던 버그: "psychonauts" 가 "psychonauts2" 의 접두사라서
    // 길이비 조건(0.7 이상)을 통과해 잘못 매칭됐었다.
    const items = [
      makeItem({ gametitle: "Psychonauts 2(사이코너츠 2)", entname: "한국마이크로소프트(유)" }),
    ];
    expect(pickGracMatch("Psychonauts", items)).toBeNull();
  });

  it("반대 방향(속편으로 원작 검색)도 매칭되지 않는다", () => {
    const items = [makeItem({ gametitle: "Portal(포탈)" })];
    expect(pickGracMatch("Portal 2", items)).toBeNull();
  });

  it("괄호 앞/뒤 어느 쪽이 한글이든 후보로 인정한다", () => {
    const koFirst = [makeItem({ gametitle: "엘든 링(Elden Ring)" })];
    const enFirst = [makeItem({ gametitle: "Elden Ring(엘든 링)" })];
    expect(pickGracMatch("Elden Ring", koFirst)).toBe(koFirst[0]);
    expect(pickGracMatch("Elden Ring", enFirst)).toBe(enFirst[0]);
  });

  it("취소된 항목은 후보에서 제외한다", () => {
    const items = [makeItem({ gametitle: "Test Game", cancelled: true })];
    expect(pickGracMatch("Test Game", items)).toBeNull();
  });

  it("무관한 장르(아케이드 등)는 제외한다", () => {
    const items = [makeItem({ gametitle: "Test Game", genre: "크레인" })];
    expect(pickGracMatch("Test Game", items)).toBeNull();
  });

  it("아무 후보도 없으면 null", () => {
    expect(pickGracMatch("Test Game", [])).toBeNull();
  });

  it("전혀 다른 제목은 매칭되지 않는다 (부분 포함만으로는 불충분)", () => {
    // "테라" 가 "테라리움" 에 포함된다고 매칭되면 안 됨
    const items = [makeItem({ gametitle: "테라리움" })];
    expect(pickGracMatch("테라", items)).toBeNull();
  });
});
