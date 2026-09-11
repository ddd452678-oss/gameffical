import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GameGrid } from "@/components/GameCard";
import { Pagination } from "@/components/Pagination";
import { listGamesByPlatform } from "@/lib/games";
import { PLATFORM_LABELS, type PlatformKind } from "@/lib/types";

export const revalidate = 600;

const VALID: PlatformKind[] = ["pc", "mobile", "console"];
const PAGE_SIZE = 48;

export function generateStaticParams() {
  return VALID.map((platform) => ({ platform }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ platform: string }>;
}): Promise<Metadata> {
  const { platform } = await params;
  if (!VALID.includes(platform as PlatformKind)) return {};
  return { title: `${PLATFORM_LABELS[platform as PlatformKind]} — 겜피셜` };
}

export default async function PlatformPage({
  params,
  searchParams,
}: {
  params: Promise<{ platform: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { platform } = await params;
  if (!VALID.includes(platform as PlatformKind)) notFound();
  const kind = platform as PlatformKind;

  const [{ page: pageParam }, allGames] = await Promise.all([
    searchParams,
    listGamesByPlatform(kind),
  ]);

  const totalPages = Math.max(1, Math.ceil(allGames.length / PAGE_SIZE));
  const page = Math.min(Math.max(Number(pageParam) || 1, 1), totalPages);
  const games = allGames.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-extrabold">{PLATFORM_LABELS[kind]}</h1>
        <span className="text-sm text-text-dim">{allGames.length}개</span>
      </div>
      {kind === "mobile" && (
        <p className="mb-6 rounded-2xl bg-surface px-4 py-3 text-xs leading-relaxed text-text-dim shadow-card">
          모바일 게임은 공식 평점 API가 없어 종합 평점 대신 겜피셜 유저 리뷰를
          중심으로 제공합니다.
        </p>
      )}
      <GameGrid games={games} />
      <Pagination
        page={page}
        totalPages={totalPages}
        hrefFor={(p) => (p === 1 ? `/${kind}` : `/${kind}?page=${p}`)}
      />
    </div>
  );
}
