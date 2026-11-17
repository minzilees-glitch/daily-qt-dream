"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import { CalendarDays, Rows2, Send } from "lucide-react";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { Toast } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { LightCount } from "@/components/ui/LightIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { QtCalendar } from "@/components/qt/QtCalendar";
import { QtEntryForm } from "@/components/qt/QtEntryForm";
import { HomeDurannoPassage } from "@/components/qt/HomeDurannoPassage";
import { PassageEntryActions } from "@/components/qt/PassageEntryActions";
import { DayEntryView } from "@/components/qt/DayEntryView";
import { useApp } from "@/lib/app-context";
import {
  getHistoryPassage,
  historyPassageLabel,
} from "@/lib/history-passages";
import { durannoUrlForDate } from "@/lib/duranno";
import { entryHasQtContent, fieldsFromEntry } from "@/lib/qt-entry";
import {
  formatQtShareText,
  isShareAbortError,
  shareOrCopyText,
} from "@/lib/qt-share";
import {
  isFutureDate,
  todaySeoul,
  yearMonthOf,
} from "@/lib/dates";
import { buildCompletionSet, buildLightSet, userMonthStats } from "@/lib/stats";

function parseDateParam(raw: string | null): string | null {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return raw;
}

/** 나의 큐티들 calendar span: Sep 2026 → Dec 2027. */
const HISTORY_MIN_YM = "2026-09";
const HISTORY_MIN_DATE = "2026-09-01";
const HISTORY_MAX_YM = "2027-12";
/** Sheet overlaps header so rounded corners sit on sky. */
const SHEET_OVERLAP_PX = 20;
/** Fallback week→month header delta until both modes are measured. */
const FALLBACK_MAX_DROP_PX = 180;

function clampHistoryDate(date: string): string {
  return date < HISTORY_MIN_DATE ? HISTORY_MIN_DATE : date;
}

