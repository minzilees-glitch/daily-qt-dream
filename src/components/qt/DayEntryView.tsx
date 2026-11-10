import type { QtEntry } from "@/types";

const PASTEL_TONES = [
  "premium-pastel-peach",
  "premium-pastel-mint",
  "premium-pastel-rose",
  "premium-pastel-lilac",
] as const;

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
    <div className="space-y-3">
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`premium-pastel-card ${PASTEL_TONES[i % PASTEL_TONES.length]}`}
        >
          <p className="type-body-sm font-semibold text-text-main/80">
            {row.label}
          </p>
          <p className="type-body-lg mt-1.5 whitespace-pre-wrap text-text-main">
            {row.value}
          </p>
        </div>
      ))}
    </div>
  );
}
