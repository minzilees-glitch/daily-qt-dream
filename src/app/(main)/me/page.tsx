"use client";

import Link from "next/link";
import { ChevronRight, Shield } from "lucide-react";
import { MeSky } from "@/components/me/MeSky";
import { WeekdayParticipation } from "@/components/groups/WeekdayParticipation";
import { useApp } from "@/lib/app-context";
import {
  currentYearMonth,
  parseYmd,
  todaySeoul,
} from "@/lib/dates";
import {
  buildCompletionSet,
  buildLightSet,
  userMonthStats,
  userWeekdayParticipation,
  userYearLights,
} from "@/lib/stats";

export default function MePage() {
  const { currentUser, groups, completions } = useApp();

  if (!currentUser) return null;

  const group = groups.find((g) => g.id === currentUser.groupId);
  const set = buildCompletionSet(completions);
  const lightSet = buildLightSet(completions);
  const ym = currentYearMonth();
  const year = parseYmd(todaySeoul()).year;
  const month = userMonthStats(currentUser.id, ym, set, lightSet);
  const weekdayPart = userWeekdayParticipation(
    currentUser.id,
    year,
    set,
    todaySeoul(),
  );
  // On-time lights this year (past backfills excluded) — also drives sky sparks.
  const yearDays = userYearLights(currentUser.id, year, lightSet, todaySeoul());

  const groupLabel = [
    group?.name ?? "-",
    currentUser.isLeader ? "순장" : null,
    currentUser.isAdmin ? "관리자" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="premium-qt-root premium-qt-root--me-sky">
      <header className="premium-tab-header premium-tab-header--me">
        <h1 className="premium-tab-title">마이페이지</h1>
        <div className="sky-walkers-bleed mt-2 animate-fade-up">
          <MeSky
            monthLights={month.lights}
            yearLights={yearDays}
            yearLabel={String(year)}
            groupLabel={groupLabel}
          />
        </div>
      </header>

      <section className="premium-qt-sheet premium-qt-sheet--me">
        <div className="premium-panel animate-fade-up">
          <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="premium-panel-title mb-0">내가 잘 지키는 요일</h2>
            <span className="type-caption font-medium text-text-secondary">
              {year}년 누적 기준
            </span>
          </div>
          <WeekdayParticipation days={weekdayPart} showPossible={false} />
        </div>

        {currentUser.isAdmin ? (
          <div className="premium-panel space-y-2">
            <Link href="/admin" className="premium-list-row">
              <span className="flex items-center gap-3 type-body font-medium text-text-main">
                <Shield
                  size={18}
                  className="text-[var(--color-ink-blue)]"
                  strokeWidth={1.75}
                />
                관리자
              </span>
              <ChevronRight size={18} className="text-text-secondary" />
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
