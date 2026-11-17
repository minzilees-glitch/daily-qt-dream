"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Trophy,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { LightIcon } from "@/components/ui/LightIcon";

type Tab = {
  href: string;
  label: string;
  icon?: LucideIcon;
  /** Home uses the shared 빛 asset instead of a Lucide icon. */
  light?: boolean;
  /** Extra path prefixes that keep this tab active (e.g. /qt → Home). */
  matchPrefixes?: string[];
};

/** Equal-priority row: home first (no raised center). */
const TABS: Tab[] = [
  {
    href: "/home",
    label: "오늘의 큐티",
    light: true,
    matchPrefixes: ["/qt"],
  },
  { href: "/history", label: "나의 큐티들", icon: CalendarDays },
  { href: "/group", label: "우리 순", icon: Users },
  { href: "/ranking", label: "랭킹", icon: Trophy },
  { href: "/me", label: "마이페이지", icon: UserRound },
];

function isActive(pathname: string, tab: Tab) {
  if (pathname === tab.href || pathname.startsWith(`${tab.href}/`)) {
    return true;
  }
  return (tab.matchPrefixes ?? []).some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="하단 메뉴"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-8 pb-[calc(10px+var(--safe-bottom))]"
    >
      {/*
        Floating capsule: each <Link> fills its grid cell so taps near the
        icon (not only the glyph) navigate.
      */}
      <div className="nav-glass pointer-events-auto grid w-full max-w-[var(--phone-max)] grid-cols-5 gap-0.5 rounded-[var(--radius-btn)] px-1.5 py-2.5">
        {TABS.map((tab) => {
          const { href, label, icon: Icon, light } = tab;
          const active = isActive(pathname, tab);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              className={`nav-tab-hit flex min-w-0 items-center justify-center rounded-[var(--radius-btn)] px-1 py-2.5 transition ${
                active ? "bg-white/20" : "hover:bg-white/10 active:bg-white/15"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {light ? (
                <LightIcon
                  tone="white"
                  size={22}
                  rays={false}
                  interactive={false}
                  label=""
                  className={`pointer-events-none ${active ? "opacity-100" : "opacity-75"}`}
                />
              ) : Icon ? (
                <Icon
                  size={22}
                  strokeWidth={active ? 2.4 : 1.75}
                  className={`pointer-events-none ${active ? "text-white" : "text-white/75"}`}
                  aria-hidden
                />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
