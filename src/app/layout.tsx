import type { Metadata } from "next";
import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import "./globals.css";

export const metadata: Metadata = {
  title: "겜피셜 (GamPicial) — 공식 데이터 기반 게임 리뷰",
  description:
    "전 세계 PC·모바일·콘솔 게임을 공식 데이터 기반 종합 평점과 함께 탐색하고, 과금 부담도·확률형 아이템 투명성까지 담은 유저 리뷰를 남기세요.",
};

const NAV = [
  { href: "/pc", label: "PC" },
  { href: "/mobile", label: "모바일" },
  { href: "/console", label: "콘솔" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-5">
            <Link
              href="/"
              className="text-xl font-extrabold tracking-tight"
            >
              겜<span className="text-brand">피셜</span>
            </Link>
            <nav className="flex items-center gap-1 text-[15px] font-semibold">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-xl px-3.5 py-2 text-text-dim transition-colors hover:bg-surface-2 hover:text-text"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            <SearchBox />
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
