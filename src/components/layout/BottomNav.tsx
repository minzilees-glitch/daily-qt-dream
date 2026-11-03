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

/** Pinned to the bottom of `.phone-shell` (viewport on mobile, phone frame on desktop). */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="하단 메뉴"
      className="pointer-events-none z-40 w-full shrink-0"
    >
      <div className="pointer-events-auto grid w-full grid-cols-4 bg-sky pb-[var(--safe-bottom)] shadow-none">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/home" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 py-3 text-white transition ${
                active ? "bg-white/15" : "opacity-70 hover:opacity-100"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.4 : 1.75}
                className="text-white"
                aria-hidden
              />
              <span
                className={`truncate text-[11px] tracking-tight text-white ${
                  active
                    ? "font-semibold underline decoration-white/80 underline-offset-4"
                    : "font-medium"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
