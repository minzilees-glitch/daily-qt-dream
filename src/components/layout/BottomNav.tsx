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
};

/** Equal-priority row: home first (no raised center). */
const TABS: Tab[] = [
  { href: "/home", label: "오늘의 QT", light: true },
  { href: "/history", label: "나의 QT들", icon: CalendarDays },
  { href: "/group", label: "우리 순", icon: Users },
  { href: "/ranking", label: "랭킹", icon: Trophy },
  { href: "/me", label: "마이페이지", icon: UserRound },
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/home" && pathname.startsWith(href));
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="하단 메뉴"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-40"
    >
      <div className="nav-glass pointer-events-auto grid w-full grid-cols-5 gap-0.5 rounded-none border-x-0 border-b-0 px-1.5 pb-[calc(10px+var(--safe-bottom))] pt-1.5">
        {TABS.map(({ href, label, icon: Icon, light }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              className={`flex min-w-0 items-center justify-center rounded-[var(--radius-btn)] px-1 py-2.5 transition ${
                active ? "bg-white/20" : "hover:bg-white/10"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {light ? (
                <LightIcon
                  tone="white"
                  size={22}
                  rays={false}
                  label=""
                  className={`pointer-events-none ${active ? "opacity-100" : "opacity-75"}`}
                />
              ) : Icon ? (
                <Icon
                  size={22}
                  strokeWidth={active ? 2.4 : 1.75}
                  className={active ? "text-white" : "text-white/75"}
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
