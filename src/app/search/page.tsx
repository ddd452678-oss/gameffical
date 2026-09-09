import type { Metadata } from "next";
import { GameGrid } from "@/components/GameCard";
import { SearchBox } from "@/components/SearchBox";
import { searchGamesByName } from "@/lib/games";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string | string[] }>;

function readQuery(sp: { q?: string | string[] }): string {
  const raw = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  return (raw ?? "").trim();
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const q = readQuery(await searchParams);
  return { title: q ? `‘${q}’ 검색 결과 — 겜피셜` : "검색 — 겜피셜" };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const q = readQuery(await searchParams);
  const games = q ? await searchGamesByName(q) : [];

  return (
    <div>
      <div className="sm:hidden mb-5">
        <SearchBox initialQuery={q} />
      </div>

      <h1 className="text-2xl font-extrabold">
        {q ? <>‘{q}’ 검색 결과</> : "게임 검색"}
      </h1>
      {q && (
        <p className="mb-6 mt-1 text-sm text-text-dim">{games.length}개</p>
      )}

      {!q ? (
        <p className="mt-4 text-sm text-text-dim">
          상단 검색창에 게임 이름을 입력해 주세요.
        </p>
      ) : games.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-text-dim">
          ‘{q}’에 대한 검색 결과가 없습니다.
        </p>
      ) : (
        <GameGrid games={games} />
      )}
    </div>
  );
}
