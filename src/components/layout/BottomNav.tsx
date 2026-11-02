"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Trophy, Users } from "lucide-react";

const TABS = [
  { href: "/home", label: "홈", icon: Home },
  { href: "/history", label: "나의 QT", icon: BookOpen },
  { href: "/group", label: "우리 순", icon: Users },
  { href: "/ranking", label: "랭킹", icon: Trophy },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="하단 메뉴"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-4 pb-[calc(12px+var(--safe-bottom))]"
    >
      <div className="pointer-events-auto mx-auto flex max-w-[440px] items-center justify-between gap-1 rounded-full bg-sky px-2 py-2 shadow-[var(--shadow-nav)]">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/home" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-2 transition ${
                active
                  ? "bg-white/25 text-white"
                  : "text-white/75 hover:text-white"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.25 : 1.75}
                aria-hidden
              />
              <span className="truncate text-[11px] font-medium tracking-tight">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
