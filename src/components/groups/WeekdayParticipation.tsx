export function WeekdayParticipation({
  days,
}: {
  days: { weekday: number; label: string; count: number; possible: number }[];
}) {
  if (days.length === 0 || days.every((d) => d.possible === 0)) {
    return (
      <p className="py-6 text-center text-sm text-text-secondary">
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
            <p className="text-[13px] font-semibold tabular-nums text-text-main">
              {d.count}
            </p>
            <div className="flex h-16 w-8 items-end overflow-hidden rounded-full bg-sky-light">
              <div
                className="w-full rounded-full bg-sky transition-all"
                style={{ height: `${Math.max(10, ratio * 100)}%` }}
              />
            </div>
            <span className="text-[12px] font-medium text-text-secondary">
              {d.label}
            </span>
            <span className="text-[10px] tabular-nums text-text-secondary/80">
              /{d.possible}
            </span>
          </div>
        );
      })}
    </div>
  );
}
