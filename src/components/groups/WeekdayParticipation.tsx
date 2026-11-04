import { StatLabel } from "@/components/ui/StatLabel";

export function WeekdayParticipation({
  days,
  showPossible = true,
}: {
  days: { weekday: number; label: string; count: number; possible: number }[];
  /** Per-bar `/{possible}` under each weekday. Default true (우리순). */
  showPossible?: boolean;
}) {
  if (days.length === 0 || days.every((d) => d.possible === 0)) {
    return (
      <p className="py-6 text-center type-body-sm text-text-secondary">
        이번 달 참여 데이터가 아직 없습니다.
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
            <p className="type-label font-semibold tabular-nums text-text-main">
              {d.count}
            </p>
            <div className="flex h-16 w-8 items-end overflow-hidden rounded-full bg-sky-light">
              <div
                className="w-full rounded-full bg-sky transition-all"
                style={{ height: `${Math.max(10, ratio * 100)}%` }}
              />
            </div>
            <StatLabel as="span" className="text-text-secondary">
              {d.label}
            </StatLabel>
            {showPossible ? (
              <span className="type-nav tabular-nums text-text-secondary/80">
                /{d.possible}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
