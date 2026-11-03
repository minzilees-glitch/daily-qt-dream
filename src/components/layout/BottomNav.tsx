"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Heart, Home, Trophy, UserRound } from "lucide-react";

const TABS = [
  { href: "/home", label: "홈", icon: Home },
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
      <div className="pointer-events-auto grid w-full max-w-[var(--phone-max)] grid-cols-5 gap-0.5 rounded-full bg-sky px-1.5 py-2 text-white shadow-none">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/home" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-full px-1 py-1.5 text-white transition ${
                active ? "bg-white/15" : "opacity-70 hover:opacity-100"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                size={18}
                strokeWidth={active ? 2.4 : 1.75}
                className="text-white"
                aria-hidden
              />
              <span
                className={`max-w-full truncate text-[10px] tracking-tight text-white ${
                  active ? "font-semibold" : "font-medium"
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
