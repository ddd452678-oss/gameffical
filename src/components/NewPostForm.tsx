"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewPostForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("제목을 입력해 주세요.");
    if (body.trim().length < 1) return setError("내용을 입력해 주세요.");

    setBusy(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "등록에 실패했습니다.");
        return;
      }
      router.push(`/board/${json.post.id}`);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-extrabold">글쓰기</h1>
      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl bg-surface p-5 shadow-card">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          maxLength={200}
          className="h-11 w-full rounded-xl bg-surface-2 px-3.5 text-sm font-bold outline-none ring-1 ring-transparent transition focus:bg-surface focus:ring-brand"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="내용을 입력해 주세요."
          rows={12}
          maxLength={10000}
          className="w-full resize-y rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm outline-none ring-1 ring-transparent transition focus:bg-surface focus:ring-brand"
        />
        {error && (
          <p className="rounded-xl bg-bad/15 px-3 py-2.5 text-sm font-medium text-bad">{error}</p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="h-12 w-full rounded-xl bg-brand text-sm font-bold text-[#181008] transition-colors hover:bg-brand-dim disabled:opacity-50"
        >
          {busy ? "등록 중…" : "등록"}
        </button>
      </form>
    </div>
  );
}
