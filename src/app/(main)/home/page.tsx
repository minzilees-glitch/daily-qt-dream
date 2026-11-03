"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PenLine } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { SoftCard } from "@/components/ui/SoftCard";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { StatRow } from "@/components/qt/StatRow";
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
import {
  buildCompletionSet,
  computeGroupRanking,
  formatRate,
  userMonthStats,
} from "@/lib/stats";

export default function HomePage() {
  const { currentUser, groups, users, completions, isCompleted } = useApp();
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
  const set = buildCompletionSet(completions);
  const mine = userMonthStats(currentUser.id, dashYm, set);
  const ranking = computeGroupRanking(
    groups,
    users,
    completions,
    dashYm,
    currentUser.groupId,
  );
  const myRank = ranking.find((r) => r.groupId === currentUser.groupId);
  const doneToday = isCompleted(currentUser.id, today);
  const reading = getReadingForDate(today);
  const previewDate = selectedDate ?? today;
  const previewReading = getReadingForDate(previewDate);

  const onSelectDate = (date: string) => {
    setSelectedDate(date);
    // 지난날 → 나의 QT에서 기록 확인 (오늘·미래는 홈에서 본문만 미리보기)
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
        <div>
          <h3 className="mb-3 text-[16px] font-semibold text-text-main">
            이번달 대시보드
          </h3>
          <StatRow
            items={[
              { label: "내 QT", value: `${mine.days}일` },
              { label: "내 참여율", value: formatRate(mine.rate) },
              { label: "순 참여율", value: formatRate(myRank?.rate ?? 0) },
              { label: "순 순위", value: myRank ? `${myRank.rank}위` : "-" },
            ]}
          />
        </div>

        <SoftCard id="calendar" className="scroll-mt-6 space-y-4">
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
          <QtCalendar
            yearMonth={calYm}
            completedDates={completedDates}
            selectedDate={selectedDate}
            onSelect={onSelectDate}
          />
          <div className="space-y-2 border-t border-sky-light pt-4">
            <p className="text-sm font-medium text-text-main">
              {formatDisplayDate(previewDate)} 본문
            </p>
            <ReadingRangeInline reading={previewReading} label="본문 범위" />
            <p className="text-center text-xs text-text-secondary">
              지난날을 누르면 나의 QT에서 기록을 볼 수 있어요.
            </p>
          </div>
        </SoftCard>
      </section>
    </div>
  );
}
