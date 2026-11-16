import { Trophy } from "lucide-react";
import type { GroupRankRow } from "@/types";
import { LightCount } from "@/components/ui/LightIcon";

function RankMark({ row }: { row: GroupRankRow }) {
  // No place when the 순 has zero lights/completions.
  if (row.lights <= 0) {
    return (
      <span className="type-body-sm font-semibold text-text-secondary" aria-label="순위 없음">
        -
      </span>
    );
  }

  // Competition ranking: tied 순 share the same rank → same medal.
  if (row.rank === 1) {
    return (
      <Trophy
        size={22}
        strokeWidth={1.75}
        className="text-[var(--medal-gold)]"
        aria-label="1위"
      />
    );
  }
  if (row.rank === 2) {
    return (
      <Trophy
        size={22}
        strokeWidth={1.75}
        className="text-[var(--medal-silver)]"
        aria-label="2위"
      />
    );
  }
  if (row.rank === 3) {
    return (
      <Trophy
        size={22}
        strokeWidth={1.75}
        className="text-[var(--medal-bronze)]"
        aria-label="3위"
      />
    );
  }

  return (
    <span className="type-body-sm font-semibold text-text-secondary">
      {row.rank}
    </span>
  );
}

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
          className={`premium-rank-row ${row.isMine ? "premium-rank-row--mine" : ""}`}
        >
          <div className="flex w-10 flex-col items-center">
            <RankMark row={row} />
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <p className="min-w-0 truncate type-body font-bold text-text-main">
              {row.groupName}
            </p>
            {row.isMine ? (
              <span className="premium-mine-pill">내 순</span>
            ) : null}
          </div>
          <LightCount lights={row.lights} size={18} />
        </li>
      ))}
    </ul>
  );
}
