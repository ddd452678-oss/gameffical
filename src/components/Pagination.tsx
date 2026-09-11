import Link from "next/link";

/**
 * 페이지 번호 목록: 1, 마지막, 현재 페이지 주변만 보여주고 나머지는 "…" 로 생략한다.
 */
function pageNumbers(page: number, totalPages: number): (number | "…")[] {
  const keep = new Set<number>([1, totalPages]);
  for (let p = page - 1; p <= page + 1; p++) {
    if (p >= 1 && p <= totalPages) keep.add(p);
  }
  const sorted = [...keep].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const navBtn = (label: string, target: number, disabled: boolean) =>
    disabled ? (
      <span className="rounded-lg px-3 py-2 text-sm font-semibold text-text-dim/40">
        {label}
      </span>
    ) : (
      <Link
        href={hrefFor(target)}
        className="rounded-lg px-3 py-2 text-sm font-semibold text-text-dim transition-colors hover:bg-surface-2 hover:text-text"
      >
        {label}
      </Link>
    );

  return (
    <nav className="mt-8 flex items-center justify-center gap-1">
      {navBtn("← 이전", Math.max(1, page - 1), page === 1)}
      {pageNumbers(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-1 text-sm text-text-dim">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            className={`min-w-9 rounded-lg px-3 py-2 text-center text-sm font-semibold transition-colors ${
              p === page
                ? "bg-brand text-white"
                : "text-text-dim hover:bg-surface-2 hover:text-text"
            }`}
          >
            {p}
          </Link>
        ),
      )}
      {navBtn("다음 →", Math.min(totalPages, page + 1), page === totalPages)}
    </nav>
  );
}
