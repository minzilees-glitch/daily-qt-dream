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
      <section className="hero-gradient px-5 pb-6">
        <PageTitle light>랭킹</PageTitle>
        <div className="mt-4">
          <MonthPicker
            value={ym}
            onChange={setYm}
            min={addMonths(currentYearMonth(), -2)}
            max={currentYearMonth()}
            light
          />
        </div>
        <p className="mt-5 text-center text-[15px] leading-relaxed text-text-main">
          당일 QT를 완료한 날마다 빛 1개를 모읍니다.
          <br />
          지난 날짜 작성은 빛에 포함되지 않아요. 순 전체 빛 수로 순위를 매깁니다.
        </p>
      </section>

      <section className="animate-fade-up px-5 pt-1">
        <RankingList rows={rows} />
      </section>
    </div>
  );
}
