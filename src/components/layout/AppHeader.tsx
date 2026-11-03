"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";

export function AppHeader({
  title = "DAILY QT",
  subtitle,
  light = false,
}: {
  title?: string;
  subtitle?: string;
  light?: boolean;
}) {
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
            : "bg-ivory text-sky shadow-[var(--shadow-soft)] hover:bg-sky-light"
        }`}
      >
        <UserRound size={20} strokeWidth={1.75} />
      </Link>
    </header>
  );
}
