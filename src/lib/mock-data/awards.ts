import type { Group, MonthlyAward, User } from "@/types";
import { addMonths, currentYearMonth } from "@/lib/dates";
import { computeGroupRanking } from "@/lib/stats";
import type { QtCompletion } from "@/types";

export function buildAwards(
  groups: Group[],
  users: User[],
  completions: QtCompletion[],
): MonthlyAward[] {
  const ym = currentYearMonth();
  const pastMonths = [addMonths(ym, -2), addMonths(ym, -1)];

  return pastMonths.map((yearMonth) => {
    const ranking = computeGroupRanking(groups, users, completions, yearMonth);
    const top = ranking[0];
    return {
      yearMonth,
      groupId: top?.groupId ?? groups[0]!.id,
      rate: top?.rate ?? 0,
      confirmed: true,
    };
  });
}
