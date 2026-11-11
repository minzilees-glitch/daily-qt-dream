"use client";

import { useMemo, useState } from "react";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { DayParticipation } from "@/components/groups/DayParticipation";
import { WeekdayParticipation } from "@/components/groups/WeekdayParticipation";
import { SkyWalkers } from "@/components/groups/SkyWalkers";
import { useApp } from "@/lib/app-context";
import { addMonths, currentYearMonth, todaySeoul } from "@/lib/dates";
import {
  buildCompletionSet,
  computeGroupRanking,
  groupDayParticipation,
  groupThisWeekWeekdayParticipation,
} from "@/lib/stats";

export default function GroupPage() {
  const { currentUser, groups, users, completions } = useApp();
  const [ym, setYm] = useState(currentYearMonth());

  const set = useMemo(() => buildCompletionSet(completions), [completions]);

  const members = useMemo(() => {
    if (!currentUser) return [];
    return users
      .filter((u) => u.groupId === currentUser.groupId)
      .sort((a, b) => {
        if (a.isLeader !== b.isLeader) return a.isLeader ? -1 : 1;
        return a.name.localeCompare(b.name, "ko");
      });
  }, [users, currentUser]);

  if (!currentUser) return null;

  const ranking = computeGroupRanking(
    groups,
    users,
    completions,
    ym,
    currentUser.groupId,
  );
  const myRank = ranking.find((r) => r.groupId === currentUser.groupId);
  const dayPart = groupDayParticipation(currentUser.groupId, users, ym, set);
  const today = todaySeoul();
  const weekBars = groupThisWeekWeekdayParticipation(
    currentUser.groupId,
    users,
    set,
    today,
  );

  return (
    <div className="premium-qt-root">
      <header className="premium-tab-header">
        <h1 className="premium-tab-title">우리 순</h1>
        <div className="mt-[var(--space-stack-sm)]">
          <MonthPicker
            value={ym}
            onChange={setYm}
            min={addMonths(currentYearMonth(), -2)}
            max={currentYearMonth()}
            align="start"
          />
        </div>
        <div className="sky-walkers-bleed mt-[var(--space-stack)] animate-fade-up">
          <SkyWalkers
            members={members}
            memberCount={myRank?.memberCount ?? 0}
            lights={myRank?.lights ?? 0}
            rankLabel={`${myRank?.rank ?? "-"}위`}
          />
        </div>
      </header>

      <section className="premium-qt-sheet">
        <div className="premium-panel animate-fade-up pt-6">
          <h2 className="qt-field-title mb-3">우리순의 이번주 참여</h2>
          <WeekdayParticipation
            days={weekBars}
            showCount={false}
            showPossible={false}
          />
        </div>

        <div className="premium-panel premium-panel--gray-band animate-fade-up">
          <h2 className="qt-field-title mb-3">우리순 날짜별 참여</h2>
          <DayParticipation days={dayPart} />
        </div>
      </section>
    </div>
  );
}
