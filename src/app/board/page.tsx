import Link from "next/link";
import type { Metadata } from "next";
import { listPosts, BOARD_PAGE_SIZE } from "@/lib/posts";
import { Pagination } from "@/components/Pagination";

export const metadata: Metadata = { title: "자유게시판 — 겜피셜" };
export const dynamic = "force-dynamic";

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(Number(pageParam) || 1, 1);
  const { posts, total } = await listPosts(page);
  const totalPages = Math.max(1, Math.ceil(total / BOARD_PAGE_SIZE));

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-extrabold">자유게시판</h1>
        <Link
          href="/board/new"
          className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-[#181008] transition-colors hover:bg-brand-dim"
        >
          글쓰기
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-text-dim">
          아직 게시글이 없어요. 첫 글을 남겨보세요.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-surface shadow-card">
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                href={`/board/${p.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold">{p.title}</p>
                  <p className="mt-0.5 text-xs text-text-dim">{p.author_name}</p>
                </div>
                <span className="shrink-0 text-xs text-text-dim">{fmtDate(p.created_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        hrefFor={(p) => (p === 1 ? "/board" : `/board?page=${p}`)}
      />
    </div>
  );
}
