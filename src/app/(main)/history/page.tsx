"use client";

import { useMemo, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { SoftCard } from "@/components/ui/SoftCard";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { Toast } from "@/components/ui/Toast";
import { QtCalendar } from "@/components/qt/QtCalendar";
import { QtEntryForm } from "@/components/qt/QtEntryForm";
import { ReadingRangeCard } from "@/components/qt/ReadingRangeCard";
import { useApp } from "@/lib/app-context";
import { getReadingForDate } from "@/lib/mock-data";
import {
  addMonths,
  currentYearMonth,
  formatDisplayDate,
  isFutureDate,
  todaySeoul,
  yearMonthOf,
} from "@/lib/dates";
import {
  buildCompletionSet,
  formatRate,
  userMonthStats,
} from "@/lib/stats";

export default function HistoryPage() {
  const { currentUser, completions, isCompleted, getEntry, saveEntry, clearEntry } =
    useApp();
  const [ym, setYm] = useState(currentYearMonth());
  const [selected, setSelected] = useState(todaySeoul());
  const [toast, setToast] = useState<string | null>(null);

  const minYm = addMonths(currentYearMonth(), -2);
  const maxYm = currentYearMonth();

  const set = useMemo(() => buildCompletionSet(completions), [completions]);
  const stats = currentUser
    ? userMonthStats(currentUser.id, ym, set)
    : { days: 0, rate: 0, possible: 0 };

  const completedDates = useMemo(() => {
    const s = new Set<string>();
    if (!currentUser) return s;
    for (const c of completions) {
      if (
        c.userId === currentUser.id &&
        c.completed &&
        yearMonthOf(c.date) === ym
      ) {
        s.add(c.date);
      }
    }
    return s;
  }, [completions, currentUser, ym]);

  if (!currentUser) return null;

  const selectedCompleted = isCompleted(currentUser.id, selected);
  const selectedEntry = getEntry(currentUser.id, selected);
  const future = isFutureDate(selected);
  const reading = getReadingForDate(selected);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };

  return (
    <div>
      <section className="hero-gradient px-5 pb-6">
        <AppHeader light subtitle="나의 QT 기록" />
        <SoftCard className="mt-5 space-y-4">
          <MonthPicker value={ym} onChange={setYm} min={minYm} max={maxYm} />
          <div className="flex items-center justify-between rounded-[18px] bg-sky-light px-4 py-3">
            <div>
              <p className="text-xs text-text-secondary">누적 완료</p>
              <p className="text-lg font-semibold text-text-main">
                {stats.days}일 / {stats.possible}일
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-secondary">참여율</p>
              <p className="text-lg font-semibold text-text-main">
                {formatRate(stats.rate)}
              </p>
            </div>
          </div>
          <QtCalendar
            yearMonth={ym}
            completedDates={completedDates}
            selectedDate={selected}
            onSelect={(date) => {
              setSelected(date);
              if (yearMonthOf(date) !== ym) setYm(yearMonthOf(date));
            }}
          />
        </SoftCard>
      </section>

      <section className="animate-fade-up space-y-4 px-5 pt-2">
        <div>
          <h2 className="text-lg font-semibold text-text-main">
            {formatDisplayDate(selected)}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {future
              ? "미래 날짜는 완료할 수 없습니다."
              : selectedCompleted
                ? "이 날은 QT를 완료했습니다. 기록을 수정하거나 삭제할 수 있어요."
                : "이 날은 아직 미완료입니다. 기록을 저장하면 완료됩니다."}
          </p>
        </div>

        {!future ? <ReadingRangeCard reading={reading} compact /> : null}

        {!future ? (
          <QtEntryForm
            key={`hist-${selected}-${selectedEntry?.updatedAt ?? "new"}`}
            initial={selectedEntry}
            showClear={selectedCompleted || !!selectedEntry}
            onSave={(fields) => showToast(saveEntry(selected, fields).message)}
            onClear={() => showToast(clearEntry(selected).message)}
          />
        ) : null}
      </section>

      <Toast message={toast} />
    </div>
  );
}
