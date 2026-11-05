import { Crown } from "lucide-react";
import type { User } from "@/types";

const DAY_HEADERS = ["월", "화", "수", "목", "금", "토", "일"] as const;

export function WeekParticipationTable({
  rows,
}: {
  rows: { user: User; days: boolean[]; count: number }[];
}) {
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center type-body-sm text-text-secondary">
        이번 주 참여 데이터가 아직 없습니다.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[20rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-divider">
            <th className="py-2 pr-2 type-caption font-semibold text-text-secondary">
              순원
            </th>
            {DAY_HEADERS.map((d) => (
              <th
                key={d}
                className="px-0.5 py-2 text-center type-caption font-semibold text-text-secondary"
              >
                {d}
              </th>
            ))}
            <th className="py-2 pl-2 text-right type-caption font-semibold text-text-secondary">
              합
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ user, days, count }) => (
            <tr key={user.id} className="border-b border-divider/70 last:border-0">
              <td className="py-2.5 pr-2">
                <span className="inline-flex max-w-[6.5rem] items-center gap-1 truncate type-body-sm font-semibold text-text-main">
                  {user.name}
                  {user.isLeader ? (
                    <Crown
                      size={12}
                      className="shrink-0 text-sky"
                      aria-label="순장"
                    />
                  ) : null}
                </span>
              </td>
              {days.map((done, i) => (
                <td
                  key={`${user.id}-${i}`}
                  className="px-0.5 py-2.5 text-center type-body-sm tabular-nums"
                >
                  <span
                    className={
                      done ? "font-semibold text-sky" : "text-text-secondary/45"
                    }
                  >
                    {done ? "○" : "·"}
                  </span>
                </td>
              ))}
              <td className="py-2.5 pl-2 text-right type-body-sm font-semibold tabular-nums text-text-main">
                {count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
