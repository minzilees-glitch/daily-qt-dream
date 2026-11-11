import { StatLabel } from "@/components/ui/StatLabel";

export function WeekdayParticipation({
  days,
  showPossible = true,
  /** Count above each bar. Default true; 우리순 이번주 chart hides it. */
  showCount = true,
}: {
  days: { weekday: number; label: string; count: number; possible: number }[];
  /** Per-bar `/{possible}` under each weekday. Default true. */
  showPossible?: boolean;
  showCount?: boolean;
}) {
  if (days.length === 0 || days.every((d) => d.possible === 0 && d.count === 0)) {
    return (
      <p className="py-6 text-center type-body-sm text-text-secondary">
        이번 주 참여 데이터가 아직 없습니다.
      </p>
    );
  }

  const max = Math.max(...days.map((d) => d.count), 1);

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((d) => {
        const ratio = d.count / max;
        return (
          <div
            key={d.weekday}
            className="flex flex-col items-center gap-1.5"
            title={`${d.label}: ${d.count}/${d.possible}`}
          >
            {showCount ? (
              <p className="type-label font-semibold tabular-nums text-[var(--color-black)]">
                {d.count}
              </p>
            ) : (
              <span className="h-0 w-full" aria-hidden />
            )}
            {/* Track: light sora tint · Fill: sora · Labels: black */}
            <div className="flex h-20 w-8 items-end overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-sora)_32%,white)]">
              <div
                className="w-full rounded-full bg-[var(--color-sora)] transition-all"
                style={{
                  height:
                    d.possible === 0 && d.count === 0
                      ? "10%"
                      : `${Math.max(10, ratio * 100)}%`,
                }}
              />
            </div>
            <StatLabel
              as="span"
              className={
                d.label === "일"
                  ? "text-[var(--color-danger)]"
                  : "text-[var(--color-black)]"
              }
            >
              {d.label}
            </StatLabel>
            {showPossible ? (
              <span className="type-nav tabular-nums text-[var(--color-black)] opacity-70">
                /{d.possible}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
