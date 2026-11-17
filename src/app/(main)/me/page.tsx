"use client";

import { MeSky } from "@/components/me/MeSky";
import { WeekdayParticipation } from "@/components/groups/WeekdayParticipation";
import { useApp } from "@/lib/app-context";
import { currentYearMonth, TERM_14_LABEL } from "@/lib/dates";
import {
  buildCompletionSet,
  buildLightSet,
  buildOutlineSet,
  userMonthStats,
  userTermLights,
  userWeekdayParticipation,
} from "@/lib/stats";

export default function MePage() {
  const { currentUser, groups, completions } = useApp();

  if (!currentUser) return null;

  const group = groups.find((g) => g.id === currentUser.groupId);
  const set = buildCompletionSet(completions);
  const lightSet = buildLightSet(completions);
  const outlineSet = buildOutlineSet(completions);
  const ym = currentYearMonth();
  const month = userMonthStats(currentUser.id, ym, set, lightSet);
  const weekdayPart = userWeekdayParticipation(currentUser.id, set);
  // On-time lights this 기 (past backfills excluded) — filled sky sparks + counts.
  const termLights = userTermLights(currentUser.id, lightSet);
  // Past backfills this 기 — outline sky only; never in dashboard counts.
  const termOutline = userTermLights(currentUser.id, outlineSet);

  const groupLabel = [
    group?.name ?? "-",
    currentUser.isLeader ? "순장" : null,
    currentUser.isAdmin ? "관리자" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="premium-qt-root premium-qt-root--me-sky">
      <header className="premium-tab-header premium-tab-header--me">
        <h1 className="premium-tab-title">마이페이지</h1>
        <div className="sky-walkers-bleed mt-2 animate-fade-up">
          <MeSky
            monthLights={month.lights}
            yearLights={termLights}
            outlineLights={termOutline}
            cumulativeLabel={`${TERM_14_LABEL} 누적`}
            groupLabel={groupLabel}
          />
        </div>
      </header>

      <section className="premium-qt-sheet premium-qt-sheet--me">
        <div className="premium-panel animate-fade-up">
          <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="qt-field-title qt-field-title--lg mb-0">나의 일주일</h2>
            <span className="type-caption font-medium text-text-secondary">
              {TERM_14_LABEL} 누적 기준
            </span>
          </div>
          <WeekdayParticipation days={weekdayPart} showPossible={false} />
        </div>
      </section>
    </div>
  );
}
