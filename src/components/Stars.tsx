/** 읽기 전용 별점 표시 (0~5, 소수 가능) */
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span
      className="relative inline-block leading-none align-middle select-none"
      style={{ fontSize: size }}
      aria-label={`5점 만점에 ${value.toFixed(1)}점`}
    >
      <span className="text-border">★★★★★</span>
      <span
        className="absolute inset-0 overflow-hidden text-accent"
        style={{ width: `${pct}%` }}
      >
        ★★★★★
      </span>
    </span>
  );
}
