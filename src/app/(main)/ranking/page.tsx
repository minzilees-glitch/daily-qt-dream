"use client";

import { useMemo, useState } from "react";
import { MonthPicker } from "@/components/ui/MonthPicker";
import {
  RankingList,
  RANKING_MY_ROW_ID,
} from "@/components/ranking/RankingList";
import { useApp } from "@/lib/app-context";
import {
  currentYearMonth,
  TERM_14_START_YM,
} from "@/lib/dates";
import { computeGroupRanking } from "@/lib/stats";

function clampRankingYm(ym: string): string {
  const cur = currentYearMonth();
  if (ym < TERM_14_START_YM) return TERM_14_START_YM;
  if (ym > cur) return cur;
  return ym;
}

export default function RankingPage() {
  const { currentUser, groups, users, completions } = useApp();
  const [ym, setYm] = useState(() => clampRankingYm(currentYearMonth()));

  const preTerm = ym < TERM_14_START_YM;

  const rows = useMemo(() => {
    if (preTerm) return [];
    return computeGroupRanking(
      groups,
      users,
      completions,
      ym,
      currentUser?.groupId,
    );
  }, [preTerm, groups, users, completions, ym, currentUser?.groupId]);

  const hasMine = rows.some((r) => r.isMine);

  const scrollToMyGroup = () => {
    const el = document.getElementById(RANKING_MY_ROW_ID);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (!currentUser) return null;

  return (
    <div className="premium-qt-root">
      <header className="premium-tab-header premium-tab-header--ranking">
        <h1 className="premium-tab-title">랭킹</h1>
        <p className="qt-validation-hint type-caption mt-[var(--space-stack-sm)] text-text-secondary">
          큐티를 당일에 완료한 날마다 빛 1개를 모읍니다. 순 전체 빛 수로 순위를
          매깁니다.
        </p>
      </header>

      <section className="premium-qt-sheet">
        <div className="animate-fade-up">
          <div className="mb-[var(--space-stack)] flex items-center justify-between gap-3">
            <MonthPicker
              value={ym}
              onChange={(next) => setYm(clampRankingYm(next))}
              min={TERM_14_START_YM}
              max={currentYearMonth()}
              align="start"
            />
            <button
              type="button"
              className="premium-find-my-rank shrink-0"
              onClick={scrollToMyGroup}
              disabled={!hasMine || preTerm}
            >
              내순 찾기
            </button>
          </div>
          {preTerm ? (
            <p className="py-10 text-center type-body-sm text-text-secondary">
              14기 시작 전입니다.
            </p>
          ) : (
            <RankingList rows={rows} />
          )}
        </div>
      </section>
    </div>
  );
}
