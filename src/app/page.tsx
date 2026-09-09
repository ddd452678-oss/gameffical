import Link from "next/link";
import { GameGrid } from "@/components/GameCard";
import { listFeatured } from "@/lib/games";
import { PLATFORM_LABELS, type PlatformKind } from "@/lib/types";

export const revalidate = 600;

const ORDER: PlatformKind[] = ["pc", "mobile", "console"];

export default async function HomePage() {
  const featured = await listFeatured();

  return (
    <div className="space-y-16">
      <section className="rounded-[24px] bg-surface px-6 py-16 text-center shadow-card">
        <h1 className="text-3xl font-extrabold leading-[1.3] tracking-tight sm:text-[40px]">
          게임, <span className="text-brand">공식 데이터</span>로
          <br className="hidden sm:block" /> 먼저 보고 고르세요
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-text-dim">
          전 세계 PC·모바일·콘솔 게임을 종합 평점과 함께 탐색하고, 과금 부담도와
          확률형 아이템 투명성까지 담은 유저 리뷰를 확인하세요.
        </p>
        <div className="mt-8 flex justify-center gap-2.5">
          {ORDER.map((k) => (
            <Link
              key={k}
              href={`/${k}`}
              className="rounded-2xl bg-brand px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-dim"
            >
              {PLATFORM_LABELS[k]}
            </Link>
          ))}
        </div>
      </section>

      {ORDER.map((k) => (
        <section key={k}>
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="text-xl font-extrabold">{PLATFORM_LABELS[k]}</h2>
            <Link
              href={`/${k}`}
              className="text-sm font-semibold text-brand hover:underline"
            >
              전체 보기 →
            </Link>
          </div>
          <GameGrid games={featured[k]} />
        </section>
      ))}
    </div>
  );
}
