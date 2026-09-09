/** 종합 평점(0~100) 배지. 점수대별 색상. 토스 스타일 라이트 톤. */
export function ScoreBadge({
  score,
  size = "md",
}: {
  score: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const dims =
    size === "lg"
      ? "h-16 w-16 text-2xl rounded-2xl"
      : size === "sm"
        ? "h-10 w-10 text-sm rounded-xl"
        : "h-12 w-12 text-lg rounded-xl";

  if (score == null) {
    return (
      <div
        className={`${dims} grid shrink-0 place-items-center bg-surface-2 font-bold text-text-dim`}
        title="공식 평점 데이터 없음"
      >
        —
      </div>
    );
  }

  const color =
    score >= 80
      ? "bg-[#e7f4ee] text-[#188652]"
      : score >= 60
        ? "bg-[#fdf1dc] text-[#b26a00]"
        : "bg-[#fdeaea] text-[#d84343]";

  return (
    <div
      className={`${dims} ${color} grid shrink-0 place-items-center font-extrabold`}
      title="공식 데이터 기반 종합 평점"
    >
      {score}
    </div>
  );
}
