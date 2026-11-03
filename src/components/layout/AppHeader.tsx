"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";

export function AppHeader({
  title = "드림 매일큐티",
  subtitle,
  light = false,
  /** Home: brand then large date (swapped), profile top-right beside date area. */
  homeLayout = false,
  dateLabel,
  userName,
  groupName,
}: {
  title?: string;
  subtitle?: string;
  light?: boolean;
  homeLayout?: boolean;
  dateLabel?: string;
  userName?: string;
  groupName?: string;
}) {
  if (homeLayout) {
    return (
      <header
        className={`flex items-start justify-between gap-3 pt-[calc(12px+var(--safe-top))] ${
          light ? "text-white" : "text-text-main"
        }`}
      >
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium tracking-[0.04em] ${
              light ? "text-white/80" : "text-sky"
            }`}
          >
            {title}
          </p>
          <p
            className={`mt-1.5 text-[22px] font-bold leading-snug tracking-tight ${
              light ? "text-white" : "text-text-main"
            }`}
          >
            {dateLabel}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5 pt-0.5">
          <div className="min-w-0 text-right">
            <p
              className={`truncate text-[13px] font-semibold tracking-tight ${
                light ? "text-white" : "text-text-main"
              }`}
            >
              {userName}
            </p>
            <p
              className={`mt-0.5 truncate text-xs ${
                light ? "text-white/80" : "text-text-secondary"
              }`}
            >
              {groupName}
            </p>
          </div>
          <Link
            href="/me"
            aria-label="마이페이지"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition ${
              light
                ? "bg-white/20 text-white hover:bg-white/30"
                : "bg-ivory text-sky shadow-none hover:bg-sky-light"
            }`}
          >
            <UserRound size={20} strokeWidth={1.75} />
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`flex items-start justify-between gap-3 pt-[calc(12px+var(--safe-top))] ${
        light ? "text-white" : "text-text-main"
      }`}
    >
      <div className="min-w-0">
        <p
          className={`text-[13px] font-medium tracking-[0.08em] ${
            light ? "text-white/80" : "text-sky"
          }`}
        >
          {title}
        </p>
        {subtitle ? (
          <p
            className={`mt-1 truncate text-lg font-semibold tracking-tight ${
              light ? "text-white" : "text-text-main"
            }`}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      <Link
        href="/me"
        aria-label="마이페이지"
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition ${
          light
            ? "bg-white/20 text-white hover:bg-white/30"
            : "bg-ivory text-sky shadow-none hover:bg-sky-light"
        }`}
      >
        <UserRound size={20} strokeWidth={1.75} />
      </Link>
    </header>
  );
}
