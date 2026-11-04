import type { QtEntry } from "@/types";

export function DayEntryView({ entry }: { entry: QtEntry | null | undefined }) {
  if (!entry) {
    return (
      <p className="text-center type-body-sm text-text-secondary">
        이 날짜에 작성한 QT 기록이 없습니다.
      </p>
    );
  }

  const rows = [
    { label: "오늘 나의 마음에 남는 구절", value: entry.verse },
    { label: "오늘 나의 묵상", value: entry.meditation },
    { label: "오늘 나의 결단과 순종", value: entry.decisionObedience },
    { label: "묵상 후 나의 기도제목", value: entry.prayer },
  ].filter((r) => r.value.trim().length > 0);

  if (rows.length === 0) {
    return (
      <p className="text-center type-body-sm text-text-secondary">
        이 날짜에 작성한 QT 기록이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-7">
      {rows.map((row) => (
        <div key={row.label}>
          <p className="type-body-sm font-semibold text-text-main">{row.label}</p>
          <p className="type-body-lg mt-1 whitespace-pre-wrap text-text-main">
            {row.value}
          </p>
        </div>
      ))}
    </div>
  );
}
