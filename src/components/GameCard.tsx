import Link from "next/link";
import { ScoreBadge } from "./ScoreBadge";
import { LikeButton } from "./LikeButton";
import { computeOverallScore, displayGenres, displayTitle, type Game } from "@/lib/types";

export function GameCard({ game }: { game: Game }) {
  const score = computeOverallScore(game);
  return (
    <Link
      href={`/game/${game.id}`}
      className="group relative block aspect-[16/9] overflow-hidden rounded-xl bg-surface-2 shadow-card transition-all duration-200 hover:shadow-card-hover"
    >
      {game.background_image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={game.background_image}
          alt={game.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-sm text-text-dim">
          이미지 없음
        </div>
      )}

      {/* 하단 그라데이션 스크림 — 그 위에 제목/장르를 얹기 위함 */}
      <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />

      <div className="absolute left-2 top-2">
        <ScoreBadge score={score} size="sm" />
      </div>
      <div className="absolute right-2 top-2">
        <LikeButton target="game" targetId={game.id} />
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3">
        <h3 className="truncate text-[15px] font-bold text-white">{displayTitle(game)}</h3>
        <p className="mt-0.5 truncate text-xs text-white/65">
          {[displayGenres(game).slice(0, 2).join(" · "), game.released?.slice(0, 4)]
            .filter(Boolean)
            .join(" · ") || "정보 없음"}
        </p>
      </div>
    </Link>
  );
}

export function GameGrid({ games }: { games: Game[] }) {
  if (games.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-text-dim">
        표시할 게임이 없습니다.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {games.map((g) => (
        <GameCard key={g.id} game={g} />
      ))}
    </div>
  );
}
