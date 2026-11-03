import type { QtEntry } from "@/types";
import { SoftCard } from "@/components/ui/SoftCard";

export function DayEntryView({ entry }: { entry: QtEntry | null | undefined }) {
  if (!entry) {
    return (
      <SoftCard padding="p-5">
        <p className="text-center text-sm text-text-secondary">
          이 날짜에 작성한 QT 기록이 없습니다.
        </p>
      </SoftCard>
    );
  }

  const rows = [
    { label: "오늘의 묵상", value: entry.meditation },
    { label: "오늘 마음에 남는 구절", value: entry.verse },
    { label: "묵상 후 기도제목", value: entry.prayer },
  ].filter((r) => r.value.trim().length > 0);

  if (rows.length === 0) {
    return (
      <SoftCard padding="p-5">
        <p className="text-center text-sm text-text-secondary">
          이 날짜에 작성한 QT 기록이 없습니다.
        </p>
      </SoftCard>
    );
  }

  return (
    <SoftCard padding="p-5" className="space-y-4">
      {rows.map((row) => (
        <div key={row.label}>
          <p className="text-xs font-medium text-text-secondary">{row.label}</p>
          <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-text-main">
            {row.value}
          </p>
        </div>
      ))}
    </SoftCard>
  );
}
