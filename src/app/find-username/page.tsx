"use client";

import { useState } from "react";
import Link from "next/link";

export default function FindUsernamePage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<
    { found: true; maskedUsername: string } | { found: false } | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!email.trim()) {
      setError("이메일을 입력해 주세요.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/find-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "조회에 실패했습니다.");
        return;
      }
      setResult(json);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm rounded-2xl bg-surface p-6 shadow-card">
      <h1 className="text-2xl font-extrabold">아이디 찾기</h1>
      <p className="mt-1.5 text-sm text-text-dim">
        가입할 때 입력한 이메일을 넣어주세요. 카카오·구글로 가입한 계정은
        아이디가 없어요 (해당 소셜 로그인으로 로그인해 주세요).
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="가입한 이메일"
          autoComplete="email"
          className="h-11 w-full rounded-xl bg-surface-2 px-3.5 text-sm outline-none ring-1 ring-transparent transition focus:bg-surface focus:ring-brand"
        />
        {error && (
          <p className="rounded-xl bg-[#fdeaea] px-3 py-2.5 text-sm font-medium text-[#d84343]">
            {error}
          </p>
        )}
        {result &&
          (result.found ? (
            <p className="rounded-xl bg-[#e7f4ee] px-3 py-2.5 text-sm font-medium text-[#188652]">
              회원님의 아이디는{" "}
              <span className="font-extrabold">{result.maskedUsername}</span>{" "}
              입니다.
            </p>
          ) : (
            <p className="rounded-xl bg-surface-2 px-3 py-2.5 text-sm text-text-dim">
              일치하는 계정을 찾을 수 없어요.
            </p>
          ))}
        <button
          type="submit"
          disabled={busy}
          className="h-12 w-full rounded-xl bg-brand text-sm font-bold text-white transition-colors hover:bg-brand-dim disabled:opacity-50"
        >
          {busy ? "확인 중…" : "아이디 찾기"}
        </button>
      </form>

      <Link
        href="/login"
        className="mt-4 block text-center text-sm font-semibold text-brand hover:underline"
      >
        로그인으로 돌아가기
      </Link>
    </div>
  );
}
