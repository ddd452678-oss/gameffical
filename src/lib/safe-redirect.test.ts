import { describe, expect, it } from "vitest";
import { sanitizeNextPath } from "./safe-redirect";

describe("sanitizeNextPath", () => {
  it("허용: 내부 상대 경로는 그대로 통과시킨다", () => {
    expect(sanitizeNextPath("/game/123")).toBe("/game/123");
    expect(sanitizeNextPath("/")).toBe("/");
    expect(sanitizeNextPath("/domestic?page=2")).toBe("/domestic?page=2");
  });

  it("차단: 프로토콜 상대 경로(//evil.com)는 홈으로 돌린다", () => {
    expect(sanitizeNextPath("//evil.com")).toBe("/");
    expect(sanitizeNextPath("//evil.com/phish")).toBe("/");
  });

  it("차단: 절대 URL(외부 호스트)은 홈으로 돌린다", () => {
    expect(sanitizeNextPath("https://evil.com")).toBe("/");
    expect(sanitizeNextPath("http://evil.com/x")).toBe("/");
  });

  it("차단: 역슬래시로 시작하는 값도 홈으로 돌린다", () => {
    expect(sanitizeNextPath("/\\evil.com")).toBe("/");
  });

  it("비어있거나 없으면 홈으로", () => {
    expect(sanitizeNextPath(null)).toBe("/");
    expect(sanitizeNextPath(undefined)).toBe("/");
    expect(sanitizeNextPath("")).toBe("/");
  });

  it("차단: /로 시작하지 않는 상대 경로도 안전하지 않은 것으로 취급", () => {
    expect(sanitizeNextPath("evil.com")).toBe("/");
  });
});
