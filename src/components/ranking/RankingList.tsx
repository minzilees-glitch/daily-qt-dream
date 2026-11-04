import { Trophy } from "lucide-react";
import type { GroupRankRow } from "@/types";
import { LightCount } from "@/components/ui/LightIcon";

export function RankingList({ rows }: { rows: GroupRankRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-10 text-center type-body-sm text-text-secondary">
        표시할 랭킹이 없습니다.
      </p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li
          key={row.groupId}
          className={`flex items-center gap-3 rounded-[var(--radius-md)] px-4 py-5 transition ${
            row.isMine
              ? "bg-sky/20 ring-1 ring-sky/20"
              : "bg-ivory shadow-none"
          }`}
        >
          <div className="flex w-10 flex-col items-center">
            {row.rank === 1 ? (
              <Trophy
                size={22}
                strokeWidth={1.75}
                color="var(--medal-gold)"
                aria-label="1위"
              />
            ) : row.rank === 2 ? (
              <Trophy
                size={22}
                strokeWidth={1.75}
                color="var(--medal-silver)"
                aria-label="2위"
              />
            ) : (
              <span className="type-body-sm font-semibold text-text-secondary">
                {row.rank}
              </span>
            )}
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <p className="min-w-0 truncate type-body font-semibold text-text-main">
              {row.groupName}
            </p>
            {row.isMine ? (
              <span className="inline-flex shrink-0 items-center rounded-full bg-sky px-1.5 py-0.5 type-nav font-bold leading-none text-white">
                내 순
              </span>
            ) : null}
          </div>
          <LightCount lights={row.lights} size={18} />
        </li>
      ))}
    </ul>
  );
}
