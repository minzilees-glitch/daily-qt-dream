"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  History,
  LogOut,
  Settings,
  Shield,
} from "lucide-react";
import { SoftCard } from "@/components/ui/SoftCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useApp } from "@/lib/app-context";
import {
  currentYearMonth,
  parseYmd,
  todaySeoul,
} from "@/lib/dates";
import { LightCount } from "@/components/ui/LightIcon";
import {
  buildCompletionSet,
  userMonthStats,
  userYearDays,
} from "@/lib/stats";

export default function MePage() {
  const { currentUser, groups, completions, logout } = useApp();
  const router = useRouter();

  if (!currentUser) return null;

  const group = groups.find((g) => g.id === currentUser.groupId);
  const set = buildCompletionSet(completions);
  const ym = currentYearMonth();
  const month = userMonthStats(currentUser.id, ym, set);
  const year = parseYmd(todaySeoul()).year;
  const yearDays = userYearDays(currentUser.id, year, set, todaySeoul());

  return (
    <div className="px-5 pt-[calc(20px+var(--safe-top))]">
      <h1 className="text-2xl font-bold tracking-tight text-text-main">마이페이지</h1>

      <SoftCard className="animate-fade-up mt-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-light text-xl font-semibold text-sky">
            {currentUser.name.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-text-main">
              {currentUser.name}
            </p>
            <p className="text-sm text-text-secondary">
              {group?.name ?? "-"}
              {currentUser.isLeader ? " · 순장" : ""}
              {currentUser.isAdmin ? " · 관리자" : ""}
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-[18px] bg-sky-light px-3 py-3 text-center">
            <p className="text-xs text-text-secondary">이번 달 빛</p>
            <div className="mt-1 flex justify-center">
              <LightCount
                lights={month.lights}
                size={18}
                textClassName="text-lg font-semibold text-text-main"
              />
            </div>
            <p className="text-xs text-text-secondary">{month.possible}일 중</p>
          </div>
          <div className="rounded-[18px] bg-sky-light px-3 py-3 text-center">
            <p className="text-xs text-text-secondary">{year}년 누적</p>
            <div className="mt-1 flex justify-center">
              <LightCount
                lights={yearDays}
                size={18}
                textClassName="text-lg font-semibold text-text-main"
              />
            </div>
            <p className="text-xs text-text-secondary">모은 빛</p>
          </div>
        </div>
      </SoftCard>

      <div className="mt-5 space-y-2">
        <Link
          href="/history"
          className="soft-card flex items-center justify-between p-4"
        >
          <span className="flex items-center gap-3 text-[15px] font-medium">
            <History size={18} className="text-sky" strokeWidth={1.75} />
            나의 QT 기록
          </span>
          <ChevronRight size={18} className="text-text-secondary" />
        </Link>
        <button
          type="button"
          className="soft-card flex w-full items-center justify-between p-4 text-left"
        >
          <span className="flex items-center gap-3 text-[15px] font-medium">
            <Settings size={18} className="text-sky" strokeWidth={1.75} />
            계정 설정
            <span className="text-xs font-normal text-text-secondary">(준비 중)</span>
          </span>
          <ChevronRight size={18} className="text-text-secondary" />
        </button>
        {currentUser.isAdmin ? (
          <Link
            href="/admin"
            className="soft-card flex items-center justify-between p-4"
          >
            <span className="flex items-center gap-3 text-[15px] font-medium">
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
        className="mt-8 w-full"
        onClick={() => {
          logout();
          router.replace("/login");
        }}
      >
        <LogOut size={18} strokeWidth={1.75} />
        로그아웃
      </PrimaryButton>

      <p className="mt-4 text-center text-xs text-text-secondary">
        세션은 이 브라우저 localStorage에만 저장됩니다. (프로토타입)
      </p>
    </div>
  );
}
