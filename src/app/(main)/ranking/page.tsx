"use client";

import { useMemo, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { SoftCard } from "@/components/ui/SoftCard";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { RankingList } from "@/components/ranking/RankingList";
import { useApp } from "@/lib/app-context";
import { addMonths, currentYearMonth } from "@/lib/dates";
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
            QT를 완료한 날마다 빛 1개를 모읍니다.
            <br />
            순 전체 빛 수로 순위를 매깁니다. 동률이면 같은 순위입니다.
          </p>
        </SoftCard>
      </section>

      <section className="animate-fade-up px-5 pt-1">
        <RankingList rows={rows} />
      </section>
    </div>
  );
}
