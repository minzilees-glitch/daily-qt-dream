"use client";

import { useMemo, useState } from "react";
import { PageTitle } from "@/components/layout/PageTitle";
import { SoftCard } from "@/components/ui/SoftCard";
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
    <div>
      <section className="hero-gradient px-[var(--space-page-x)] pb-[var(--space-hero-pb)]">
        <PageTitle light>우리 순</PageTitle>
        <div className="mt-[var(--space-stack-sm)]">
          <MonthPicker
            value={ym}
            onChange={setYm}
            min={addMonths(currentYearMonth(), -2)}
            max={currentYearMonth()}
            light
          />
        </div>
        <div className="mt-[var(--space-stack)] animate-fade-up">
          <SkyWalkers
            members={members}
            memberCount={myRank?.memberCount ?? 0}
            lights={myRank?.lights ?? 0}
            rankLabel={`${myRank?.rank ?? "-"}위`}
          />
        </div>
      </section>

      <section className="animate-fade-up space-y-[var(--space-stack)] px-[var(--space-page-x)] pt-1">
        <SoftCard>
          <h2 className="mb-3 type-section text-text-main">
            우리순의 이번주 참여
          </h2>
          <WeekdayParticipation
            days={weekBars}
            showCount={false}
            showPossible={false}
          />
        </SoftCard>

        <SoftCard>
          <h2 className="mb-3 type-section text-text-main">
            우리순 날짜별 참여
          </h2>
          <DayParticipation days={dayPart} />
        </SoftCard>
      </section>
    </div>
  );
}
