"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { GENRE_OPTIONS } from "@/lib/types";

export function MyPageClient({
  displayName,
  email,
  username,
  preferredGenres,
  isEmailAccount,
}: {
  displayName: string;
  email: string | null;
  username: string | null;
  preferredGenres: string[];
  isEmailAccount: boolean;
}) {
  const router = useRouter();
  const supabase = getSupabaseBrowser();

  // 선호 장르
  const [genres, setGenres] = useState<string[]>(preferredGenres);
  const [genreSaving, setGenreSaving] = useState(false);
  const [genreNotice, setGenreNotice] = useState<string | null>(null);

  // 비밀번호 변경
  const [newPassword, setNewPassword] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwNotice, setPwNotice] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  // 회원탈퇴
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function toggleGenre(g: string) {
    setGenres((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]));
  }

  async function saveGenres() {
    if (!supabase) return;
    setGenreSaving(true);
    setGenreNotice(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("profiles")
        .update({ preferred_genres: genres })
        .eq("user_id", user.id);
      setGenreNotice(error ? "저장에 실패했어요." : "저장했어요.");
    } finally {
      setGenreSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwNotice(null);
    if (newPassword.length < 6) {
      setPwError("비밀번호는 6자 이상이어야 해요.");
      return;
    }
    if (!supabase) return;
    setPwBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPwError(error.message);
        return;
      }
      setPwNotice("비밀번호를 변경했어요.");
      setNewPassword("");
    } finally {
      setPwBusy(false);
    }
  }

  async function deleteAccount() {
    if (
      !window.confirm(
        "정말 탈퇴하시겠어요? 작성한 리뷰·게시글·좋아요가 모두 삭제되고 되돌릴 수 없어요.",
      )
    ) {
      return;
    }
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setDeleteError(json.error ?? "탈퇴 처리에 실패했어요.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setDeleteError("네트워크 오류가 발생했습니다.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">마이페이지</h1>
        <p className="mt-1 text-sm text-text-dim">
          {displayName}
          {username && ` (${username})`}
          {email && ` · ${email}`}
        </p>
      </div>

      <section className="rounded-2xl bg-surface p-5 shadow-card">
        <h2 className="text-[15px] font-extrabold">선호 장르</h2>
        <p className="mt-1 text-xs text-text-dim">
          관심 있는 장르를 골라두면 나중에 맞춤 추천에 활용돼요.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {GENRE_OPTIONS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => toggleGenre(g)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                genres.includes(g)
                  ? "bg-brand text-[#181008]"
                  : "bg-surface-2 text-text-dim hover:bg-border"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
        {genreNotice && <p className="mt-2 text-xs text-text-dim">{genreNotice}</p>}
        <button
          type="button"
          onClick={saveGenres}
          disabled={genreSaving}
          className="mt-4 h-10 w-full rounded-xl bg-brand text-sm font-bold text-[#181008] transition-colors hover:bg-brand-dim disabled:opacity-50"
        >
          {genreSaving ? "저장 중…" : "저장"}
        </button>
      </section>

      {isEmailAccount && (
        <section className="rounded-2xl bg-surface p-5 shadow-card">
          <h2 className="text-[15px] font-extrabold">비밀번호 변경</h2>
          <form onSubmit={changePassword} className="mt-3 space-y-2">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새 비밀번호 (6자 이상)"
              autoComplete="new-password"
              className="h-11 w-full rounded-xl bg-surface-2 px-3.5 text-sm outline-none ring-1 ring-transparent transition focus:bg-surface focus:ring-brand"
            />
            {pwError && (
              <p className="rounded-xl bg-bad/15 px-3 py-2 text-xs font-medium text-bad">
                {pwError}
              </p>
            )}
            {pwNotice && (
              <p className="rounded-xl bg-good/15 px-3 py-2 text-xs font-medium text-good">
                {pwNotice}
              </p>
            )}
            <button
              type="submit"
              disabled={pwBusy}
              className="h-10 w-full rounded-xl bg-brand text-sm font-bold text-[#181008] transition-colors hover:bg-brand-dim disabled:opacity-50"
            >
              {pwBusy ? "변경 중…" : "비밀번호 변경"}
            </button>
          </form>
        </section>
      )}

      <section className="rounded-2xl bg-surface p-5 shadow-card">
        <h2 className="text-[15px] font-extrabold text-bad">회원탈퇴</h2>
        <p className="mt-1 text-xs text-text-dim">
          탈퇴하면 계정과 작성한 모든 활동 내역이 영구적으로 삭제돼요.
        </p>
        {deleteError && (
          <p className="mt-2 rounded-xl bg-bad/15 px-3 py-2 text-xs font-medium text-bad">
            {deleteError}
          </p>
        )}
        <button
          type="button"
          onClick={deleteAccount}
          disabled={deleteBusy}
          className="mt-3 h-10 w-full rounded-xl border border-bad text-sm font-bold text-bad transition-colors hover:bg-bad/15 disabled:opacity-50"
        >
          {deleteBusy ? "처리 중…" : "회원탈퇴"}
        </button>
      </section>
    </div>
  );
}
