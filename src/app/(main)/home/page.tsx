"use client";

import Link from "next/link";
import { ChevronRight, PenLine } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { SoftCard } from "@/components/ui/SoftCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { StatRow } from "@/components/qt/StatRow";
import { QtCalendar } from "@/components/qt/QtCalendar";
import { useApp } from "@/lib/app-context";
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
  const { currentUser, groups, users, completions, isCompleted, toggleCompletion } =
    useApp();
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
            {doneToday ? "오늘도 잘 하셨어요" : "아직 체크 전이에요"}
          </h2>
          <div className="mt-5 flex flex-col gap-3">
            <PrimaryButton
              type="button"
              onClick={() => toggleCompletion(today)}
              className="w-full"
            >
              {doneToday ? "완료 취소하기" : "QT 완료하기"}
            </PrimaryButton>
            <Link
              href="/qt"
              className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-sky-light px-5 py-3.5 text-[15px] font-semibold text-text-main transition hover:bg-[#dceef8]"
            >
              <PenLine size={18} strokeWidth={1.75} />
              오늘의 묵상 쓰기
            </Link>
          </div>
        </SoftCard>
      </section>

      <section className="space-y-5 px-5 pt-2">
        <StatRow
          items={[
            { label: "내 QT", value: `${mine.days}일` },
            { label: "내 참여율", value: formatRate(mine.rate) },
            { label: "순 참여율", value: formatRate(myRank?.rate ?? 0) },
            { label: "순 순위", value: myRank ? `${myRank.rank}위` : "-" },
          ]}
        />

        <SoftCard>
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
