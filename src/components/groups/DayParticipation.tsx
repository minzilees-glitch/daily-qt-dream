export function DayParticipation({
  days,
}: {
  days: { date: string; count: number; total: number }[];
}) {
  if (days.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-text-secondary">
        이번 달 참여 데이터가 아직 없습니다.
      </p>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {days.map((d) => {
        const ratio = d.total === 0 ? 0 : d.count / d.total;
        const dayNum = Number(d.date.slice(8));
        return (
          <div
            key={d.date}
            className="flex w-11 shrink-0 flex-col items-center gap-1.5"
            title={`${d.date}: ${d.count}/${d.total}`}
          >
            <div className="flex h-16 w-8 items-end overflow-hidden rounded-full bg-sky-light">
              <div
                className="w-full rounded-full bg-sky transition-all"
                style={{ height: `${Math.max(8, ratio * 100)}%` }}
              />
            </div>
            <span className="text-[11px] text-text-secondary">{dayNum}</span>
          </div>
        );
      })}
    </div>
  );
}
