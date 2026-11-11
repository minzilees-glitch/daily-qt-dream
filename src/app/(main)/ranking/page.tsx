"use client";

import { useMemo, useState } from "react";
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
    <div className="premium-qt-root">
      <header className="premium-tab-header">
        <h1 className="premium-tab-title">랭킹</h1>
        <p className="qt-validation-hint type-caption mt-[var(--space-stack-sm)] text-text-secondary">
          QT를 당일에 완료한 날마다 빛 1개를 모읍니다. 순 전체 빛 수로 순위를
          매깁니다.
        </p>
      </header>

      <section className="premium-qt-sheet">
        <div className="animate-fade-up">
          <div className="mb-[var(--space-stack)]">
            <MonthPicker
              value={ym}
              onChange={setYm}
              min={addMonths(currentYearMonth(), -2)}
              max={currentYearMonth()}
              align="start"
            />
          </div>
          <RankingList rows={rows} />
        </div>
      </section>
    </div>
  );
}
