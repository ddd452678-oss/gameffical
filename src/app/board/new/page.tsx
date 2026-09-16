import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServer } from "@/lib/supabase/server";
import { NewPostForm } from "@/components/NewPostForm";

export const metadata: Metadata = { title: "글쓰기 — 겜피셜" };

export default async function NewPostPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!user) redirect("/login?next=/board/new");

  return <NewPostForm />;
}
