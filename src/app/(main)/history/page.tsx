"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { SoftCard } from "@/components/ui/SoftCard";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { Toast } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { QtCalendar } from "@/components/qt/QtCalendar";
import { QtEntryForm } from "@/components/qt/QtEntryForm";
import { ReadingRangeCard } from "@/components/qt/ReadingRangeCard";
import { DayEntryView } from "@/components/qt/DayEntryView";
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
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const selectDate = (date: string) => {
    setSelected(date);
    setEditing(false);
    setMenuOpen(false);
    if (yearMonthOf(date) !== ym) setYm(yearMonthOf(date));
  };

  if (!currentUser) return null;

  const selectedCompleted = isCompleted(currentUser.id, selected);
  const selectedEntry = getEntry(currentUser.id, selected);
  const future = isFutureDate(selected);
  const reading = getReadingForDate(selected);
  const hasEntry = !!selectedEntry;

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
            onSelect={selectDate}
          />
        </SoftCard>
      </section>

      <section className="animate-fade-up space-y-4 px-5 pt-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-text-main">
              {formatDisplayDate(selected)}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {future
                ? "미래 날짜는 완료할 수 없습니다."
                : selectedCompleted
                  ? "이 날은 QT를 완료했습니다."
                  : "이 날은 아직 미완료입니다."}
            </p>
          </div>

          {!future ? (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                aria-label="더보기"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-ivory text-text-main shadow-[var(--shadow-soft)]"
              >
                <MoreHorizontal size={18} strokeWidth={1.75} />
              </button>
              {menuOpen ? (
                <div className="absolute right-0 z-20 mt-2 w-32 overflow-hidden rounded-2xl bg-white py-1 shadow-[0_12px_30px_rgba(36,55,70,0.14)]">
                  <button
                    type="button"
                    className="block w-full px-4 py-2.5 text-left text-sm font-medium text-text-main hover:bg-sky-light"
                    onClick={() => {
                      setMenuOpen(false);
                      setEditing(true);
                    }}
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    className="block w-full px-4 py-2.5 text-left text-sm font-medium text-[#E35D5D] hover:bg-sky-light disabled:opacity-40"
                    disabled={!hasEntry && !selectedCompleted}
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmOpen(true);
                    }}
                  >
                    삭제
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {!future ? <ReadingRangeCard reading={reading} compact /> : null}

        {!future && editing ? (
          <QtEntryForm
            key={`hist-edit-${selected}-${selectedEntry?.updatedAt ?? "new"}`}
            initial={selectedEntry}
            onSave={(fields) => {
              const res = saveEntry(selected, fields);
              showToast(res.message);
              if (res.ok) setEditing(false);
            }}
          />
        ) : null}

        {!future && !editing ? (
          hasEntry || selectedCompleted ? (
            <DayEntryView entry={selectedEntry} />
          ) : (
            <QtEntryForm
              key={`hist-new-${selected}`}
              initial={null}
              onSave={(fields) => {
                const res = saveEntry(selected, fields);
                showToast(res.message);
              }}
            />
          )
        ) : null}
      </section>

      <ConfirmModal
        open={confirmOpen}
        title="이 날의 QT 기록을 삭제할까요?"
        description="삭제하면 완료도 함께 취소됩니다. 이 작업은 되돌릴 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          const res = clearEntry(selected);
          showToast(res.message);
          setConfirmOpen(false);
          setEditing(false);
        }}
      />

      <Toast message={toast} />
    </div>
  );
}
