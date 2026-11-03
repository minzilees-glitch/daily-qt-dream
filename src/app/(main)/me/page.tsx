"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  LogOut,
  Settings,
  Shield,
} from "lucide-react";
import { SoftCard } from "@/components/ui/SoftCard";
import { StatLabel } from "@/components/ui/StatLabel";
import { ProfileAvatarButton } from "@/components/layout/ProfileAvatarButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { WeekdayParticipation } from "@/components/groups/WeekdayParticipation";
import { useApp } from "@/lib/app-context";
import {
  currentYearMonth,
  parseYmd,
  todaySeoul,
  yearWeekProgress,
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
  const { weeksStarted, currentWeek } = yearWeekProgress(todaySeoul());
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
    <div>
      <section className="hero-gradient px-5 pb-6">
        <div className="pt-[calc(28px+var(--safe-top))]">
          <SoftCard className="animate-fade-up bg-ivory">
            <div className="flex items-center gap-4">
              <ProfileAvatarButton size={56} fallback="initial" />
              <div className="min-w-0">
                <p className="truncate text-[19px] font-semibold text-text-main">
                  {currentUser.name}
                </p>
                <p className="text-[15px] text-text-secondary">
                  {group?.name ?? "-"}
                  {currentUser.isLeader ? " · 순장" : ""}
                  {currentUser.isAdmin ? " · 관리자" : ""}
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[16px] bg-white px-3 py-3 text-center">
                <StatLabel className="text-text-secondary">이번달 내가 모은 빛</StatLabel>
                <div className="mt-1 flex justify-center">
                  <LightCount
                    lights={month.lights}
                    size={18}
                    rays={false}
                    textClassName="text-[19px] font-semibold text-text-main"
                  />
                </div>
              </div>
              <div className="rounded-[16px] bg-white px-3 py-3 text-center">
                <StatLabel className="text-text-secondary">{year}년 누적</StatLabel>
                <div className="mt-1 flex justify-center">
                  <LightCount
                    lights={yearDays}
                    size={18}
                    textClassName="text-[19px] font-semibold text-text-main"
                  />
                </div>
              </div>
            </div>
          </SoftCard>
        </div>
      </section>

      <section className="animate-fade-up space-y-5 px-5 pt-1">
        <SoftCard className="bg-ivory">
          <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="text-[17px] font-semibold text-text-main">
              내가 잘 지키는 요일
            </h2>
            <span className="text-[14px] font-medium text-text-secondary">
              {year}년 누적 기준 {weeksStarted}개 주 중에 {currentWeek}번째 주
            </span>
          </div>
          <WeekdayParticipation days={weekdayPart} showPossible={false} />
        </SoftCard>

        <div className="space-y-2">
          <button
            type="button"
            className="soft-card flex w-full items-center justify-between p-4 text-left"
          >
            <span className="flex items-center gap-3 text-[16px] font-medium">
              <Settings size={18} className="text-sky" strokeWidth={1.75} />
              계정 설정
              <span className="text-[13px] font-normal text-text-secondary">(준비 중)</span>
            </span>
            <ChevronRight size={18} className="text-text-secondary" />
          </button>
          {currentUser.isAdmin ? (
            <Link
              href="/admin"
              className="soft-card flex items-center justify-between p-4"
            >
              <span className="flex items-center gap-3 text-[16px] font-medium">
                <Shield size={18} className="text-sky" strokeWidth={1.75} />
                관리자
              </span>
              <ChevronRight size={18} className="text-text-secondary" />
            </Link>
          ) : null}
        </div>

        <PrimaryButton
          type="button"
          variant="soft"
          className="w-full"
          onClick={() => {
            logout();
            router.replace("/login");
          }}
        >
          <LogOut size={18} strokeWidth={1.75} />
          로그아웃
        </PrimaryButton>

        <p className="text-center text-[13px] text-text-secondary">
          로그인 세션은 이 브라우저 localStorage에 저장됩니다. QT 기록은
          Supabase가 설정되면 DB에 저장되고, 없으면 로컬로 대체됩니다.
        </p>
      </section>
    </div>
  );
}
