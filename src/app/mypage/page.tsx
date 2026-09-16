import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getDisplayName } from "@/lib/display-name";
import { MyPageClient } from "@/components/MyPageClient";

export const metadata: Metadata = { title: "마이페이지 — 겜피셜" };

export default async function MyPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!user || !supabase) redirect("/login?next=/mypage");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, email, preferred_genres")
    .eq("user_id", user.id)
    .maybeSingle();

  const provider = (user.app_metadata?.provider as string) ?? "email";

  return (
    <MyPageClient
      displayName={getDisplayName(user)}
      email={user.email ?? (profile?.email as string | undefined) ?? null}
      username={(profile?.username as string | undefined) ?? null}
      preferredGenres={(profile?.preferred_genres as string[] | undefined) ?? []}
      isEmailAccount={provider === "email"}
    />
  );
}
