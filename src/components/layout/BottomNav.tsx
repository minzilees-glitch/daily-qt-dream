"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Heart, Home, Trophy, UserRound } from "lucide-react";

const TABS = [
  { href: "/home", label: "오늘의 QT", icon: Home },
  { href: "/history", label: "나의 QT", icon: BookOpen },
  { href: "/group", label: "우리 순", icon: Heart },
  { href: "/ranking", label: "랭킹", icon: Trophy },
  { href: "/me", label: "마이페이지", icon: UserRound },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="하단 메뉴"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(10px+var(--safe-bottom))]"
    >
      <div
        className="pointer-events-auto grid w-full max-w-[var(--phone-max)] grid-cols-5 gap-0.5 rounded-full px-1.5 py-2 text-white opacity-100 shadow-[0_10px_30px_rgba(0,60,130,0.42)]"
        style={{ backgroundColor: "#008CFF" }}
      >
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/home" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-full px-1 py-1.5 transition ${
                active ? "bg-white/15" : "hover:bg-white/10"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                size={18}
                strokeWidth={active ? 2.4 : 1.75}
                className={active ? "text-white" : "text-white/70"}
                aria-hidden
              />
              <span
                className={`max-w-full truncate text-[11px] tracking-tight ${
                  active
                    ? "font-bold text-white"
                    : "font-semibold text-white/70"
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
