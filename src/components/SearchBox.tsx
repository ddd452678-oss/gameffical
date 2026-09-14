"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBox({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const v = q.trim();
        if (v) router.push(`/search?q=${encodeURIComponent(v)}`);
      }}
      role="search"
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="검색"
        aria-label="게임 검색"
        className="h-9 w-20 rounded-xl bg-surface-2 px-3 text-sm outline-none ring-1 ring-transparent transition-all placeholder:text-text-dim focus:w-32 focus:bg-surface focus:ring-brand sm:w-40 sm:px-3.5 sm:focus:w-56"
      />
    </form>
  );
}