function HistoryPageInner({ initialDate }: { initialDate: string }) {
  const { currentUser, completions, getEntry, saveEntry, clearEntry, lastEarnedDate } =
    useApp();

  const startDate = clampHistoryDate(initialDate);
  const [ym, setYm] = useState(yearMonthOf(startDate));
  const [selected, setSelected] = useState(startDate);
  /** false = week strip (sheet max open); true = month grid (sheet min). */
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  /** Continuous sheet drop px: 0 = week/open, maxDrop = month/collapsed. */
  const [drop, setDrop] = useState(0);
  const [maxDrop, setMaxDrop] = useState(FALLBACK_MAX_DROP_PX);
  const [sheetTop, setSheetTop] = useState(200);
  const [dragging, setDragging] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const weekHeaderHRef = useRef(0);
  const monthHeaderHRef = useRef(0);
  const dropRef = useRef(0);
  const maxDropRef = useRef(FALLBACK_MAX_DROP_PX);
  const calendarExpandedRef = useRef(false);
  const draggingRef = useRef(false);
  const dragRef = useRef<{
    pointerId: number;
    startY: number;
    startDrop: number;
    lastY: number;
    lastT: number;
    velocityY: number;
  } | null>(null);

  // Keep gesture refs in sync after paint (not during render — React Compiler).
  useEffect(() => {
    dropRef.current = drop;
    maxDropRef.current = maxDrop;
    calendarExpandedRef.current = calendarExpanded;
    draggingRef.current = dragging;
  }, [drop, maxDrop, calendarExpanded, dragging]);

  const minYm = HISTORY_MIN_YM;
  const maxYm = HISTORY_MAX_YM;

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

  const recomputeSheetTop = useCallback(() => {
    const weekH = weekHeaderHRef.current;
    const monthH = monthHeaderHRef.current;
    if (weekH > 0 && monthH > weekH) {
      const nextMax = Math.max(48, monthH - weekH);
      if (nextMax !== maxDropRef.current) {
        maxDropRef.current = nextMax;
        setMaxDrop(nextMax);
      }
    }
    const base = (weekHeaderHRef.current || headerRef.current?.offsetHeight || 180) - SHEET_OVERLAP_PX;
    const nextTop = Math.max(80, Math.round(base + dropRef.current));
    setSheetTop(nextTop);
  }, []);

  const measureHeader = useCallback(() => {
    const h = headerRef.current?.offsetHeight ?? 0;
    if (h <= 0) return;
    if (calendarExpandedRef.current) {
      monthHeaderHRef.current = h;
    } else {
      weekHeaderHRef.current = h;
    }
    recomputeSheetTop();
  }, [recomputeSheetTop]);

  useLayoutEffect(() => {
    measureHeader();
  }, [measureHeader, calendarExpanded, ym]);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => measureHeader());
    ro.observe(el);
    window.addEventListener("resize", measureHeader);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measureHeader);
    };
  }, [measureHeader]);

  useEffect(() => {
    recomputeSheetTop();
  }, [drop, recomputeSheetTop]);

  /** Soft rubber-band past ends while dragging. */
  const resistDrop = useCallback((raw: number) => {
    const max = maxDropRef.current;
    if (raw < 0) return raw * 0.28;
    if (raw > max) return max + (raw - max) * 0.28;
    return raw;
  }, []);

  /** Reveal month grid in the gap as soon as the sheet lowers. */
  const syncCalendarToDrop = useCallback((d: number) => {
    const showMonth = d > 10;
    if (showMonth === calendarExpandedRef.current) return;
    calendarExpandedRef.current = showMonth;
    setCalendarExpanded(showMonth);
  }, []);

  const setDropLive = useCallback(
    (next: number) => {
      dropRef.current = next;
      setDrop(next);
      syncCalendarToDrop(next);
    },
    [syncCalendarToDrop],
  );

  const snapDrop = useCallback(
    (current: number, velocityY: number) => {
      const max = maxDropRef.current;
      const mid = max * 0.42;
      /* velocityY: px/ms — flick down → collapse, flick up → open */
      const open =
        velocityY < -0.55 || (Math.abs(velocityY) < 0.45 && current < mid);
      const target = open ? 0 : max;
      setDragging(false);
      draggingRef.current = false;
      dropRef.current = target;
      setDrop(target);
      calendarExpandedRef.current = !open;
      setCalendarExpanded(!open);
    },
    [],
  );

  const onHandlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    handleRef.current?.setPointerCapture(e.pointerId);
    setDragging(true);
    draggingRef.current = true;
    dragRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      startDrop: dropRef.current,
      lastY: e.clientY,
      lastT: e.timeStamp,
      velocityY: 0,
    };
  };

  const onHandlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dy = e.clientY - drag.startY; /* down → collapse */
    const dt = Math.max(1, e.timeStamp - drag.lastT);
    drag.velocityY = (e.clientY - drag.lastY) / dt;
    drag.lastY = e.clientY;
    drag.lastT = e.timeStamp;
    setDropLive(resistDrop(drag.startDrop + dy));
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const velocityY = drag.velocityY;
    dragRef.current = null;
    try {
      handleRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    const max = maxDropRef.current;
    const clamped = Math.min(max, Math.max(0, dropRef.current));
    snapDrop(clamped, velocityY);
  };

  const toggleCalendar = () => {
    const next = !calendarExpanded;
    setDragging(false);
    draggingRef.current = false;
    setCalendarExpanded(next);
    calendarExpandedRef.current = next;
    const target = next ? maxDropRef.current : 0;
    dropRef.current = target;
    setDrop(target);
  };

  const selectDate = (date: string) => {
    if (yearMonthOf(date) < HISTORY_MIN_YM) return;
    setSelected(date);
    setEditing(false);
    if (yearMonthOf(date) !== ym) setYm(yearMonthOf(date));
  };

  if (!currentUser) return null;

  const selectedEntry = getEntry(currentUser.id, selected);
  const today = todaySeoul();
  const future = isFutureDate(selected, today);
  const past = selected < today;
  const isToday = selected === today;
  const historyPassage = getHistoryPassage(selected);
  const passageReading = {
    ...historyPassage,
    url: isToday ? durannoUrlForDate(selected) : undefined,
  };
  const passageLabel = historyPassageLabel(selected);
  /** Real QT text only — completion/presence without rows opens compose, not empty copy. */
  const hasContent = entryHasQtContent(selectedEntry);
  /** 말씀 header edit: only when that day's QT has saved text (or currently editing). */
  const showEdit = !future && (hasContent || editing);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };

  const share = {
    dateYmd: selected,
    passageRange: historyPassage.range,
    onShared: (via: "share" | "clipboard") =>
      showToast(via === "share" ? "공유했어요" : "클립보드에 복사했어요"),
    onError: (message: string) => showToast(message),
  };

  const shareSavedEntry = async () => {
    const text = formatQtShareText({
      dateYmd: share.dateYmd,
      passageRange: share.passageRange,
      fields: fieldsFromEntry(selectedEntry),
    });
    try {
      const via = await shareOrCopyText(text);
      share.onShared(via);
    } catch (err) {
      if (isShareAbortError(err)) return;
      share.onError("공유에 실패했어요");
    }
  };

  return (
    <div ref={rootRef} className="premium-qt-root premium-qt-root--history">
      <header ref={headerRef} className="premium-qt-header">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <MonthPicker
                value={ym}
                step={calendarExpanded ? "month" : "week"}
                focusDate={selected}
                onFocusDateChange={selectDate}
                onChange={(next) => {
                  setYm(next);
                  setCalendarExpanded(false);
                  calendarExpandedRef.current = false;
                  dropRef.current = 0;
                  setDrop(0);
                }}
                min={minYm}
                max={maxYm}
                align="start"
              />
              <div
                className="history-month-lights inline-flex items-center opacity-100"
                title="이번달 내가 모은 빛"
                aria-label={`이번달 내가 모은 빛 ${stats.lights}`}
              >
                <LightCount
                  lights={stats.lights}
                  size={21}
                  rays={false}
                  className="opacity-100"
                  textClassName="type-stat font-semibold tabular-nums text-[var(--color-mint)] opacity-100"
                />
              </div>
            </div>
          </div>
          <div
            className="premium-cal-mode-toggle shrink-0"
            role="group"
            aria-label="달력 보기"
          >
            <button
              type="button"
              className={`premium-cal-mode-toggle__btn${
                !calendarExpanded ? " is-active" : ""
              }`}
              aria-pressed={!calendarExpanded}
              aria-label="주간 달력"
              onClick={() => {
                if (!calendarExpanded) return;
                toggleCalendar();
              }}
            >
              <Rows2 size={18} strokeWidth={1.75} aria-hidden />
            </button>
            <button
              type="button"
              className={`premium-cal-mode-toggle__btn${
                calendarExpanded ? " is-active" : ""
              }`}
              aria-pressed={calendarExpanded}
              aria-label="월간 달력"
              onClick={() => {
                if (calendarExpanded) return;
                toggleCalendar();
              }}
            >
              <CalendarDays size={18} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        </div>

        <div className={`mt-5 ${calendarExpanded ? "pb-6" : "pb-2"}`}>
          <QtCalendar
            yearMonth={ym}
            completedDates={completedDates}
            selectedDate={selected}
            onSelect={selectDate}
            collapsed={!calendarExpanded}
            justEarnedDate={lastEarnedDate}
            minYearMonth={minYm}
            maxYearMonth={maxYm}
          />
        </div>
      </header>

      <section
        className={`premium-qt-sheet premium-qt-sheet--history${
          dragging ? " is-dragging" : ""
        }`}
        style={{ top: sheetTop }}
      >
        {/* Grabber stays pinned for sheet resize; 말씀 scrolls with drawer body. */}
        <div className="premium-history-mint premium-history-mint--handle">
          <div
            ref={handleRef}
            className="premium-history-sheet-drag"
            role="slider"
            aria-label="시트 높이 조절"
            aria-valuemin={0}
            aria-valuemax={maxDrop}
            aria-valuenow={Math.round(Math.min(maxDrop, Math.max(0, drop)))}
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <span className="premium-sheet-grabber" aria-hidden />
          </div>
        </div>

        <div
          key={selected}
          className="premium-content-crossfade premium-history-sheet-body"
        >
          <div className="premium-history-sheet-scroll">
            <div className="premium-history-mint premium-history-mint--passage">
              <div className="premium-history-passage pt-3">
                <HomeDurannoPassage
                  key={selected}
                  reading={passageReading}
                  label={passageLabel}
                  embedded
                  showLink={isToday}
                  rangeTrailing={
                    showEdit ? (
                      <PassageEntryActions
                        editActive={editing}
                        onEdit={() => setEditing(true)}
                      />
                    ) : null
                  }
                />
              </div>
            </div>

            <div className="premium-history-qt">
              {future ? (
                <div className="pt-[var(--space-stack-lg)]">
                  {/* Same helper chrome as QtEntryForm 「큐티는 전체 합쳐…」. */}
                  <p className="qt-validation-hint type-caption break-keep text-text-secondary">
                    미래 날짜는 완료할 수 없습니다.
                  </p>
                </div>
              ) : editing ? (
                <QtEntryForm
                  key={`hist-edit-${selected}-${selectedEntry?.updatedAt ?? "new"}`}
                  initial={selectedEntry}
                  editing
                  onDelete={() => setConfirmOpen(true)}
                  onSave={async (fields) => {
                    try {
                      const res = await saveEntry(selected, fields);
                      showToast(res.message);
                      if (res.ok) setEditing(false);
                    } catch (err) {
                      const detail =
                        err instanceof Error ? err.message : "알 수 없는 오류";
                      showToast(`저장 실패: ${detail}`);
                    }
                  }}
                />
              ) : hasContent ? (
                <div className="space-y-[var(--space-stack-lg)]">
                  <DayEntryView entry={selectedEntry} />
                  <PrimaryButton
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={shareSavedEntry}
                  >
                    <Send size={18} strokeWidth={2.25} aria-hidden />
                    나의 큐티 나누기
                  </PrimaryButton>
                </div>
              ) : (
                <QtEntryForm
                  key={`hist-new-${selected}`}
                  initial={selectedEntry ?? null}
                  helperNotice={
                    past && !hasContent
                      ? "지난 큐티완료는 빛을 획득할 수 없습니다. 그러나 지난 큐티는 당신의 마음에 남습니다."
                      : null
                  }
                  onSave={async (fields) => {
                    try {
                      const res = await saveEntry(selected, fields);
                      showToast(res.message);
                    } catch (err) {
                      const detail =
                        err instanceof Error ? err.message : "알 수 없는 오류";
                      showToast(`저장 실패: ${detail}`);
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <ConfirmModal
        open={confirmOpen}
        title="이 날의 큐티 기록을 삭제할까요?"
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
        <div className="px-[var(--space-page-x)] pt-16 text-center type-body-sm text-text-secondary">
          기록을 불러오는 중…
        </div>
      }
    >
      <HistoryParamsGate />
    </Suspense>
  );
}
