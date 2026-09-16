"use client";

import { useRouter } from "next/navigation";

export function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!window.confirm("게시글을 삭제할까요? 되돌릴 수 없어요.")) return;
    const res = await fetch("/api/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: postId }),
    });
    if (res.ok) {
      router.push("/board");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="text-xs font-semibold text-bad hover:underline"
    >
      삭제
    </button>
  );
}
