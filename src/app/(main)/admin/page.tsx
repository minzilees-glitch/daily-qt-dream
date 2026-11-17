"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Toast } from "@/components/ui/Toast";
import { LightCount } from "@/components/ui/LightIcon";
import { useApp } from "@/lib/app-context";
import {
  addMonths,
  currentYearMonth,
  TERM_14_LABEL,
} from "@/lib/dates";
import {
  buildCompletionSet,
  buildLightSet,
  userMonthStats,
  userTermLights,
} from "@/lib/stats";

type Tab = "batch" | "groups" | "users";

type UserLightRow = {
  userId: string;
  name: string;
  groupName: string;
  isLeader: boolean;
  monthLights: number;
  allLights: number;
  rank: number;
};

export default function AdminPage() {
  const {
    currentUser,
    users,
    groups,
    completions,
    assignUsersToGroup,
    setGroupLeader,
  } = useApp();
  const [tab, setTab] = useState<Tab>("batch");
  const [ym, setYm] = useState(currentYearMonth());
  const [toast, setToast] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [targetGroupId, setTargetGroupId] = useState(groups[0]?.id ?? "");

  const lightRows = useMemo(() => {
    const set = buildCompletionSet(completions);
    const lightSet = buildLightSet(completions);
    const raw = users.map((u) => {
      const month = userMonthStats(u.id, ym, set, lightSet);
      return {
        userId: u.id,
        name: u.name,
        groupName: groups.find((g) => g.id === u.groupId)?.name ?? "-",
        isLeader: !!u.isLeader,
        monthLights: month.lights,
        allLights: userTermLights(u.id, lightSet),
        rank: 0,
      } satisfies UserLightRow;
    });

    raw.sort((a, b) => {
      if (b.monthLights !== a.monthLights) return b.monthLights - a.monthLights;
      if (b.allLights !== a.allLights) return b.allLights - a.allLights;
      return a.name.localeCompare(b.name, "ko");
    });

    let lastMonth = Number.NaN;
    let lastRank = 0;
    raw.forEach((row, i) => {
      if (row.monthLights !== lastMonth) {
        lastRank = i + 1;
        lastMonth = row.monthLights;
      }
      row.rank = lastRank;
    });
    return raw;
  }, [users, groups, completions, ym]);

  const filteredLightRows = useMemo(() => {
    const q = userQuery.trim();
    if (!q) return lightRows;
    return lightRows.filter(
      (r) =>
        r.name.includes(q) ||
        r.groupName.includes(q) ||
        r.userId.includes(q),
    );
  }, [lightRows, userQuery]);

  if (!currentUser) return null;

  if (!currentUser.isAdmin) {
    return (
      <div className="premium-qt-root">
        <header className="premium-tab-header premium-tab-header--me">
          <h1 className="premium-tab-title">관리자</h1>
        </header>
        <section className="premium-qt-sheet">
          <p className="text-center type-body text-text-main">
            관리자만 접근할 수 있습니다.
          </p>
          <Link
            href="/me"
            className="mt-[var(--space-stack-sm)] block text-center type-body-sm font-semibold text-[var(--color-sky-deep)]"
          >
            마이페이지로
          </Link>
        </section>
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
    <div className="premium-qt-root">
      <header className="premium-tab-header premium-tab-header--me">
        <div className="flex items-center gap-2">
          <Link
            href="/me/settings"
            aria-label="계정 설정으로"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--sky-mode-ink)]"
          >
            <ArrowLeft size={20} strokeWidth={1.75} />
          </Link>
          <h1 className="premium-tab-title mb-0">관리자</h1>
        </div>
        <p className="qt-validation-hint type-caption mt-[var(--space-stack-sm)] text-text-secondary">
          순 배정은 관리자 일괄만 가능합니다.
        </p>
      </header>

      <section className="premium-qt-sheet">
        <div
          className="admin-tabs"
          role="tablist"
          aria-label="관리자 메뉴"
        >
          {(
            [
              ["batch", "일괄 배정"],
              ["groups", "순"],
              ["users", "유저 빛"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`admin-tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`admin-panel-${id}`}
              onClick={() => setTab(id)}
              className={`admin-tabs__btn${tab === id ? " is-active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "batch" ? (
          <div
            id="admin-panel-batch"
            role="tabpanel"
            aria-labelledby="admin-tab-batch"
            className="premium-panel animate-fade-up"
          >
            <h2 className="premium-panel-title">순 일괄 배정</h2>
            <p className="type-caption text-text-secondary">
              멤버가 스스로 순에 가입하지 않습니다. 아래에서 여러 명을 선택한 뒤
              목표 순으로 한 번에 배정합니다.
            </p>

            <label className="mt-[var(--space-stack-sm)] block type-caption text-text-secondary">
              배정할 순
              <select
                className="admin-field mt-1"
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

            <div className="mt-3">
              <PrimaryButton
                type="button"
                className="w-full"
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

            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={selectVisible}
                className="type-caption font-semibold text-[var(--color-sky-deep)]"
              >
                보이는 멤버 모두 선택
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="type-caption font-medium text-text-secondary"
              >
                선택 해제
              </button>
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이름 또는 순 검색"
              className="admin-field mt-[var(--space-stack-sm)]"
            />
            <p className="mt-2 type-caption text-text-secondary">
              전체 {users.length}명 · 검색 {filteredUsers.length}명 · 선택{" "}
              {selected.size}명
            </p>

            <ul className="admin-select-list mt-2">
              {filteredUsers.slice(0, 80).map((user) => {
                const gName =
                  groups.find((g) => g.id === user.groupId)?.name ?? "-";
                const checked = selected.has(user.id);
                return (
                  <li key={user.id}>
                    <label
                      className={`admin-select-row ${
                        checked ? "admin-select-row--on" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelect(user.id)}
                        className="h-5 w-5 accent-[var(--color-sky)]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate type-body font-semibold text-text-main">
                          {user.name}
                          {user.isLeader ? (
                            <span className="ml-2 type-caption font-medium text-[var(--color-sky-deep)]">
                              순장
                            </span>
                          ) : null}
                        </p>
                        <p className="type-caption text-text-secondary">
                          현재 {gName} · {user.id}
                        </p>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
            {filteredUsers.length > 80 ? (
              <p className="py-2 text-center type-caption text-text-secondary">
                상위 80명만 표시합니다. 검색으로 좁혀 주세요.
              </p>
            ) : null}
          </div>
        ) : null}

        {tab === "groups" ? (
          <div
            id="admin-panel-groups"
            role="tabpanel"
            aria-labelledby="admin-tab-groups"
            className="premium-panel animate-fade-up"
          >
            <p className="type-caption text-text-secondary">
              전체 {groups.length}개 순 · 멤버십은 일괄 배정 탭에서 관리
            </p>
            <ul className="admin-group-list mt-3">
              {groups.map((group) => {
                const members = users.filter((u) => u.groupId === group.id);
                return (
                  <li key={group.id} className="admin-group-row">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="type-body font-semibold text-text-main">
                        {group.name}
                      </p>
                      <p className="type-caption text-text-secondary">
                        {members.length}명
                      </p>
                    </div>
                    <label className="mt-2 block type-caption text-text-secondary">
                      순장 지정
                      <select
                        className="admin-field mt-1"
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
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {tab === "users" ? (
          <div
            id="admin-panel-users"
            role="tabpanel"
            aria-labelledby="admin-tab-users"
            className="premium-panel animate-fade-up"
          >
            <div className="mb-[var(--space-stack-sm)] flex items-center justify-between gap-3">
              <MonthPicker
                value={ym}
                onChange={setYm}
                min={addMonths(currentYearMonth(), -2)}
                max={currentYearMonth()}
                align="start"
              />
              <p className="shrink-0 type-caption font-medium text-text-secondary">
                {TERM_14_LABEL} 누적 = 전체
              </p>
            </div>
            <p className="mb-3 type-caption text-text-secondary">
              선택 달의 빛과 {TERM_14_LABEL} 전체 누적을 함께 봅니다. 순위는 해당
              달 빛 기준입니다.
            </p>
            <input
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="이름 또는 순 검색"
              className="admin-field mb-3"
            />

            <div className="admin-user-table" role="table" aria-label="유저 빛">
              <div className="admin-user-table__head" role="row">
                <span className="admin-user-table__rank" role="columnheader">
                  순위
                </span>
                <span className="admin-user-table__name" role="columnheader">
                  이름
                </span>
                <span className="admin-user-table__num" role="columnheader">
                  달
                </span>
                <span className="admin-user-table__num" role="columnheader">
                  전체
                </span>
              </div>
              <ul className="admin-user-table__body" role="rowgroup">
                {filteredLightRows.map((row) => (
                  <li
                    key={row.userId}
                    role="row"
                    className="admin-user-table__row"
                  >
                    <span className="admin-user-table__rank" role="cell">
                      {row.monthLights > 0 ? row.rank : "-"}
                    </span>
                    <div className="admin-user-table__name" role="cell">
                      <p className="truncate type-body font-semibold text-text-main">
                        {row.name}
                        {row.isLeader ? (
                          <span className="ml-1.5 type-caption font-medium text-[var(--color-sky-deep)]">
                            순장
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate type-caption text-text-secondary">
                        {row.groupName}
                      </p>
                    </div>
                    <div className="admin-user-table__num" role="cell">
                      <LightCount
                        lights={row.monthLights}
                        size={16}
                        className="justify-end"
                        textClassName="type-body-sm font-semibold text-text-main"
                      />
                    </div>
                    <div className="admin-user-table__num" role="cell">
                      <LightCount
                        lights={row.allLights}
                        size={16}
                        className="justify-end"
                        textClassName="type-body-sm font-semibold text-text-main"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {filteredLightRows.length === 0 ? (
              <p className="py-8 text-center type-body-sm text-text-secondary">
                검색 결과가 없습니다.
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <Toast message={toast} />
    </div>
  );
}
