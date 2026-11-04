"use client";

import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { SoftCard } from "@/components/ui/SoftCard";
import { StatLabel } from "@/components/ui/StatLabel";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { Toast } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { LightCount, LightIcon } from "@/components/ui/LightIcon";
import { QtCalendar } from "@/components/qt/QtCalendar";
import { QtEntryForm } from "@/components/qt/QtEntryForm";
import { ReadingPassageBlock } from "@/components/qt/ReadingPassageBlock";
import { ReadingRangeMilestone } from "@/components/qt/ReadingRangeMilestone";
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
import { buildCompletionSet, buildLightSet, userMonthStats } from "@/lib/stats";

function parseDateParam(raw: string | null): string | null {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return raw;
}

const DATE_TITLE_MAX_PX = 23;
const DATE_TITLE_MIN_PX = 13;

/** Single-line title that shrinks to the largest font size that still fits. */
function FitDateTitle({ text }: { text: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const el = textRef.current;
    if (!wrap || !el) return;

    const fit = () => {
      let size = DATE_TITLE_MAX_PX;
      el.style.fontSize = `${size}px`;
      el.style.whiteSpace = "nowrap";
      while (size > DATE_TITLE_MIN_PX && el.scrollWidth > wrap.clientWidth) {
        size -= 0.5;
        el.style.fontSize = `${size}px`;
      }
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [text]);

  return (
    <div ref={wrapRef} className="min-w-0 flex-1 overflow-hidden">
      <h2
        ref={textRef}
        className="whitespace-nowrap font-semibold tracking-[0.02em] text-text-main"
        style={{ fontSize: DATE_TITLE_MAX_PX }}
        suppressHydrationWarning
      >
        {text}
      </h2>
    </div>
  );
}

function HistoryPageInner({ initialDate }: { initialDate: string }) {
  const { currentUser, completions, isCompleted, getEntry, saveEntry, clearEntry, lastEarnedDate } =
    useApp();

  const [ym, setYm] = useState(yearMonthOf(initialDate));
  const [selected, setSelected] = useState(initialDate);
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const minYm = addMonths(currentYearMonth(), -2);
  const maxYm = currentYearMonth();

  const set = useMemo(() => buildCompletionSet(completions), [completions]);
  const lightSet = useMemo(() => buildLightSet(completions), [completions]);
  const stats = currentUser
    ? userMonthStats(currentUser.id, ym, set, lightSet)
    : { days: 0, lights: 0, possible: 0 };

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
  const today = todaySeoul();
  const future = isFutureDate(selected, today);
  const past = selected < today;
  const reading = getReadingForDate(selected);
  const hasEntry = !!selectedEntry;

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };

  return (
    <div>
      <section className="hero-gradient px-5 pb-6">
        <AppHeader light showAvatar={false} />
        <SoftCard className="mt-5 space-y-4 bg-ivory">
          <MonthPicker
            value={ym}
            onChange={(next) => {
              setYm(next);
              setCalendarExpanded(false);
            }}
            min={minYm}
            max={maxYm}
            size="range"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[16px] bg-white px-3 py-3 text-center">
              <StatLabel className="text-text-secondary">이번달 내가 모은 빛</StatLabel>
              <div className="mt-1 flex justify-center">
                <LightCount
                  lights={stats.lights}
                  size={18}
                  rays={false}
                  textClassName="text-[19px] font-semibold text-text-main"
                />
              </div>
            </div>
            <div className="rounded-[16px] bg-white px-3 py-3 text-center">
              <StatLabel className="text-text-secondary">집계 일수</StatLabel>
              <p className="mt-1 text-[19px] font-semibold text-text-main">
                {stats.possible}일
              </p>
            </div>
          </div>
          <QtCalendar
            yearMonth={ym}
            completedDates={completedDates}
            selectedDate={selected}
            onSelect={selectDate}
            collapsed={!calendarExpanded}
            justEarnedDate={lastEarnedDate}
          />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setCalendarExpanded((v) => !v)}
              className="flex h-8 w-8 items-center justify-center text-text-secondary transition hover:text-text-main"
              aria-expanded={calendarExpanded}
              aria-label={
                calendarExpanded ? "최근 2주만 보기" : "전체 달 보기"
              }
            >
              {calendarExpanded ? (
                <ChevronUp size={20} strokeWidth={1.75} />
              ) : (
                <ChevronDown size={20} strokeWidth={1.75} />
              )}
            </button>
          </div>
        </SoftCard>
      </section>

      <section className="animate-fade-up space-y-4 px-5 pt-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="shrink-0">
                <LightIcon
                  active={selectedCompleted}
                  future={future}
                  size={28}
                  justEarned={selectedCompleted && !future}
                />
              </span>
              <FitDateTitle text={formatDisplayDate(selected)} />
            </div>
            {future ? (
              <p className="mt-1 text-[15px] text-text-secondary">
                미래 날짜는 완료할 수 없습니다.
              </p>
            ) : past ? (
              <p className="mt-1 break-keep text-[13px] leading-relaxed text-text-secondary">
                빛은 당일 큐티에만 지급됩니다.
                <br />
                하지만 지난 큐티는 당신 심령에 남을거에요.
              </p>
            ) : null}
          </div>

          {!future ? (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                aria-label="더보기"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-ivory text-text-main shadow-none"
              >
                <MoreHorizontal size={18} strokeWidth={1.75} />
              </button>
              {menuOpen ? (
                <div className="absolute right-0 z-20 mt-2 w-32 overflow-hidden rounded-2xl bg-white py-1 shadow-none">
                  <button
                    type="button"
                    className="block w-full px-4 py-2.5 text-left text-[15px] font-medium text-text-main hover:bg-sky-light"
                    onClick={() => {
                      setMenuOpen(false);
                      setEditing(true);
                    }}
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    className="block w-full px-4 py-2.5 text-left text-[15px] font-medium text-[#E35D5D] hover:bg-sky-light disabled:opacity-40"
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

        {future ? (
          <ReadingRangeMilestone key={selected} reading={reading} label="본문" />
        ) : (
          <ReadingPassageBlock key={selected} reading={reading} label="본문" defaultExpanded />
        )}

        {!future && editing ? (
          <QtEntryForm
            key={`hist-edit-${selected}-${selectedEntry?.updatedAt ?? "new"}`}
            initial={selectedEntry}
            onSave={async (fields) => {
              const res = await saveEntry(selected, fields);
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
              onSave={async (fields) => {
                const res = await saveEntry(selected, fields);
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
        onConfirm={async () => {
          const res = await clearEntry(selected);
          showToast(res.message);
          setConfirmOpen(false);
          setEditing(false);
        }}
      />

      <Toast message={toast} />
    </div>
  );
}

function HistoryParamsGate() {
  const searchParams = useSearchParams();
  const dateParam = parseDateParam(searchParams.get("date"));
  const initialDate = dateParam ?? todaySeoul();
  return (
    <HistoryPageInner key={dateParam ?? "today"} initialDate={initialDate} />
  );
}

export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="px-5 pt-16 text-center text-[15px] text-text-secondary">
          기록을 불러오는 중…
        </div>
      }
    >
      <HistoryParamsGate />
    </Suspense>
  );
}
