"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ChevronRight, PenLine } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { SoftCard } from "@/components/ui/SoftCard";
import { StatRow } from "@/components/qt/StatRow";
import { QtCalendar } from "@/components/qt/QtCalendar";
import { ReadingRangeCard } from "@/components/qt/ReadingRangeCard";
import { useApp } from "@/lib/app-context";
import { getReadingForDate } from "@/lib/mock-data";
import {
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#calendar") return;
    const el = document.getElementById("calendar");
    if (!el) return;
    // Wait a tick for layout after navigation
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(t);
  }, []);

  if (!currentUser) return null;

  const today = todaySeoul();
  const ym = currentYearMonth();
  const group = groups.find((g) => g.id === currentUser.groupId);
  const set = buildCompletionSet(completions);
  const mine = userMonthStats(currentUser.id, ym, set);
  const ranking = computeGroupRanking(
    groups,
    users,
    completions,
    ym,
    currentUser.groupId,
  );
  const myRank = ranking.find((r) => r.groupId === currentUser.groupId);
  const doneToday = isCompleted(currentUser.id, today);
  const reading = getReadingForDate(today);

  const completedDates = new Set<string>();
  for (const c of completions) {
    if (
      c.userId === currentUser.id &&
      c.completed &&
      yearMonthOf(c.date) === ym
    ) {
      completedDates.add(c.date);
    }
  }

  return (
    <div>
      <section className="hero-gradient px-5 pb-8">
        <AppHeader
          light
          subtitle={`${currentUser.name} · ${group?.name ?? "순"}`}
        />
        <p className="mt-4 text-sm text-white/85">{formatDisplayDate(today)}</p>

        <SoftCard className="animate-fade-up mt-6" padding="p-5">
          <p className="text-sm font-medium text-text-secondary">오늘 QT 했나요?</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-text-main">
            {doneToday ? "오늘도 잘 하셨어요" : "기록을 남기면 완료돼요"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            묵상 · 구절 · 기도제목 중 하나를 20자 이상 작성해 저장하면
            오늘의 QT가 완료됩니다.
          </p>
          <div className="mt-5">
            <Link
              href="/qt"
              className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] bg-sky px-5 py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(95,188,252,0.35)] transition hover:brightness-105"
            >
              <PenLine size={18} strokeWidth={1.75} />
              {doneToday ? "오늘 기록 수정하기" : "오늘의 QT 작성하기"}
            </Link>
          </div>
        </SoftCard>
      </section>

      <section className="space-y-5 px-5 pt-2">
        <ReadingRangeCard reading={reading} compact />

        <StatRow
          items={[
            { label: "내 QT", value: `${mine.days}일` },
            { label: "내 참여율", value: formatRate(mine.rate) },
            { label: "순 참여율", value: formatRate(myRank?.rate ?? 0) },
            { label: "순 순위", value: myRank ? `${myRank.rank}위` : "-" },
          ]}
        />

        <SoftCard id="calendar" className="scroll-mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[16px] font-semibold text-text-main">이번 달 미리보기</h3>
            <Link
              href="/history"
              className="flex items-center gap-0.5 text-sm font-medium text-sky"
            >
              전체 보기 <ChevronRight size={16} />
            </Link>
          </div>
          <QtCalendar yearMonth={ym} completedDates={completedDates} />
        </SoftCard>

        <Link
          href="/ranking"
          className="soft-card mb-2 flex items-center justify-between p-5 transition hover:bg-white"
        >
          <div>
            <p className="text-sm text-text-secondary">전체 순 랭킹</p>
            <p className="mt-1 text-[16px] font-semibold text-text-main">
              이번 달 우리 순은 {myRank?.rank ?? "-"}위
            </p>
          </div>
          <ChevronRight className="text-sky" size={20} />
        </Link>
      </section>
    </div>
  );
}
