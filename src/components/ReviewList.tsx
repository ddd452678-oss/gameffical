import { Stars } from "./Stars";
import type { Review, ReviewStats } from "@/lib/types";

export const COST_BURDEN_LABELS = [
  "",
  "지갑을 계속 열게 됨",
  "결제해야 쾌적함",
  "적당히 과금하면 무난",
  "거의 무과금으로 충분",
  "완전 무과금으로 만족",
];

export const GACHA_LABELS = [
  "",
  "매우 불투명",
  "불투명",
  "보통",
  "투명한 편",
  "매우 투명",
];

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function StatRow({ label, value, suffix }: { label: string; value: number | null; suffix?: string }) {
  return (
    <div className="flex items-center justify-between text-sm py-1.5">
      <span className="text-text-dim">{label}</span>
      <span className="font-semibold">
        {value == null ? "—" : `${value.toFixed(1)}${suffix ?? ""}`}
      </span>
    </div>
  );
}

export function ReviewStatsCard({ stats }: { stats: ReviewStats }) {
  return (
    <div className="rounded-2xl bg-surface p-5 shadow-card">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[15px] font-extrabold">겜피셜 유저 리뷰</h3>
        <span className="text-xs text-text-dim">{stats.review_count}개</span>
      </div>
      <div className="mt-2 divide-y divide-border">
        <StatRow label="재미 / 완성도" value={stats.avg_fun} suffix=" / 5" />
        <StatRow label="과금 부담도 (높을수록 무과금 친화)" value={stats.avg_cost_burden} suffix=" / 5" />
        <StatRow
          label="확률형 아이템 투명성"
          value={stats.avg_gacha_transparency}
          suffix=" / 5"
        />
      </div>
    </div>
  );
}

export function ReviewList({
  reviews,
  currentUserId,
}: {
  reviews: Review[];
  currentUserId?: string;
}) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-text-dim">
        아직 작성된 리뷰가 없습니다. 첫 리뷰를 남겨보세요.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {reviews.map((r) => (
        <li key={r.id} className="rounded-2xl bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              {r.author_name}
              {r.user_id === currentUserId && (
                <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold text-brand">
                  내 리뷰
                </span>
              )}
            </span>
            <span className="text-xs text-text-dim">{fmtDate(r.created_at)}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="flex items-center gap-1.5">
              <Stars value={r.fun_rating} size={13} />
              <span className="text-text-dim">재미 {r.fun_rating}</span>
            </span>
            <span className="text-text-dim">
              과금 부담도:{" "}
              <span className="text-text">{COST_BURDEN_LABELS[r.cost_burden]}</span>
            </span>
            {r.gacha_transparency != null && (
              <span className="text-text-dim">
                확률형 투명성:{" "}
                <span className="text-text">{GACHA_LABELS[r.gacha_transparency]}</span>
              </span>
            )}
          </div>
          <p className="mt-2 text-sm whitespace-pre-wrap leading-relaxed">{r.body}</p>
        </li>
      ))}
    </ul>
  );
}
