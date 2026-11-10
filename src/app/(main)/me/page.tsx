"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  LogOut,
  Settings,
  Shield,
} from "lucide-react";
import { StatLabel } from "@/components/ui/StatLabel";
import { ProfileAvatarButton } from "@/components/layout/ProfileAvatarButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { WeekdayParticipation } from "@/components/groups/WeekdayParticipation";
import { useApp } from "@/lib/app-context";
import {
  currentYearMonth,
  parseYmd,
  todaySeoul,
} from "@/lib/dates";
import { LightCount } from "@/components/ui/LightIcon";
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
  // On-time lights this year (past backfills excluded).
  const yearDays = userYearLights(currentUser.id, year, lightSet, todaySeoul());

  return (
    <div className="premium-qt-root">
      <header className="premium-tab-header">
        <h1 className="premium-tab-title">마이페이지</h1>
        <div className="mt-[var(--space-stack)] animate-fade-up">
          <div className="flex items-center gap-4">
            <ProfileAvatarButton size={56} fallback="initial" />
            <div className="min-w-0">
              <p className="truncate type-stat text-[var(--color-ink-blue)]">
                {currentUser.name}
              </p>
              <p className="type-body-sm text-[var(--color-ink-blue)] opacity-75">
                {group?.name ?? "-"}
                {currentUser.isLeader ? " · 순장" : ""}
                {currentUser.isAdmin ? " · 관리자" : ""}
              </p>
            </div>
          </div>
          <div className="mt-[var(--space-stack)] grid grid-cols-2 gap-3">
            <div className="premium-stat-tile">
              <StatLabel className="text-text-secondary">
                이번달 내가 모은 빛
              </StatLabel>
              <div className="mt-1 flex justify-center">
                <LightCount
                  lights={month.lights}
                  size={18}
                  rays={false}
                  textClassName="type-stat text-text-main"
                />
              </div>
            </div>
            <div className="premium-stat-tile">
              <StatLabel className="text-text-secondary">{year}년 누적</StatLabel>
              <div className="mt-1 flex justify-center">
                <LightCount
                  lights={yearDays}
                  size={18}
                  textClassName="type-stat text-text-main"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="premium-qt-sheet">
        <div className="premium-panel animate-fade-up">
          <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="premium-panel-title mb-0">내가 잘 지키는 요일</h2>
            <span className="type-caption font-medium text-text-secondary">
              {year}년 누적 기준
            </span>
          </div>
          <WeekdayParticipation days={weekdayPart} showPossible={false} />
        </div>

        <div className="premium-panel space-y-2">
          <button type="button" className="premium-list-row">
            <span className="flex items-center gap-3 type-body font-medium text-text-main">
              <Settings
                size={18}
                className="text-[var(--color-ink-blue)]"
                strokeWidth={1.75}
              />
              계정 설정
              <span className="type-caption font-normal text-text-secondary">
                (준비 중)
              </span>
            </span>
            <ChevronRight size={18} className="text-text-secondary" />
          </button>
          {currentUser.isAdmin ? (
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
          ) : null}
        </div>

        <div className="premium-panel">
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

          <p className="mt-[var(--space-stack-sm)] text-center type-caption text-text-secondary">
            로그인 세션은 이 브라우저 localStorage에 저장됩니다. QT 기록은
            Supabase가 설정되면 DB에 저장되고, 없으면 로컬로 대체됩니다.
          </p>
        </div>
      </section>
    </div>
  );
}
