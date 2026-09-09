import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ScoreBadge } from "@/components/ScoreBadge";
import { Stars } from "@/components/Stars";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewList, ReviewStatsCard } from "@/components/ReviewList";
import { getGame } from "@/lib/games";
import { getReviewStats, listReviews } from "@/lib/reviews";
import {
  computeOverallScore,
  PLATFORM_LABELS,
  type Game,
} from "@/lib/types";

export const revalidate = 1800;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const game = await getGame(id);
  if (!game) return { title: "게임을 찾을 수 없습니다 — 겜피셜" };
  return {
    title: `${game.name} — 겜피셜`,
    description: game.description?.slice(0, 150) ?? undefined,
  };
}

function buildStoreLinks(game: Game) {
  const links: { label: string; url: string }[] = [];
  const seen = new Set<string>();
  const add = (label: string, url: string) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    links.push({ label, url });
  };

  if (game.steam_appid) {
    add("Steam에서 보기", `https://store.steampowered.com/app/${game.steam_appid}`);
  }
  for (const s of game.stores) add(`${s.store}`, s.url);
  return links;
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-sm py-1.5 border-b border-border last:border-0">
      <span className="w-20 shrink-0 text-text-dim">{label}</span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = await getGame(id);
  if (!game) notFound();

  const overall = computeOverallScore(game);
  const [reviews, stats] = await Promise.all([
    listReviews(game.id),
    getReviewStats(game.id),
  ]);
  const storeLinks = buildStoreLinks(game);

  return (
    <div>
      <Link href="/" className="text-sm font-semibold text-text-dim hover:text-text">
        ← 목록으로
      </Link>

      {/* 헤더 */}
      <div className="mt-3 overflow-hidden rounded-[20px] bg-surface shadow-card">
        {game.background_image && (
          <div className="aspect-[21/9] bg-surface-2 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={game.background_image}
              alt={game.name}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="flex items-start gap-4 p-6">
          <ScoreBadge score={overall} size="lg" />
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold">{game.name}</h1>
            <p className="mt-1 text-sm text-text-dim">
              {(game.genres_ko.length ? game.genres_ko : game.genres).join(
                " · ",
              ) || "장르 정보 없음"}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {game.platform_kinds.map((k) => (
                <span
                  key={k}
                  className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-text-dim"
                >
                  {PLATFORM_LABELS[k]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-[1fr_320px] gap-6">
        {/* 본문 */}
        <div className="space-y-6">
          <section>
            <h2 className="mb-2.5 text-lg font-extrabold">소개</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-text/90">
              {game.description
                ? game.description.split("\n\n")[0]
                : "등록된 소개문이 없습니다."}
            </p>
          </section>

          <section>
            <h2 className="mb-2.5 text-lg font-extrabold">정보</h2>
            <div className="rounded-2xl bg-surface px-5 py-2 shadow-card">
              <MetaRow label="장르">
                {(game.genres_ko.length ? game.genres_ko : game.genres).join(
                  ", ",
                ) || "—"}
              </MetaRow>
              <MetaRow label="출시일">{game.released ?? "미정"}</MetaRow>
              <MetaRow label="플랫폼">
                {game.raw_platforms.join(", ") ||
                  game.platform_kinds.map((k) => PLATFORM_LABELS[k]).join(", ")}
              </MetaRow>
              {game.publisher && (
                <MetaRow label="배급사">{game.publisher}</MetaRow>
              )}
              {game.age_rating && (
                <MetaRow label="이용등급">{game.age_rating}</MetaRow>
              )}
              {game.content_descriptors.length > 0 && (
                <MetaRow label="내용정보">
                  {game.content_descriptors.join(", ")}
                </MetaRow>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-2.5 text-lg font-extrabold">종합 평점 상세</h2>
            <div className="rounded-2xl bg-surface px-5 py-2 shadow-card">
              <MetaRow label="종합">
                {overall == null ? (
                  "공식 평점 데이터 없음"
                ) : (
                  <span className="font-bold">{overall} / 100</span>
                )}
              </MetaRow>
              <MetaRow label="Metacritic">
                {game.metacritic ?? "—"}
              </MetaRow>
              <MetaRow label="RAWG">
                {game.rawg_rating ? (
                  <span className="inline-flex items-center gap-2">
                    <Stars value={game.rawg_rating} />
                    {game.rawg_rating.toFixed(2)} / 5
                    <span className="text-text-dim text-xs">
                      ({game.rawg_ratings_count.toLocaleString()}표)
                    </span>
                  </span>
                ) : (
                  "—"
                )}
              </MetaRow>
              <MetaRow label="Steam">
                {game.steam_positive_pct != null
                  ? `긍정 ${game.steam_positive_pct}% (${(
                      game.steam_review_count ?? 0
                    ).toLocaleString()}개 리뷰)`
                  : "—"}
              </MetaRow>
            </div>
            <p className="text-[11px] text-text-dim mt-1.5">
              종합 평점은 Metacritic·RAWG·Steam 등 확보 가능한 공식 지표를 가중
              평균한 값입니다.
            </p>
          </section>

          {storeLinks.length > 0 && (
            <section>
              <h2 className="mb-2.5 text-lg font-extrabold">구매 · 설치</h2>
              <div className="flex flex-wrap gap-2">
                {storeLinks.map((l) => (
                  <a
                    key={l.url}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dim"
                  >
                    {l.label} ↗
                  </a>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-lg font-extrabold">
              유저 리뷰{" "}
              <span className="text-sm font-normal text-text-dim">
                ({reviews.length})
              </span>
            </h2>
            <ReviewList reviews={reviews} />
          </section>
        </div>

        {/* 사이드바 */}
        <aside className="space-y-4 lg:sticky lg:top-20 self-start">
          <ReviewStatsCard stats={stats} />
          <ReviewForm gameId={game.id} />
        </aside>
      </div>
    </div>
  );
}
