"use client";

import { useMemo, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { SoftCard } from "@/components/ui/SoftCard";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { DayParticipation } from "@/components/groups/DayParticipation";
import { useApp } from "@/lib/app-context";
import { addMonths, currentYearMonth } from "@/lib/dates";
import {
  buildCompletionSet,
  computeGroupRanking,
  formatRate,
  groupDayParticipation,
} from "@/lib/stats";

export default function GroupPage() {
  const { currentUser, groups, users, completions } = useApp();
  const [ym, setYm] = useState(currentYearMonth());

  const set = useMemo(() => buildCompletionSet(completions), [completions]);

  if (!currentUser) return null;

  const group = groups.find((g) => g.id === currentUser.groupId);
  const ranking = computeGroupRanking(
    groups,
    users,
    completions,
    ym,
    currentUser.groupId,
  );
  const myRank = ranking.find((r) => r.groupId === currentUser.groupId);
  const dayPart = groupDayParticipation(currentUser.groupId, users, ym, set);

  return (
    <div>
      <section className="hero-gradient px-5 pb-6">
        <AppHeader light subtitle={group?.name ?? "우리 순"} />
        <SoftCard className="mt-5">
          <MonthPicker
            value={ym}
            onChange={setYm}
            min={addMonths(currentYearMonth(), -2)}
            max={currentYearMonth()}
          />
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-[18px] bg-sky-light px-2 py-3">
              <p className="text-[11px] text-text-secondary">인원</p>
              <p className="mt-1 text-lg font-semibold">{myRank?.memberCount ?? 0}명</p>
            </div>
            <div className="rounded-[18px] bg-sky-light px-2 py-3">
              <p className="text-[11px] text-text-secondary">참여율</p>
              <p className="mt-1 text-lg font-semibold">
                {formatRate(myRank?.rate ?? 0)}
              </p>
            </div>
            <div className="rounded-[18px] bg-sky-light px-2 py-3">
              <p className="text-[11px] text-text-secondary">전체 순위</p>
              <p className="mt-1 text-lg font-semibold">{myRank?.rank ?? "-"}위</p>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-text-secondary">
            순 소속은 관리자가 배정합니다. 다른 순원의 기록 내용은 보이지 않습니다.
          </p>
        </SoftCard>
      </section>

      <section className="animate-fade-up space-y-5 px-5 pt-1">
        <SoftCard>
          <h2 className="mb-3 text-[16px] font-semibold text-text-main">
            날짜별 참여
          </h2>
          <DayParticipation days={dayPart} />
        </SoftCard>
      </section>
    </div>
  );
}
