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
  { href: "/home", label: "오늘의 큐티", light: true },
  { href: "/history", label: "나의 큐티들", icon: CalendarDays },
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
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40"
    >
      {/*
        Hit targets own the full docked bar height (incl. safe-area pad).
        Padding lives on each <Link>, not the glass chrome, so taps anywhere
        in a tab cell navigate — not only on the icon glyph.
      */}
      <div className="nav-glass nav-glass--docked pointer-events-auto grid w-full grid-cols-5">
        {TABS.map(({ href, label, icon: Icon, light }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              className={`nav-tab-hit flex min-h-0 min-w-0 items-center justify-center transition ${
                active ? "bg-white/20" : "hover:bg-white/10 active:bg-white/15"
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
