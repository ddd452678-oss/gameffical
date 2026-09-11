"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { COST_BURDEN_LABELS, GACHA_LABELS } from "./ReviewList";
import type { Review } from "@/lib/types";

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className={`text-2xl leading-none transition-colors ${
            n <= (hover || value) ? "text-accent" : "text-border"
          }`}
          aria-label={`${n}점`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ScalePicker({
  value,
  onChange,
  labels,
}: {
  value: number;
  onChange: (v: number) => void;
  labels: string[];
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-10 flex-1 rounded-xl text-sm font-bold transition-colors ${
              value === n
                ? "bg-brand text-white"
                : "bg-surface-2 text-text-dim hover:bg-[#e8eef7]"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="text-xs text-text-dim h-4">{value ? labels[value] : ""}</p>
    </div>
  );
}

/** 로그인하지 않은 방문자에게 보여주는 안내 카드. */
function LoginPrompt({ gameId }: { gameId: number }) {
  return (
    <div className="space-y-3 rounded-2xl bg-surface p-5 text-center shadow-card">
      <h3 className="text-[15px] font-extrabold">리뷰 작성</h3>
      <p className="text-sm text-text-dim">
        리뷰는 로그인한 계정으로만 남길 수 있어요.
        <br />
        카카오·구글·이메일로 간단하게 로그인해 주세요.
      </p>
      <Link
        href={`/login?next=${encodeURIComponent(`/game/${gameId}`)}`}
        className="inline-block h-11 w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-bold leading-6 text-white transition-colors hover:bg-brand-dim"
      >
        로그인하고 리뷰 남기기
      </Link>
    </div>
  );
}

export function ReviewForm({
  gameId,
  currentUser,
  initialReview,
}: {
  gameId: number;
  currentUser: { id: string; displayName: string } | null;
  initialReview: Review | null;
}) {
  const router = useRouter();
  const isEdit = !!initialReview;

  const [authorName, setAuthorName] = useState(
    initialReview?.author_name ?? currentUser?.displayName ?? "",
  );
  const [fun, setFun] = useState(initialReview?.fun_rating ?? 0);
  const [cost, setCost] = useState(initialReview?.cost_burden ?? 0);
  const [gacha, setGacha] = useState(initialReview?.gacha_transparency ?? 0);
  const [gachaNA, setGachaNA] = useState(
    initialReview ? initialReview.gacha_transparency == null : false,
  );
  const [body, setBody] = useState(initialReview?.body ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!currentUser) return <LoginPrompt gameId={gameId} />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fun) return setError("재미/완성도 별점을 선택해 주세요.");
    if (!cost) return setError("과금 부담도를 선택해 주세요.");
    if (!gachaNA && !gacha)
      return setError("확률형 아이템 투명성을 선택하거나 '해당 없음'을 눌러주세요.");
    if (body.trim().length < 5) return setError("리뷰 내용을 5자 이상 작성해 주세요.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: initialReview?.id,
          game_id: gameId,
          author_name: authorName,
          fun_rating: fun,
          cost_burden: cost,
          gacha_transparency: gachaNA ? null : gacha,
          body,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "저장에 실패했습니다.");
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!initialReview) return;
    if (!window.confirm("리뷰를 삭제할까요? 되돌릴 수 없어요.")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: initialReview.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "삭제에 실패했습니다.");
        return;
      }
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl bg-surface p-5 shadow-card"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-extrabold">
          {isEdit ? "내 리뷰 수정" : "리뷰 작성"}
        </h3>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs font-semibold text-[#d84343] hover:underline disabled:opacity-50"
          >
            {deleting ? "삭제 중…" : "삭제"}
          </button>
        )}
      </div>

      {done && (
        <p className="rounded-xl bg-[#e7f4ee] px-3 py-2.5 text-sm font-medium text-[#188652]">
          {isEdit ? "리뷰가 수정되었습니다." : "리뷰가 등록되었습니다. 감사합니다!"}
        </p>
      )}

      <div>
        <label className="text-sm text-text-dim">닉네임</label>
        <input
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          maxLength={20}
          placeholder={currentUser.displayName}
          className="mt-1.5 h-11 w-full rounded-xl bg-surface-2 px-3.5 text-sm outline-none ring-1 ring-transparent transition focus:bg-surface focus:ring-brand"
        />
      </div>

      <div>
        <label className="text-sm text-text-dim">재미 / 완성도</label>
        <div className="mt-1">
          <StarPicker value={fun} onChange={setFun} />
        </div>
      </div>

      <div>
        <label className="text-sm text-text-dim">
          과금 부담도{" "}
          <span className="text-[11px]">(1: 계속 결제 · 5: 무과금으로 충분)</span>
        </label>
        <div className="mt-1">
          <ScalePicker value={cost} onChange={setCost} labels={COST_BURDEN_LABELS} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-text-dim">
            확률형 아이템 체감 투명성
          </label>
          <label className="flex items-center gap-1.5 text-xs text-text-dim">
            <input
              type="checkbox"
              checked={gachaNA}
              onChange={(e) => setGachaNA(e.target.checked)}
            />
            해당 없음
          </label>
        </div>
        {!gachaNA && (
          <div className="mt-1">
            <ScalePicker value={gacha} onChange={setGacha} labels={GACHA_LABELS} />
          </div>
        )}
      </div>

      <div>
        <label className="text-sm text-text-dim">리뷰 내용</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          maxLength={5000}
          placeholder="실제 플레이 경험을 자유롭게 적어주세요."
          className="mt-1.5 w-full resize-y rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm outline-none ring-1 ring-transparent transition focus:bg-surface focus:ring-brand"
        />
        <p className="text-[11px] text-text-dim mt-1">{body.length} / 5000</p>
      </div>

      {error && (
        <p className="rounded-xl bg-[#fdeaea] px-3 py-2.5 text-sm font-medium text-[#d84343]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="h-12 w-full rounded-xl bg-brand text-sm font-bold text-white transition-colors hover:bg-brand-dim disabled:opacity-50"
      >
        {submitting ? "저장 중…" : isEdit ? "수정 완료" : "리뷰 등록"}
      </button>
    </form>
  );
}
