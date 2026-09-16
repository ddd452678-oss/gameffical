/**
 * 종합 평점(0~100) 배지. 게임 랭크 엠블럼처럼 육각형 모양으로 표시한다.
 * 점수 구간별로 테두리/글자 색이 바뀐다 (골드=상위권, 민트=양호, 레드=주의).
 */
export function ScoreBadge({
  score,
  size = "md",
}: {
  score: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const dims =
    size === "lg"
      ? "h-16 w-16 text-xl"
      : size === "sm"
        ? "h-10 w-10 text-sm"
        : "h-12 w-12 text-base";

  const hex = "[clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]";

  if (score == null) {
    return (
      <div
        className={`${dims} ${hex} grid shrink-0 place-items-center bg-surface-2 font-bold text-text-dim`}
        title="공식 평점 데이터 없음"
      >
        —
      </div>
    );
  }

  const tone =
    score >= 80
      ? "bg-[#2a2416] text-brand"
      : score >= 60
        ? "bg-[#1c2a22] text-good"
        : "bg-[#2a1c1f] text-bad";

  return (
    <div
      className={`${dims} ${hex} ${tone} grid shrink-0 place-items-center font-extrabold tabular-nums`}
      title="공식 데이터 기반 종합 평점"
    >
      {score}
    </div>
  );
}
