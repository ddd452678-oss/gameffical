import type { User } from "@supabase/supabase-js";

/** 로그인 계정의 표시용 이름 (카카오/구글 프로필명 → 이메일 앞부분 순). */
export function getDisplayName(user: User): string {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const name = (meta?.name || meta?.full_name || meta?.nickname) as
    | string
    | undefined;
  if (name) return name;
  return user.email?.split("@")[0] ?? "사용자";
}
