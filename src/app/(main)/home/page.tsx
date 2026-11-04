"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { LightIcon } from "@/components/ui/LightIcon";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { QtCalendar } from "@/components/qt/QtCalendar";
import { ReadingPassageBlock } from "@/components/qt/ReadingPassageBlock";
import { ReadingRangeMilestone } from "@/components/qt/ReadingRangeMilestone";
import { useApp } from "@/lib/app-context";
import { getReadingForDate } from "@/lib/mock-data";
import {
  addMonths,
  currentYearMonth,
  formatDisplayDate,
  isFutureDate,
  yearMonthOf,
} from "@/lib/dates";
import { useSeoulToday } from "@/hooks/useSeoulToday";

export default function HomePage() {
  const { currentUser, groups, completions, isCompleted, getEntry, lastEarnedDate } = useApp();
  const router = useRouter();
  const [calYm, setCalYm] = useState(currentYearMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#calendar") return;
    const el = document.getElementById("calendar");
    if (!el) return;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(t);
  }, []);

  const today = useSeoulToday();
  const dashYm = currentYearMonth();
  const minYm = addMonths(dashYm, -2);
  const maxYm = dashYm;

  const completedDates = useMemo(() => {
    const s = new Set<string>();
    if (!currentUser) return s;
    for (const c of completions) {
      if (
        c.userId === currentUser.id &&
        c.completed &&
        yearMonthOf(c.date) === calYm
      ) {
        s.add(c.date);
      }
    }
    return s;
  }, [completions, currentUser, calYm]);

  const futurePreviewReading = useMemo(() => {
    if (!selectedDate || !isFutureDate(selectedDate, today)) return null;
    return getReadingForDate(selectedDate);
  }, [selectedDate, today]);

  if (!currentUser) return null;

  const group = groups.find((g) => g.id === currentUser.groupId);
  const doneToday = isCompleted(currentUser.id, today);
  const reading = getReadingForDate(today);
  const todayEntry = doneToday ? getEntry(currentUser.id, today) : undefined;
  const showTodayWriting =
    !!todayEntry &&
    (todayEntry.meditation.trim().length > 0 ||
      todayEntry.verse.trim().length > 0 ||
      todayEntry.decisionObedience.trim().length > 0 ||
      todayEntry.prayer.trim().length > 0);

  const hasQtOnDate = (date: string) =>
    isCompleted(currentUser.id, date) || !!getEntry(currentUser.id, date);

  const pastEmptySelected =
    !!selectedDate && selectedDate < today && !hasQtOnDate(selectedDate);
  const pastEmptyReading = pastEmptySelected
    ? getReadingForDate(selectedDate)
    : null;

  const onSelectDate = (date: string) => {
    setSelectedDate(date);
    if (date < today && hasQtOnDate(date)) {
      // Past + QT exists → 나의 QT for that date
      router.push(`/history?date=${encodeURIComponent(date)}`);
      return;
    }
    // Past + no QT: stay, show 본문 + CTA below calendar
    // today: selection only
    // future: selection + header-only 본문 preview
  };

  return (
    <div>
      <section className="hero-gradient px-5 pb-10 pt-1">
        <AppHeader
          light
          homeLayout
          title="오늘은"
          dateLabel={formatDisplayDate(today)}
          userName={currentUser.name}
          groupName={group?.name ?? "순"}
        />

        <div className="animate-fade-up mt-7 space-y-5">
          <h2 className="flex items-center gap-1.5 text-[17px] font-semibold tracking-[0.04em] text-text-main">
            <LightIcon
              active={doneToday}
              tone={doneToday ? "active" : "inactive"}
              size={20}
              justEarned={doneToday}
              label=""
            />
            <span>
              {doneToday
                ? "오늘의 말씀을 묵상했어요."
                : "오늘의 말씀이 기다리고 있어요."}
            </span>
          </h2>
          <ReadingPassageBlock reading={reading} label="본문" embedded />

          {showTodayWriting && todayEntry ? (
            <div className="space-y-7">
              {todayEntry.meditation.trim() ? (
                <div>
                  <p className="text-[15px] font-semibold text-text-main">
                    오늘 나의 묵상
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-[18px] leading-relaxed text-text-main">
                    {todayEntry.meditation}
                  </p>
                </div>
              ) : null}
              {todayEntry.verse.trim() ? (
                <div>
                  <p className="text-[15px] font-semibold text-text-main">
                    오늘 나의 마음에 남는 구절
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-[18px] leading-relaxed text-text-main">
                    {todayEntry.verse}
                  </p>
                </div>
              ) : null}
              {todayEntry.decisionObedience.trim() ? (
                <div>
                  <p className="text-[15px] font-semibold text-text-main">
                    오늘 나의 결단과 순종
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-[18px] leading-relaxed text-text-main">
                    {todayEntry.decisionObedience}
                  </p>
                </div>
              ) : null}
              {todayEntry.prayer.trim() ? (
                <div>
                  <p className="text-[15px] font-semibold text-text-main">
                    묵상 후 나의 기도제목
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-[18px] leading-relaxed text-text-main">
                    {todayEntry.prayer}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          <Link
            href={doneToday ? "/history" : "/qt"}
            className={
              doneToday
                ? "inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#008CFF] bg-white px-5 py-4 text-[16px] font-semibold shadow-none transition hover:bg-sky-light/50"
                : "btn-cta bg-cta inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-4 text-[16px] font-semibold !text-white shadow-none transition hover:brightness-105"
            }
          >
            {doneToday ? (
              <span className="text-[#008CFF]/70">나의 QT보러가기</span>
            ) : (
              <>
                <LightIcon
                  size={18}
                  tone="white"
                  label="빛"
                  justEarned={lastEarnedDate === today}
                />
                오늘의 QT 작성하기
              </>
            )}
          </Link>
        </div>
      </section>

      <section className="space-y-4 px-5 pb-2 pt-1">
        <div id="calendar" className="scroll-mt-6 space-y-3">
          <MonthPicker
            value={calYm}
            onChange={(ym) => {
              setCalYm(ym);
              setSelectedDate(null);
            }}
            min={minYm}
            max={maxYm}
            size="range"
          />
          <QtCalendar
            yearMonth={calYm}
            completedDates={completedDates}
            selectedDate={selectedDate}
            onSelect={onSelectDate}
            justEarnedDate={lastEarnedDate}
          />
        </div>

        {pastEmptyReading && selectedDate ? (
          <div className="animate-fade-up space-y-3">
            <ReadingPassageBlock reading={pastEmptyReading} label="본문" />
            <p className="px-1 text-center text-[13px] leading-relaxed text-text-secondary">
              지난 날짜 큐티는 기록할 수 있지만, 빛은 모이지 않아요.
            </p>
            <Link
              href={`/history?date=${encodeURIComponent(selectedDate)}`}
              className="btn-cta bg-cta inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-4 text-[16px] font-semibold !text-white shadow-none transition hover:brightness-105"
            >
              지난 큐티 작성하러 가기
            </Link>
          </div>
        ) : futurePreviewReading ? (
          <div className="animate-fade-up">
            <ReadingRangeMilestone reading={futurePreviewReading} label="본문" />
          </div>
        ) : null}
      </section>
    </div>
  );
}
