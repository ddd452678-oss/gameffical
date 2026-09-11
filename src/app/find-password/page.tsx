"use client";

import { useState } from "react";
import Link from "next/link";

export default function FindPasswordPage() {
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!username.trim()) {
      setError("아이디를 입력해 주세요.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "요청에 실패했습니다.");
        return;
      }
      setDone(true);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm rounded-2xl bg-surface p-6 shadow-card">
      <h1 className="text-2xl font-extrabold">비밀번호 찾기</h1>
      <p className="mt-1.5 text-sm text-text-dim">
        아이디를 입력하면, 가입할 때 등록한 이메일로 비밀번호 재설정 링크를
        보내드려요.
      </p>

      {done ? (
        <p className="mt-6 rounded-xl bg-[#e7f4ee] px-3 py-2.5 text-sm font-medium text-[#188652]">
          입력하신 아이디로 가입된 계정이 있다면, 등록된 이메일로 재설정
          링크를 보냈어요. 메일함(스팸함 포함)을 확인해 주세요.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="아이디"
            autoComplete="username"
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
            {busy ? "요청 중…" : "재설정 메일 보내기"}
          </button>
        </form>
      )}

      <Link
        href="/login"
        className="mt-4 block text-center text-sm font-semibold text-brand hover:underline"
      >
        로그인으로 돌아가기
      </Link>
    </div>
  );
}
