import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";
import type { Review, ReviewInput, ReviewStats } from "./types";

/**
 * Supabase 가 없을 때 사용하는 메모리 저장소 (개발용, 읽기 폴백 전용).
 * 서버 재시작 시 사라진다. 로그인 자체가 Supabase 없이는 불가능하므로
 * 리뷰 작성/수정/삭제는 Supabase 가 있을 때만 동작한다.
 */
const memoryStore: Review[] = [];

function computeStats(reviews: Review[]): ReviewStats {
  if (reviews.length === 0) {
    return {
      review_count: 0,
      avg_fun: null,
      avg_cost_burden: null,
      avg_gacha_transparency: null,
    };
  }
  const avg = (nums: number[]) =>
    nums.length ? Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 100) / 100 : null;
  return {
    review_count: reviews.length,
    avg_fun: avg(reviews.map((r) => r.fun_rating)),
    avg_cost_burden: avg(reviews.map((r) => r.cost_burden)),
    avg_gacha_transparency: avg(
      reviews
        .map((r) => r.gacha_transparency)
        .filter((n): n is number => typeof n === "number"),
    ),
  };
}

export async function listReviews(gameId: number): Promise<Review[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return memoryStore
      .filter((r) => r.game_id === gameId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("game_id", gameId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`리뷰 조회 실패: ${error.message}`);
  return (data ?? []) as Review[];
}

/** 특정 유저가 이 게임에 이미 쓴 리뷰(있으면) — 있으면 작성 폼이 수정 모드로 바뀐다. */
export async function findMyReview(
  gameId: number,
  userId: string,
): Promise<Review | null> {
  const supabase = getSupabase();
  if (!supabase) {
    return memoryStore.find((r) => r.game_id === gameId && r.user_id === userId) ?? null;
  }
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("game_id", gameId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return null;
  return (data as Review) ?? null;
}

export async function getReviewStats(gameId: number): Promise<ReviewStats> {
  const supabase = getSupabase();
  if (!supabase) {
    return computeStats(memoryStore.filter((r) => r.game_id === gameId));
  }
  const { data, error } = await supabase
    .from("game_review_stats")
    .select("*")
    .eq("game_id", gameId)
    .maybeSingle();
  if (error) throw new Error(`리뷰 통계 조회 실패: ${error.message}`);
  if (!data) {
    return {
      review_count: 0,
      avg_fun: null,
      avg_cost_burden: null,
      avg_gacha_transparency: null,
    };
  }
  return data as ReviewStats;
}

function validate(input: ReviewInput): string | null {
  const inRange = (n: unknown) =>
    typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 5;
  if (!Number.isInteger(input.game_id)) return "게임 정보가 올바르지 않습니다.";
  if (!inRange(input.fun_rating)) return "재미/완성도 별점을 선택해 주세요.";
  if (!inRange(input.cost_burden)) return "과금 부담도를 선택해 주세요.";
  if (
    input.gacha_transparency != null &&
    !inRange(input.gacha_transparency)
  )
    return "확률형 아이템 투명성 값이 올바르지 않습니다.";
  if (!input.body || input.body.trim().length < 5)
    return "리뷰 내용을 5자 이상 작성해 주세요.";
  if (input.body.length > 5000) return "리뷰 내용이 너무 깁니다.";
  return null;
}

type WriteResult =
  | { ok: true; review: Review }
  | { ok: false; error: string; duplicate?: boolean };

/**
 * 리뷰 작성 — 로그인 필수. `client` 는 요청자의 로그인 세션이 실린 Supabase
 * 클라이언트여야 한다 (RLS 의 auth.uid() = user_id 가 이 클라이언트 기준으로 평가됨).
 */
export async function createReview(
  input: ReviewInput,
  client: SupabaseClient,
  userId: string,
): Promise<WriteResult> {
  const error = validate(input);
  if (error) return { ok: false, error };

  const row = {
    game_id: input.game_id,
    user_id: userId,
    author_name: input.author_name?.trim() || "익명",
    fun_rating: input.fun_rating,
    cost_burden: input.cost_burden,
    gacha_transparency: input.gacha_transparency ?? null,
    body: input.body.trim(),
  };

  const { data, error: dbError } = await client
    .from("reviews")
    .insert(row)
    .select("*")
    .single();
  if (dbError) {
    if (dbError.code === "23505") {
      return {
        ok: false,
        error: "이미 이 게임에 리뷰를 남기셨어요. 기존 리뷰를 수정해 주세요.",
        duplicate: true,
      };
    }
    return { ok: false, error: `저장 실패: ${dbError.message}` };
  }
  return { ok: true, review: data as Review };
}

/** 리뷰 수정 — 본인 것만. RLS 가 최종 관문이라, 남의 리뷰면 0행 갱신되어 실패 처리한다. */
export async function updateReview(
  reviewId: string,
  input: ReviewInput,
  client: SupabaseClient,
  userId: string,
): Promise<WriteResult> {
  const error = validate(input);
  if (error) return { ok: false, error };

  const row = {
    author_name: input.author_name?.trim() || "익명",
    fun_rating: input.fun_rating,
    cost_burden: input.cost_burden,
    gacha_transparency: input.gacha_transparency ?? null,
    body: input.body.trim(),
    updated_at: new Date().toISOString(),
  };

  const { data, error: dbError } = await client
    .from("reviews")
    .update(row)
    .eq("id", reviewId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();
  if (dbError) return { ok: false, error: `수정 실패: ${dbError.message}` };
  if (!data) return { ok: false, error: "본인 리뷰만 수정할 수 있습니다." };
  return { ok: true, review: data as Review };
}

/** 리뷰 삭제 — 본인 것만. */
export async function deleteReview(
  reviewId: string,
  client: SupabaseClient,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await client
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: `삭제 실패: ${error.message}` };
  if (!data) return { ok: false, error: "본인 리뷰만 삭제할 수 있습니다." };
  return { ok: true };
}
