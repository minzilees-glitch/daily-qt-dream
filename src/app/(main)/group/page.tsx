"use client";

import { useMemo, useState } from "react";
import { PageTitle } from "@/components/layout/PageTitle";
import { SoftCard } from "@/components/ui/SoftCard";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { DayParticipation } from "@/components/groups/DayParticipation";
import { WeekdayParticipation } from "@/components/groups/WeekdayParticipation";
import { SkyWalkers } from "@/components/groups/SkyWalkers";
import { useApp } from "@/lib/app-context";
import { addMonths, currentYearMonth } from "@/lib/dates";
import {
  buildCompletionSet,
  computeGroupRanking,
  groupDayParticipation,
  groupWeekdayParticipation,
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
  const weekdayPart = groupWeekdayParticipation(
    currentUser.groupId,
    users,
    ym,
    set,
  );

  return (
    <div>
      <section className="hero-gradient px-5 pb-6">
        <PageTitle light>우리 순</PageTitle>
        <div className="mt-4">
          <MonthPicker
            value={ym}
            onChange={setYm}
            min={addMonths(currentYearMonth(), -2)}
            max={currentYearMonth()}
            size="range"
            capsule
          />
        </div>
        <div className="mt-5 animate-fade-up">
          <SkyWalkers
            members={members}
            memberCount={myRank?.memberCount ?? 0}
            lights={myRank?.lights ?? 0}
            rankLabel={`${myRank?.rank ?? "-"}위`}
          />
        </div>
      </section>

      <section className="animate-fade-up space-y-5 px-5 pt-1">
        <SoftCard>
          <h2 className="mb-3 text-[17px] font-semibold text-text-main">
            우리순 요일별 참여
          </h2>
          <WeekdayParticipation days={weekdayPart} />
        </SoftCard>

        <SoftCard>
          <h2 className="mb-3 text-[17px] font-semibold text-text-main">
            우리순 날짜별 참여
          </h2>
          <DayParticipation days={dayPart} />
        </SoftCard>
      </section>
    </div>
  );
}
