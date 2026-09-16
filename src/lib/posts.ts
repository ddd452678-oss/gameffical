import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";

export interface Post {
  id: string;
  user_id: string;
  author_name: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

export const BOARD_PAGE_SIZE = 20;

export async function listPosts(
  page = 1,
): Promise<{ posts: Post[]; total: number }> {
  const supabase = getSupabase();
  if (!supabase) return { posts: [], total: 0 };
  const from = (page - 1) * BOARD_PAGE_SIZE;
  const to = from + BOARD_PAGE_SIZE - 1;
  const { data, error, count } = await supabase
    .from("posts")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error || !data) return { posts: [], total: 0 };
  return { posts: data as Post[], total: count ?? 0 };
}

export async function getPost(id: string): Promise<Post | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
  return (data as Post) ?? null;
}

export async function listComments(postId: string): Promise<PostComment[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("post_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  return (data as PostComment[]) ?? [];
}

function validatePost(title: string, body: string): string | null {
  if (!title.trim() || title.length > 200) return "제목을 1~200자로 입력해 주세요.";
  if (!body.trim() || body.length > 10000) return "내용을 1~10000자로 입력해 주세요.";
  return null;
}

export async function createPost(
  input: { title: string; body: string; author_name?: string },
  client: SupabaseClient,
  userId: string,
): Promise<{ ok: true; post: Post } | { ok: false; error: string }> {
  const error = validatePost(input.title, input.body);
  if (error) return { ok: false, error };
  const { data, error: dbError } = await client
    .from("posts")
    .insert({
      user_id: userId,
      author_name: input.author_name?.trim() || "익명",
      title: input.title.trim(),
      body: input.body.trim(),
    })
    .select("*")
    .single();
  if (dbError) return { ok: false, error: `저장 실패: ${dbError.message}` };
  return { ok: true, post: data as Post };
}

export async function deletePost(
  id: string,
  client: SupabaseClient,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await client
    .from("posts")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "본인 게시글만 삭제할 수 있습니다." };
  return { ok: true };
}

export async function createComment(
  input: { post_id: string; body: string; author_name?: string },
  client: SupabaseClient,
  userId: string,
): Promise<{ ok: true; comment: PostComment } | { ok: false; error: string }> {
  if (!input.body.trim() || input.body.length > 2000) {
    return { ok: false, error: "댓글을 1~2000자로 입력해 주세요." };
  }
  const { data, error } = await client
    .from("post_comments")
    .insert({
      post_id: input.post_id,
      user_id: userId,
      author_name: input.author_name?.trim() || "익명",
      body: input.body.trim(),
    })
    .select("*")
    .single();
  if (error) return { ok: false, error: `저장 실패: ${error.message}` };
  return { ok: true, comment: data as PostComment };
}

export async function deleteComment(
  id: string,
  client: SupabaseClient,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await client
    .from("post_comments")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "본인 댓글만 삭제할 수 있습니다." };
  return { ok: true };
}
