import { getSupabase } from "./supabase";
import type { Review, ReviewInput, ReviewStats } from "./types";

/**
 * Supabase 가 없을 때 사용하는 메모리 저장소 (개발용).
 * 서버 재시작 시 사라진다.
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

export async function createReview(
  input: ReviewInput,
): Promise<{ ok: true; review: Review } | { ok: false; error: string }> {
  const error = validate(input);
  if (error) return { ok: false, error };

  const row = {
    game_id: input.game_id,
    author_name: input.author_name?.trim() || "익명",
    fun_rating: input.fun_rating,
    cost_burden: input.cost_burden,
    gacha_transparency: input.gacha_transparency ?? null,
    body: input.body.trim(),
  };

  const supabase = getSupabase();
  if (!supabase) {
    const review: Review = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...row,
    };
    memoryStore.push(review);
    return { ok: true, review };
  }

  const { data, error: dbError } = await supabase
    .from("reviews")
    .insert(row)
    .select()
    .single();
  if (dbError) return { ok: false, error: `저장 실패: ${dbError.message}` };
  return { ok: true, review: data as Review };
}
