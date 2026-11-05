"use client";

import { useMemo, useState } from "react";
import { PageTitle } from "@/components/layout/PageTitle";
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
      <section className="hero-gradient px-[var(--space-page-x)] pb-[var(--space-hero-pb)]">
        <PageTitle light>랭킹</PageTitle>
        <div className="mt-[var(--space-stack-sm)]">
          <MonthPicker
            value={ym}
            onChange={setYm}
            min={addMonths(currentYearMonth(), -2)}
            max={currentYearMonth()}
            capsule
          />
        </div>
        <p className="type-caption mt-[var(--space-stack)] text-center text-text-main">
          QT를 당일에 완료한 날마다 빛 1개를 모읍니다. 순 전체 빛 수로 순위를 매깁니다.
        </p>
      </section>

      <section className="animate-fade-up px-[var(--space-page-x)] pt-1">
        <RankingList rows={rows} />
      </section>
    </div>
  );
}
