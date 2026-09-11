"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { getDisplayName } from "@/lib/display-name";

export function AuthStatus() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = 아직 확인 중

  useEffect(() => {
    if (!supabase) {
      setUser(null);
      return;
    }
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function handleSignOut() {
    await supabase?.auth.signOut();
    router.refresh();
  }

  if (user === undefined) {
    return <div className="h-9 w-16 shrink-0" />; // 레이아웃 흔들림 방지용 자리
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="shrink-0 rounded-xl bg-brand px-3.5 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-dim"
      >
        로그인
      </Link>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2 text-sm">
      <span className="max-w-[7rem] truncate font-semibold text-text-dim">
        {getDisplayName(user)}
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-xl px-2.5 py-2 font-semibold text-text-dim transition-colors hover:bg-surface-2 hover:text-text"
      >
        로그아웃
      </button>
    </div>
  );
}
