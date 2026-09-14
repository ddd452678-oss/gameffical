import type { Metadata } from "next";
import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { AuthStatus } from "@/components/AuthStatus";
import { HeaderNav } from "@/components/HeaderNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "겜피셜 (GamPicial) — 공식 데이터 기반 게임 리뷰",
  description:
    "전 세계 PC·모바일·콘솔 게임을 공식 데이터 기반 종합 평점과 함께 탐색하고, 과금 부담도·확률형 아이템 투명성까지 담은 유저 리뷰를 남기세요.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md relative">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-5 sm:gap-4">
            <Link
              href="/"
              className="shrink-0 text-xl font-extrabold tracking-tight"
            >
              겜<span className="text-brand">피셜</span>
            </Link>
            <HeaderNav />
            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
              <SearchBox />
              <AuthStatus />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
        <footer className="mx-auto mt-20 max-w-6xl border-t border-border px-5 py-10 text-xs leading-relaxed text-text-dim">
          <p>
            겜피셜은 RAWG·Steam 등 공식 API 데이터와 자체 유저 리뷰만을 사용합니다.
            비공식 커뮤니티 크롤링은 하지 않습니다.
          </p>
        </footer>
      </body>
    </html>
  );
}
