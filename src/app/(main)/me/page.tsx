"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, LogOut, Shield } from "lucide-react";
import { MeSky } from "@/components/me/MeSky";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { WeekdayParticipation } from "@/components/groups/WeekdayParticipation";
import { useApp } from "@/lib/app-context";
import {
  currentYearMonth,
  parseYmd,
  todaySeoul,
} from "@/lib/dates";
import {
  buildCompletionSet,
  buildLightSet,
  userMonthStats,
  userWeekdayParticipation,
  userYearLights,
} from "@/lib/stats";

export default function MePage() {
  const { currentUser, groups, completions, logout } = useApp();
  const router = useRouter();

  if (!currentUser) return null;

  const group = groups.find((g) => g.id === currentUser.groupId);
  const set = buildCompletionSet(completions);
  const lightSet = buildLightSet(completions);
  const ym = currentYearMonth();
  const year = parseYmd(todaySeoul()).year;
  const month = userMonthStats(currentUser.id, ym, set, lightSet);
  const weekdayPart = userWeekdayParticipation(
    currentUser.id,
    year,
    set,
    todaySeoul(),
  );
  // On-time lights this year (past backfills excluded) — also drives sky sparks.
  const yearDays = userYearLights(currentUser.id, year, lightSet, todaySeoul());

  const groupLabel = [
    group?.name ?? "-",
    currentUser.isLeader ? "순장" : null,
    currentUser.isAdmin ? "관리자" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="premium-qt-root">
      <header className="premium-tab-header premium-tab-header--me">
        <h1 className="premium-tab-title">마이페이지</h1>
        <div className="sky-walkers-bleed mt-2 animate-fade-up">
          <MeSky
            monthLights={month.lights}
            yearLights={yearDays}
            yearLabel={String(year)}
            groupLabel={groupLabel}
          />
        </div>
      </header>

      <section className="premium-qt-sheet premium-qt-sheet--fill premium-qt-sheet--me">
        <div className="premium-panel animate-fade-up">
          <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="premium-panel-title mb-0">내가 잘 지키는 요일</h2>
            <span className="type-caption font-medium text-text-secondary">
              {year}년 누적 기준
            </span>
          </div>
          <WeekdayParticipation days={weekdayPart} showPossible={false} />
        </div>

        {currentUser.isAdmin ? (
          <div className="premium-panel space-y-2 me-sheet-tail">
            <Link href="/admin" className="premium-list-row">
              <span className="flex items-center gap-3 type-body font-medium text-text-main">
                <Shield
                  size={18}
                  className="text-[var(--color-ink-blue)]"
                  strokeWidth={1.75}
                />
                관리자
              </span>
              <ChevronRight size={18} className="text-text-secondary" />
            </Link>
          </div>
        ) : null}

        <div className="premium-panel me-sheet-foot">
          <PrimaryButton
            type="button"
            className="w-full"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
          >
            <LogOut size={18} strokeWidth={1.75} />
            로그아웃
          </PrimaryButton>

          <p className="qt-validation-hint mt-[var(--space-stack-sm)] text-center type-caption text-text-secondary">
            로그인 세션은 이 브라우저 localStorage에 저장됩니다. QT 기록은
            Supabase가 설정되면 DB에 저장되고, 없으면 로컬로 대체됩니다.
          </p>
        </div>
      </section>
    </div>
  );
}
