import { Crown } from "lucide-react";
import { StatLabel } from "@/components/ui/StatLabel";
import type { User } from "@/types";

export function MemberList({
  items,
}: {
  items: { user: User; days: number }[];
}) {
  return (
    <ul className="space-y-2">
      {items.map(({ user, days }) => (
        <li
          key={user.id}
          className="flex items-center justify-between rounded-[20px] bg-ivory px-4 py-3 shadow-none"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-light text-sm font-semibold text-sky">
              {user.name.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate text-[15px] font-semibold text-text-main">
                {user.name}
                {user.isLeader ? (
                  <Crown size={14} className="shrink-0 text-sky" aria-label="순장" />
                ) : null}
              </p>
              <StatLabel className="text-text-secondary">이번 달 QT</StatLabel>
            </div>
          </div>
          <p className="text-[15px] font-semibold text-text-main">{days}일</p>
        </li>
      ))}
    </ul>
  );
}
