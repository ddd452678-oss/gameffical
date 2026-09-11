import type { Metadata } from "next";
import { GameGrid } from "@/components/GameCard";
import { listGamesByRegion } from "@/lib/games";

export const revalidate = 600;

export const metadata: Metadata = { title: "국내 게임 — 겜피셜" };

export default async function DomesticPage() {
  const games = await listGamesByRegion("domestic");

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-extrabold">국내 게임</h1>
        <span className="text-sm text-text-dim">{games.length}개</span>
      </div>
      <p className="mb-6 rounded-2xl bg-surface px-4 py-3 text-xs leading-relaxed text-text-dim shadow-card">
        게임물관리위원회(GRAC)에 등록된 배급사 정보를 기준으로 국내 게임사가
        서비스하는 게임을 모았습니다. PC·모바일·콘솔을 가리지 않고 모두
        포함합니다.
      </p>
      <GameGrid games={games} />
    </div>
  );
}
