"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PenLine } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { SoftCard } from "@/components/ui/SoftCard";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { QtCalendar } from "@/components/qt/QtCalendar";
import { ReadingRangeInline } from "@/components/qt/ReadingRangeInline";
import { useApp } from "@/lib/app-context";
import { getReadingForDate } from "@/lib/mock-data";
import {
  addMonths,
  currentYearMonth,
  formatDisplayDate,
  todaySeoul,
  yearMonthOf,
} from "@/lib/dates";

export default function HomePage() {
  const { currentUser, groups, completions, isCompleted } = useApp();
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

  const today = todaySeoul();
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

  if (!currentUser) return null;

  const group = groups.find((g) => g.id === currentUser.groupId);
  const doneToday = isCompleted(currentUser.id, today);
  const reading = getReadingForDate(today);

  const onSelectDate = (date: string) => {
    setSelectedDate(date);
    // 지난날 → 나의 QT에서 기록 확인
    if (date < today) {
      router.push(`/history?date=${encodeURIComponent(date)}`);
    }
  };

  return (
    <div>
      <section className="hero-gradient px-5 pb-8">
        <AppHeader
          light
          homeLayout
          dateLabel={formatDisplayDate(today)}
          userName={currentUser.name}
          groupName={group?.name ?? "순"}
        />

        <SoftCard className="animate-fade-up mt-6 space-y-4" padding="p-5">
          <div>
            <p className="text-sm font-medium text-text-secondary">오늘 QT 했나요?</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-text-main">
              오늘 묵상할 하나님 말씀
            </h2>
          </div>

          <ReadingRangeInline reading={reading} label="본문" />

          <Link
            href="/qt"
            className="btn-cta inline-flex w-full items-center justify-center gap-2 rounded-[18px] bg-cta px-5 py-3.5 text-[15px] font-semibold !text-white shadow-none transition hover:brightness-105 [&_svg]:!text-white"
          >
            <PenLine size={18} strokeWidth={1.75} className="text-white" />
            {doneToday ? "오늘 기록 수정하기" : "오늘의 QT 작성하기"}
          </Link>
        </SoftCard>
      </section>

      <section className="space-y-5 px-5 pt-2">
        <SoftCard id="calendar" className="scroll-mt-6 space-y-4">
          <div>
            <h3 className="mb-3 text-[16px] font-semibold text-text-main">
              나의 QT 캘린더
            </h3>
            <MonthPicker
              value={calYm}
              onChange={(ym) => {
                setCalYm(ym);
                setSelectedDate(null);
              }}
              min={minYm}
              max={maxYm}
              monthOnly
            />
          </div>
          <QtCalendar
            yearMonth={calYm}
            completedDates={completedDates}
            selectedDate={selectedDate}
            onSelect={onSelectDate}
          />
        </SoftCard>
      </section>
    </div>
  );
}
