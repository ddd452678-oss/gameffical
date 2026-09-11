import Link from "next/link";
import { ScoreBadge } from "./ScoreBadge";
import { computeOverallScore, displayTitle, type Game } from "@/lib/types";

export function GameCard({ game }: { game: Game }) {
  const score = computeOverallScore(game);
  return (
    <Link
      href={`/game/${game.id}`}
      className="group overflow-hidden rounded-2xl bg-surface shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="aspect-[16/9] overflow-hidden bg-surface-2">
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
      </div>
      <div className="flex items-start gap-3 p-3.5">
        <ScoreBadge score={score} size="sm" />
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-bold">{displayTitle(game)}</h3>
          <p className="mt-0.5 truncate text-xs text-text-dim">
            {(game.genres_ko.length ? game.genres_ko : game.genres)
              .slice(0, 3)
              .join(" · ") || "장르 정보 없음"}
          </p>
          <p className="mt-1 text-[11px] text-text-dim">
            {game.released?.slice(0, 4) ?? "출시일 미정"}
          </p>
        </div>
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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {games.map((g) => (
        <GameCard key={g.id} game={g} />
      ))}
    </div>
  );
}
