"use client";

import { useMemo, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { SoftCard } from "@/components/ui/SoftCard";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { RankingList } from "@/components/ranking/RankingList";
import { useApp } from "@/lib/app-context";
import { addMonths, currentYearMonth, rankingScopeDays } from "@/lib/dates";
import { computeGroupRanking } from "@/lib/stats";

export default function RankingPage() {
  const { currentUser, groups, users, completions } = useApp();
  const [ym, setYm] = useState(currentYearMonth());

  const rows = useMemo(
    () =>
      computeGroupRanking(
        groups,
        users,
        completions,
        ym,
        currentUser?.groupId,
      ),
    [groups, users, completions, ym, currentUser?.groupId],
  );

  const scopeDays = rankingScopeDays(ym).length;

  if (!currentUser) return null;

  return (
    <div>
      <section className="hero-gradient px-5 pb-6">
        <AppHeader light subtitle="전체 순 랭킹" />
        <SoftCard className="mt-5 space-y-3">
          <MonthPicker
            value={ym}
            onChange={setYm}
            min={addMonths(currentYearMonth(), -2)}
            max={currentYearMonth()}
          />
          <p className="text-center text-xs leading-relaxed text-text-secondary">
            참여율 = 순 전체 QT 완료 수 ÷ (인원 × {scopeDays}일) × 100
            <br />
            동률이면 같은 순위입니다. 이번 달은 오늘까지 집계합니다.
          </p>
        </SoftCard>
      </section>

      <section className="animate-fade-up px-5 pt-1">
        <RankingList rows={rows} />
      </section>
    </div>
  );
}
