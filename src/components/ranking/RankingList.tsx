import { Trophy } from "lucide-react";
import type { GroupRankRow } from "@/types";
import { formatLights } from "@/lib/stats";

export function RankingList({ rows }: { rows: GroupRankRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-text-secondary">
        표시할 랭킹이 없습니다.
      </p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li
          key={row.groupId}
          className={`flex items-center gap-3 rounded-[22px] px-4 py-3.5 transition ${
            row.isMine
              ? "bg-sky-light ring-1 ring-sky/40"
              : "bg-ivory shadow-none"
          }`}
        >
          <div className="flex w-10 flex-col items-center">
            {row.rank === 1 ? (
              <Trophy size={18} className="text-sky" strokeWidth={1.75} aria-label="1위" />
            ) : (
              <span className="text-sm font-semibold text-text-secondary">
                {row.rank}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-text-main">
              {row.groupName}
              {row.isMine ? (
                <span className="ml-2 text-xs font-medium text-sky">내 순</span>
              ) : null}
            </p>
            <p className="mt-0.5 text-xs text-text-secondary">
              {row.memberCount}명 · 집계 {row.possibleCount}일
            </p>
          </div>
          <p className="shrink-0 text-[15px] font-semibold text-text-main">
            {formatLights(row.lights)}
          </p>
        </li>
      ))}
    </ul>
  );
}
