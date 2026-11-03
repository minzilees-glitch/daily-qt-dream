"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { SoftCard } from "@/components/ui/SoftCard";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Toast } from "@/components/ui/Toast";
import { RankingList } from "@/components/ranking/RankingList";
import { useApp } from "@/lib/app-context";
import {
  addMonths,
  currentYearMonth,
  formatMonthLabel,
} from "@/lib/dates";
import { computeGroupRanking, formatRate } from "@/lib/stats";

type Tab = "batch" | "groups" | "awards";

export default function AdminPage() {
  const {
    currentUser,
    users,
    groups,
    completions,
    awards,
    assignUsersToGroup,
    setGroupLeader,
    confirmAward,
  } = useApp();
  const [tab, setTab] = useState<Tab>("batch");
  const [ym, setYm] = useState(currentYearMonth());
  const [toast, setToast] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [targetGroupId, setTargetGroupId] = useState(groups[0]?.id ?? "");

  const ranking = useMemo(
    () => computeGroupRanking(groups, users, completions, ym),
    [groups, users, completions, ym],
  );

  if (!currentUser) return null;

  if (!currentUser.isAdmin) {
    return (
      <div className="px-5 pt-10 text-center">
        <p className="text-text-main">관리자만 접근할 수 있습니다.</p>
        <Link href="/me" className="mt-4 inline-block text-sky">
          마이페이지로
        </Link>
      </div>
    );
  }

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.includes(query.trim()) ||
      u.id.includes(query.trim()) ||
      groups.find((g) => g.id === u.groupId)?.name.includes(query.trim()),
  );

  const awardForMonth = awards.find((a) => a.yearMonth === ym);
  const top = ranking[0];
  const targetGroup =
    groups.find((g) => g.id === targetGroupId) ?? groups[0];

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectVisible = () => {
    setSelected(new Set(filteredUsers.slice(0, 80).map((u) => u.id)));
  };

  const clearSelection = () => setSelected(new Set());

  return (
    <div className="px-5 pt-[calc(16px+var(--safe-top))]">
      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/me"
          aria-label="뒤로"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-ivory shadow-[var(--shadow-soft)]"
        >
          <ArrowLeft size={18} strokeWidth={1.75} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-text-main">관리자</h1>
          <p className="text-xs text-text-secondary">
            Mock UI · 순 배정은 관리자 일괄만 가능
          </p>
        </div>
      </div>

      <div className="mb-5 flex gap-2 rounded-full bg-ivory p-1 shadow-[var(--shadow-soft)]">
        {(
          [
            ["batch", "일괄 배정"],
            ["groups", "순"],
            ["awards", "시상"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 rounded-full px-3 py-2.5 text-sm font-semibold transition ${
              tab === id ? "bg-sky text-white" : "text-text-secondary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "batch" ? (
        <div className="animate-fade-up space-y-4">
          <SoftCard padding="p-4">
            <p className="text-sm font-semibold text-text-main">순 일괄 배정</p>
            <p className="mt-1 text-xs leading-relaxed text-text-secondary">
              멤버가 스스로 순에 가입하지 않습니다. 관리자가 아래에서 여러 명을
              선택한 뒤 목표 순으로 한 번에 배정합니다.
            </p>
            <label className="mt-4 block text-xs text-text-secondary">
              배정할 순
              <select
                className="mt-1 w-full rounded-xl bg-sky-light px-3 py-2.5 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-sky"
                value={targetGroup?.id ?? ""}
                onChange={(e) => setTargetGroupId(e.target.value)}
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <PrimaryButton
                type="button"
                className="flex-1"
                disabled={selected.size === 0 || !targetGroup}
                onClick={() => {
                  if (!targetGroup) return;
                  assignUsersToGroup([...selected], targetGroup.id);
                  showToast(
                    `${selected.size}명을 ${targetGroup.name}으로 배정했습니다.`,
                  );
                  clearSelection();
                }}
              >
                선택 {selected.size}명 → {targetGroup?.name ?? "순"} 배정
              </PrimaryButton>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={selectVisible}
                className="text-xs font-medium text-sky"
              >
                보이는 멤버 모두 선택
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="text-xs font-medium text-text-secondary"
              >
                선택 해제
              </button>
            </div>
          </SoftCard>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름 또는 순 검색"
            className="w-full rounded-[18px] border-0 bg-ivory px-4 py-3 text-sm shadow-[var(--shadow-soft)] focus:outline-none focus:ring-2 focus:ring-sky"
          />
          <p className="text-xs text-text-secondary">
            전체 {users.length}명 · 검색 {filteredUsers.length}명 · 선택{" "}
            {selected.size}명
          </p>
          <ul className="space-y-2">
            {filteredUsers.slice(0, 80).map((user) => {
              const gName =
                groups.find((g) => g.id === user.groupId)?.name ?? "-";
              const checked = selected.has(user.id);
              return (
                <li key={user.id}>
                  <label
                    className={`soft-card flex cursor-pointer items-center gap-3 p-4 transition ${
                      checked ? "ring-1 ring-sky/50" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelect(user.id)}
                      className="h-5 w-5 accent-[var(--sky)]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-text-main">
                        {user.name}
                        {user.isLeader ? (
                          <span className="ml-2 text-[11px] font-medium text-sky">
                            순장
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-text-secondary">
                        현재 {gName} · {user.id}
                      </p>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
          {filteredUsers.length > 80 ? (
            <p className="py-2 text-center text-xs text-text-secondary">
              상위 80명만 표시합니다. 검색으로 좁혀 주세요.
            </p>
          ) : null}
        </div>
      ) : null}

      {tab === "groups" ? (
        <div className="animate-fade-up space-y-3">
          <p className="text-xs text-text-secondary">
            전체 {groups.length}개 순 · 멤버십은 일괄 배정 탭에서 관리
          </p>
          {groups.map((group) => {
            const members = users.filter((u) => u.groupId === group.id);
            return (
              <SoftCard key={group.id} padding="p-4">
                <p className="font-semibold text-text-main">{group.name}</p>
                <p className="text-xs text-text-secondary">{members.length}명</p>
                <label className="mt-3 block text-xs text-text-secondary">
                  순장 지정
                  <select
                    className="mt-1 w-full rounded-xl bg-sky-light px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-sky"
                    value={group.leaderId}
                    onChange={(e) => {
                      setGroupLeader(group.id, e.target.value);
                      showToast(`${group.name} 순장을 변경했습니다.`);
                    }}
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </label>
              </SoftCard>
            );
          })}
        </div>
      ) : null}

      {tab === "awards" ? (
        <div className="animate-fade-up space-y-4">
          <SoftCard className="space-y-3">
            <MonthPicker
              value={ym}
              onChange={setYm}
              min={addMonths(currentYearMonth(), -2)}
              max={currentYearMonth()}
            />
            <div className="rounded-[18px] bg-sky-light px-4 py-4">
              <div className="flex items-center gap-2 text-sky">
                <Trophy size={18} strokeWidth={1.75} />
                <p className="text-sm font-semibold">
                  {formatMonthLabel(ym)} 1위 후보
                </p>
              </div>
              <p className="mt-2 text-lg font-bold text-text-main">
                {top?.groupName ?? "-"}
              </p>
              <p className="text-sm text-text-secondary">
                참여율 {formatRate(top?.rate ?? 0)} · 완료{" "}
                {top?.completionCount ?? 0}/{top?.possibleCount ?? 0}
              </p>
            </div>
            <PrimaryButton
              type="button"
              className="w-full"
              disabled={!top}
              onClick={() => {
                if (!top) return;
                confirmAward(ym, top.groupId, top.rate);
                showToast(`${formatMonthLabel(ym)} 시상을 확정했습니다.`);
              }}
            >
              1위 시상 확정 (Mock)
            </PrimaryButton>
            {awardForMonth ? (
              <p className="text-center text-xs text-text-secondary">
                확정됨:{" "}
                {groups.find((g) => g.id === awardForMonth.groupId)?.name} (
                {formatRate(awardForMonth.rate)})
              </p>
            ) : (
              <p className="text-center text-xs text-text-secondary">
                아직 확정된 시상이 없습니다.
              </p>
            )}
          </SoftCard>

          <div>
            <h2 className="mb-3 text-[16px] font-semibold">월간 랭킹</h2>
            <RankingList rows={ranking} />
          </div>
        </div>
      ) : null}

      <Toast message={toast} />
    </div>
  );
}
