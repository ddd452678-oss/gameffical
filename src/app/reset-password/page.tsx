"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();

  const [ready, setReady] = useState<boolean | null>(null); // null = 확인 중
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setReady(false);
      return;
    }
    supabase.auth.getUser().then(({ data }) => setReady(!!data.user));
  }, [supabase]);

  if (!supabase || ready === false) {
    return (
      <div className="mx-auto max-w-sm rounded-2xl bg-surface p-6 text-center shadow-card">
        <p className="text-sm text-text-dim">
          유효하지 않은 접근이에요. 비밀번호 재설정 메일에 있는 링크로 다시
          들어와 주세요.
        </p>
      </div>
    );
  }

  if (ready === null) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 해요.");
      return;
    }
    if (password !== password2) {
      setError("비밀번호가 서로 달라요.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase!.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        return;
      }
      setDone(true);
      setTimeout(() => router.replace("/"), 1500);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm rounded-2xl bg-surface p-6 shadow-card">
      <h1 className="text-2xl font-extrabold">비밀번호 재설정</h1>
      <p className="mt-1.5 text-sm text-text-dim">새 비밀번호를 입력해 주세요.</p>

      {done ? (
        <p className="mt-6 rounded-xl bg-[#e7f4ee] px-3 py-2.5 text-sm font-medium text-[#188652]">
          비밀번호가 변경됐어요. 잠시 후 홈으로 이동합니다.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="새 비밀번호 (6자 이상)"
            autoComplete="new-password"
            className="h-11 w-full rounded-xl bg-surface-2 px-3.5 text-sm outline-none ring-1 ring-transparent transition focus:bg-surface focus:ring-brand"
          />
          <input
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder="새 비밀번호 확인"
            autoComplete="new-password"
            className="h-11 w-full rounded-xl bg-surface-2 px-3.5 text-sm outline-none ring-1 ring-transparent transition focus:bg-surface focus:ring-brand"
          />
          {error && (
            <p className="rounded-xl bg-[#fdeaea] px-3 py-2.5 text-sm font-medium text-[#d84343]">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="h-12 w-full rounded-xl bg-brand text-sm font-bold text-white transition-colors hover:bg-brand-dim disabled:opacity-50"
          >
            {busy ? "변경 중…" : "비밀번호 변경"}
          </button>
        </form>
      )}
    </div>
  );
}
