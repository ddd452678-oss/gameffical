"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type LikeTarget = "game" | "review";

const CONFIG: Record<
  LikeTarget,
  { table: string; countView: string; idField: string }
> = {
  game: { table: "game_likes", countView: "game_like_counts", idField: "game_id" },
  review: { table: "review_likes", countView: "review_like_counts", idField: "review_id" },
};

/**
 * 게임/리뷰 좋아요 버튼. 개수·좋아요 여부를 자체적으로 불러온다 (목록
 * 페이지가 유저별 상태 때문에 캐시를 못 타게 되는 걸 피하려고, 서버에서
 * props 로 안 내려주고 클라이언트에서 각자 불러오는 방식을 택함).
 */
export function LikeButton({
  target,
  targetId,
  size = "sm",
}: {
  target: LikeTarget;
  targetId: number | string;
  size?: "sm" | "md";
}) {
  const pathname = usePathname();
  const supabase = getSupabaseBrowser();
  const { table, countView, idField } = CONFIG[target];

  const [userId, setUserId] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    (async () => {
      const [{ data: userData }, { data: countRow }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from(countView).select("like_count").eq(idField, targetId).maybeSingle(),
      ]);
      if (cancelled) return;
      setCount((countRow as { like_count: number } | null)?.like_count ?? 0);

      const uid = userData.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        const { data: likeRow } = await supabase
          .from(table)
          .select(idField)
          .eq(idField, targetId)
          .eq("user_id", uid)
          .maybeSingle();
        if (!cancelled) setLiked(!!likeRow);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, target, targetId]);

  async function toggle(e: React.MouseEvent) {
    // GameCard 처럼 <Link> 안에 놓일 수 있어 카드 이동을 막는다.
    e.preventDefault();
    e.stopPropagation();
    if (!supabase || busy) return;

    if (!userId) {
      window.location.href = `/login?next=${encodeURIComponent(pathname)}`;
      return;
    }

    setBusy(true);
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => (c ?? 0) + (nextLiked ? 1 : -1));
    try {
      if (nextLiked) {
        const { error } = await supabase.from(table).insert({ [idField]: targetId, user_id: userId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq(idField, targetId)
          .eq("user_id", userId);
        if (error) throw error;
      }
    } catch {
      // 실패 시 낙관적 업데이트 롤백
      setLiked(!nextLiked);
      setCount((c) => (c ?? 0) + (nextLiked ? -1 : 1));
    } finally {
      setBusy(false);
    }
  }

  if (!supabase) return null;

  const dims = size === "md" ? "h-9 px-3 text-sm" : "h-7 px-2 text-xs";

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full font-bold backdrop-blur-sm transition-colors ${dims} ${
        liked
          ? "bg-bad/20 text-bad"
          : "bg-black/35 text-white/80 hover:bg-bad/20 hover:text-bad"
      }`}
      aria-pressed={liked}
      aria-label={liked ? "좋아요 취소" : "좋아요"}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z" />
      </svg>
      {count ?? " "}
    </button>
  );
}
