import type { Metadata } from "next";
import { GameGrid } from "@/components/GameCard";
import { Pagination } from "@/components/Pagination";
import { listGamesByRegion } from "@/lib/games";

export const revalidate = 600;

export const metadata: Metadata = { title: "해외 게임 — 겜피셜" };

const PAGE_SIZE = 48;

export default async function OverseasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ page: pageParam }, allGames] = await Promise.all([
    searchParams,
    listGamesByRegion("overseas"),
  ]);

  const totalPages = Math.max(1, Math.ceil(allGames.length / PAGE_SIZE));
  const page = Math.min(Math.max(Number(pageParam) || 1, 1), totalPages);
  const games = allGames.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-extrabold">해외 게임</h1>
        <span className="text-sm text-text-dim">{allGames.length}개</span>
      </div>
      <p className="mb-6 rounded-2xl bg-surface px-4 py-3 text-xs leading-relaxed text-text-dim shadow-card">
        국내 게임사가 아닌 해외 게임사가 서비스하는 게임을 모았습니다.
        PC·모바일·콘솔을 가리지 않고 모두 포함합니다.
      </p>
      <GameGrid games={games} />
      <Pagination
        page={page}
        totalPages={totalPages}
        hrefFor={(p) => (p === 1 ? "/overseas" : `/overseas?page=${p}`)}
      />
    </div>
  );
}
