"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// 플랫폼(기기 기준)과 지역(국내/해외, 배급사 국적 기준)은 서로 다른 분류
// 축이라 시각적으로 구분해서 보여준다 — 안 그러면 한 줄에 나란히 있어
// "국내 PC 게임은 어디서 보나" 헷갈리기 쉽다.
const PLATFORM_NAV = [
  { href: "/pc", label: "PC" },
  { href: "/mobile", label: "모바일" },
  { href: "/console", label: "콘솔" },
];
const REGION_NAV = [
  { href: "/domestic", label: "국내" },
  { href: "/overseas", label: "해외" },
];

/**
 * 데스크톱: 가로 메뉴 그대로 표시.
 * 모바일(md 미만): 햄버거 버튼 + 드롭다운 패널로 전환한다.
 * (예전엔 좁은 화면에서 메뉴/로고 글자가 세로로 쪼개져 쌓이고 페이지 전체가
 * 가로로 스크롤되는 문제가 있었음 — 폭에 안 맞으면 줄이 아니라 접어야 한다)
 */
export function HeaderNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="hidden items-center gap-1 text-[15px] font-semibold md:flex">
        {PLATFORM_NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`rounded-xl px-3.5 py-2 transition-colors hover:bg-surface-2 hover:text-text ${
              pathname === n.href ? "text-text" : "text-text-dim"
            }`}
          >
            {n.label}
          </Link>
        ))}
        <div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        {REGION_NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`rounded-xl px-3.5 py-2 transition-colors hover:bg-surface-2 hover:text-text ${
              pathname === n.href ? "text-text" : "text-text-dim"
            }`}
          >
            {n.label}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={open}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-text-dim transition-colors hover:bg-surface-2 md:hidden"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          {open ? (
            <path
              d="M5 5l10 10M15 5L5 15"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M3 5.5h14M3 10h14M3 14.5h14"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-20 border-b border-border bg-surface px-5 py-3 shadow-card md:hidden">
          <p className="px-1 pb-1 text-[11px] font-semibold text-text-dim">플랫폼</p>
          <nav className="grid grid-cols-2 gap-1 text-[15px] font-semibold">
            {PLATFORM_NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-3.5 py-2.5 transition-colors hover:bg-surface-2 hover:text-text ${
                  pathname === n.href ? "bg-surface-2 text-text" : "text-text-dim"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <p className="px-1 pb-1 pt-3 text-[11px] font-semibold text-text-dim">지역</p>
          <nav className="grid grid-cols-2 gap-1 text-[15px] font-semibold">
            {REGION_NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-3.5 py-2.5 transition-colors hover:bg-surface-2 hover:text-text ${
                  pathname === n.href ? "bg-surface-2 text-text" : "text-text-dim"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
