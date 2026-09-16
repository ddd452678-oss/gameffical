import Link from "next/link";
import { GameGrid } from "@/components/GameCard";
import { listFeatured } from "@/lib/games";
import { PLATFORM_LABELS, type PlatformKind } from "@/lib/types";

export const revalidate = 600;

const ORDER: PlatformKind[] = ["pc", "mobile", "console"];

export default async function HomePage() {
  const featured = await listFeatured();

  const heroImages = [...featured.pc, ...featured.console, ...featured.mobile]
    .map((g) => g.background_image)
    .filter((src): src is string => !!src)
    .slice(0, 6);

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-2xl px-6 py-20 text-center sm:py-28">
        <div className="absolute inset-0 -z-10 bg-surface">
          <div className="grid h-full grid-cols-3 sm:grid-cols-6">
            {heroImages.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt="" className="h-full w-full object-cover" />
            ))}
          </div>
          <div className="absolute inset-0 backdrop-blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/90 to-bg/55" />
        </div>

        <h1 className="text-3xl font-extrabold leading-[1.3] tracking-tight sm:text-[42px]">
          게임, <span className="text-brand">공식 데이터</span>로
          <br className="hidden sm:block" /> 먼저 보고 고르세요
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-text-dim">
          전 세계 PC·모바일·콘솔 게임을 종합 평점과 함께 탐색하고, 과금 부담도와
          확률형 아이템 투명성까지 담은 유저 리뷰를 확인하세요.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          {ORDER.map((k) => (
            <Link
              key={k}
              href={`/${k}`}
              className="whitespace-nowrap rounded-xl bg-brand px-4 py-3 text-sm font-bold text-[#181008] transition-colors hover:bg-brand-dim sm:px-5"
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
              전체 보기
            </Link>
          </div>
          <GameGrid games={featured[k]} />
        </section>
      ))}
    </div>
  );
}
