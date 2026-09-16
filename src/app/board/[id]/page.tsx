import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getPost, listComments } from "@/lib/posts";
import { getSupabaseServer } from "@/lib/supabase/server";
import { PostComments } from "@/components/PostComments";
import { DeletePostButton } from "@/components/PostActions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  return { title: post ? `${post.title} — 겜피셜` : "게시글을 찾을 수 없습니다 — 겜피셜" };
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, comments, supabase] = await Promise.all([
    getPost(id),
    listComments(id),
    getSupabaseServer(),
  ]);
  if (!post) notFound();

  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/board" className="text-sm font-semibold text-text-dim hover:text-text">
        ← 목록으로
      </Link>

      <div className="mt-3 rounded-2xl bg-surface p-6 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-extrabold">{post.title}</h1>
          {user?.id === post.user_id && <DeletePostButton postId={post.id} />}
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-text-dim">
          <span className="font-semibold">{post.author_name}</span>
          <span>·</span>
          <span>{fmtDate(post.created_at)}</span>
        </div>
        <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed">{post.body}</p>
      </div>

      <PostComments postId={post.id} comments={comments} currentUserId={user?.id} />
    </div>
  );
}
