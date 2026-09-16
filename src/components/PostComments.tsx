"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PostComment } from "@/lib/posts";

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function PostComments({
  postId,
  comments,
  currentUserId,
}: {
  postId: string;
  comments: PostComment[];
  currentUserId?: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!body.trim()) return setError("댓글 내용을 입력해 주세요.");
    setBusy(true);
    try {
      const res = await fetch("/api/posts/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, body }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "등록에 실패했습니다.");
        return;
      }
      setBody("");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("댓글을 삭제할까요?")) return;
    const res = await fetch("/api/posts/comments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-extrabold">
        댓글 <span className="text-sm font-normal text-text-dim">({comments.length})</span>
      </h2>

      {comments.length > 0 && (
        <ul className="space-y-2.5">
          {comments.map((c) => (
            <li key={c.id} className="rounded-xl bg-surface p-4 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{c.author_name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-dim">{fmtDate(c.created_at)}</span>
                  {c.user_id === currentUserId && (
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="text-xs font-semibold text-bad hover:underline"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      {currentUserId ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="댓글을 남겨보세요."
            rows={3}
            maxLength={2000}
            className="w-full resize-y rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm outline-none ring-1 ring-transparent transition focus:bg-surface focus:ring-brand"
          />
          {error && (
            <p className="rounded-xl bg-bad/15 px-3 py-2 text-xs font-medium text-bad">{error}</p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="h-10 rounded-xl bg-brand px-4 text-sm font-bold text-[#181008] transition-colors hover:bg-brand-dim disabled:opacity-50"
          >
            {busy ? "등록 중…" : "댓글 등록"}
          </button>
        </form>
      ) : (
        <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-sm text-text-dim shadow-card">
          댓글을 남기려면{" "}
          <Link href={`/login?next=/board/${postId}`} className="font-semibold text-brand hover:underline">
            로그인
          </Link>
          이 필요해요.
        </p>
      )}
    </section>
  );
}
