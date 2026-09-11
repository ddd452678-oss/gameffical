/**
 * 로그인 후 돌아갈 경로(next)가 우리 사이트 내부의 상대 경로인지 검증한다.
 * 검증 없이 그대로 리다이렉트하면 open redirect 취약점이 된다 —
 * ?next=https://evil.com 이나 ?next=//evil.com 같은 값으로 로그인 직후
 * 외부 피싱 사이트로 보내버릴 수 있음. 안전하지 않으면 홈으로 보낸다.
 */
export function sanitizeNextPath(next: string | null | undefined): string {
  if (!next) return "/";
  // "/" 로 시작하되 "//" 나 "/\" 로 시작하면 브라우저가 프로토콜 상대 URL로
  // 해석해 외부 호스트로 나갈 수 있으므로 제외한다.
  if (next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")) {
    return next;
  }
  return "/";
}
