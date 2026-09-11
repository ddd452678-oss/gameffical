"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { sanitizeNextPath } from "@/lib/safe-redirect";

const USERNAME_RE = /^[a-zA-Z0-9_]{4,20}$/;

function KakaoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3C6.48 3 2 6.48 2 10.78c0 2.72 1.83 5.11 4.58 6.5-.2.75-.73 2.73-.84 3.16-.13.53.2.53.42.38.17-.12 2.7-1.83 3.8-2.58.66.1 1.34.15 2.04.15 5.52 0 10-3.48 10-7.78S17.52 3 12 3Z"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.92l-3.88-3c-1.08.72-2.45 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.92H1.3v3.09C3.26 21.3 7.3 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.31 14.31A7.2 7.2 0 0 1 4.93 12c0-.8.14-1.58.38-2.31V6.6H1.3A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.3 5.4l4.01-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.3 0 3.26 2.7 1.3 6.6l4.01 3.09C6.25 6.87 8.89 4.77 12 4.77Z"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeNextPath(searchParams.get("next"));

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const supabase = getSupabaseBrowser();

  if (!supabase) {
    return (
      <p className="rounded-2xl bg-surface p-6 text-sm text-text-dim shadow-card">
        로그인 기능을 사용하려면 Supabase 설정이 필요합니다.
      </p>
    );
  }

  async function handleOAuth(provider: "kakao" | "google") {
    setError(null);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase!.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) setError(error.message);
  }

  function switchMode(next: "signin" | "signup") {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  async function handleSignIn() {
    if (!username || !password) {
      setError("아이디와 비밀번호를 입력해 주세요.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "로그인에 실패했습니다.");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp() {
    if (!USERNAME_RE.test(username)) {
      setError("아이디는 영문/숫자/밑줄(_)로 4~20자여야 해요.");
      return;
    }
    if (!email) {
      setError("이메일을 입력해 주세요.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 해요.");
      return;
    }
    setBusy(true);
    try {
      const { data: existing } = await supabase!
        .from("usernames")
        .select("username")
        .eq("username", username)
        .maybeSingle();
      if (existing) {
        setError("이미 사용 중인 아이디예요.");
        return;
      }

      const { error } = await supabase!.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (error) {
        setError(
          error.message.includes("already registered")
            ? "이미 가입된 이메일이에요."
            : error.message,
        );
        return;
      }
      setNotice(
        "가입 확인 메일을 보냈습니다. 메일함을 확인해 링크를 눌러주세요. (메일이 안 보이면 스팸함도 확인)",
      );
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (mode === "signin") await handleSignIn();
    else await handleSignUp();
  }

  return (
    <div className="mx-auto max-w-sm rounded-2xl bg-surface p-6 shadow-card">
      <h1 className="text-2xl font-extrabold">
        {mode === "signin" ? "로그인" : "회원가입"}
      </h1>
      <p className="mt-1.5 text-sm text-text-dim">
        리뷰는 로그인한 계정으로만 작성할 수 있어요. 둘러보는 건 로그인 없이도 자유롭게 가능합니다.
      </p>

      <div className="mt-6 space-y-2.5">
        <button
          type="button"
          disabled
          title="카카오 로그인은 준비 중입니다."
          className="flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-sm font-bold text-[#191600] opacity-50"
        >
          <KakaoIcon />
          카카오 로그인
          <span className="text-xs font-semibold">(준비중)</span>
        </button>
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-bold transition-colors hover:bg-surface-2"
        >
          <GoogleIcon />
          구글 로그인
        </button>
      </div>

      <div className="my-5 flex items-center gap-3 text-xs text-text-dim">
        <div className="h-px flex-1 bg-border" />
        또는 아이디로 {mode === "signin" ? "로그인" : "가입"}
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="아이디"
          autoComplete="username"
          className="h-11 w-full rounded-xl bg-surface-2 px-3.5 text-sm outline-none ring-1 ring-transparent transition focus:bg-surface focus:ring-brand"
        />
        {mode === "signup" && (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 (비밀번호 찾기·아이디 찾기용)"
            autoComplete="email"
            className="h-11 w-full rounded-xl bg-surface-2 px-3.5 text-sm outline-none ring-1 ring-transparent transition focus:bg-surface focus:ring-brand"
          />
        )}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호 (6자 이상)"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          className="h-11 w-full rounded-xl bg-surface-2 px-3.5 text-sm outline-none ring-1 ring-transparent transition focus:bg-surface focus:ring-brand"
        />

        {error && (
          <p className="rounded-xl bg-[#fdeaea] px-3 py-2.5 text-sm font-medium text-[#d84343]">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-xl bg-[#e7f4ee] px-3 py-2.5 text-sm font-medium text-[#188652]">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="h-12 w-full rounded-xl bg-brand text-sm font-bold text-white transition-colors hover:bg-brand-dim disabled:opacity-50"
        >
          {busy ? "처리 중…" : mode === "signin" ? "로그인" : "회원가입"}
        </button>
      </form>

      {mode === "signin" ? (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <Link href="/find-username" className="font-semibold text-text-dim hover:underline">
            아이디 찾기
          </Link>
          <span className="text-border">|</span>
          <Link href="/find-password" className="font-semibold text-text-dim hover:underline">
            비밀번호 찾기
          </Link>
          <span className="text-border">|</span>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className="font-semibold text-brand hover:underline"
          >
            회원가입
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => switchMode("signin")}
          className="mt-4 w-full text-center text-sm font-semibold text-brand hover:underline"
        >
          이미 계정이 있으신가요? 로그인
        </button>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
