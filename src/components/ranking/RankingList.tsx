import { Trophy } from "lucide-react";
import type { GroupRankRow } from "@/types";
import { LightCount } from "@/components/ui/LightIcon";

export const RANKING_MY_ROW_ID = "ranking-my-group";

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
    <div className="premium-rank-table" role="table" aria-label="순 랭킹">
      <div className="premium-rank-table__head" role="row">
        <span className="premium-rank-table__col-rank" role="columnheader">
          순위
        </span>
        <span className="premium-rank-table__col-name" role="columnheader">
          순
        </span>
        <span className="premium-rank-table__col-lights" role="columnheader">
          빛
        </span>
      </div>
      <ul className="premium-rank-table__body" role="rowgroup">
        {rows.map((row) => (
          <li
            key={row.groupId}
            id={row.isMine ? RANKING_MY_ROW_ID : undefined}
            role="row"
            className={`premium-rank-row ${row.isMine ? "premium-rank-row--mine" : ""}`}
          >
            <div className="premium-rank-table__col-rank" role="cell">
              <RankMark row={row} />
            </div>
            <div
              className="premium-rank-table__col-name flex min-w-0 items-center gap-1.5"
              role="cell"
            >
              <p
                className={`min-w-0 truncate type-body text-text-main ${
                  row.isMine ? "font-medium" : "font-bold"
                }`}
              >
                {row.groupName}
              </p>
              {row.isMine ? (
                <span className="premium-mine-pill">내 순</span>
              ) : null}
            </div>
            <div className="premium-rank-table__col-lights" role="cell">
              <LightCount
                lights={row.lights}
                size={18}
                className="justify-end"
                textClassName={
                  row.isMine
                    ? "type-body font-semibold"
                    : "type-body font-semibold text-text-main"
                }
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
