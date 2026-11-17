"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { DARAKBANGS } from "@/lib/community/darakbang-roster";
import {
  adminAssignProfileToGroup,
  fetchPlacementQueueProfiles,
  fetchVerifiedLegalNames,
  type ProfileRow,
} from "@/lib/supabase/profile-repo";

type Tab = "placement" | "roster" | "users";

type UserLightRow = {
  userId: string;
  name: string;
  groupName: string;
  isLeader: boolean;
  monthLights: number;
  allLights: number;
  rank: number;
};

function placementLabel(profile: ProfileRow): string {
  if (profile.community_status === "exception") return "미배정 · 예외";
  if (profile.community_status === "verified" && !profile.group_id) {
    return "새가족";
  }
  return "순 미지정";
}

function displayName(profile: ProfileRow): string {
  return (
    profile.legal_name?.trim() ||
    profile.display_name?.trim() ||
    "이름 없음"
  );
}

export default function AdminPage() {
  const {
    currentUser,
    users,
    groups,
    completions,
    assignUserGroup,
    supabaseEnabled,
  } = useApp();
  const [tab, setTab] = useState<Tab>("roster");
  const [ym, setYm] = useState(currentYearMonth());
  const [toast, setToast] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState("");
  const [queue, setQueue] = useState<ProfileRow[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [assignDraft, setAssignDraft] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [joinedNames, setJoinedNames] = useState<Set<string>>(new Set());
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);
  /** Empty set = 「전체」 (show every 다락방). */
  const [rosterRoomIds, setRosterRoomIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [openSuns, setOpenSuns] = useState<Set<string>>(() => new Set());

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

  const loadQueue = useCallback(async () => {
    if (!supabaseEnabled) {
      setQueue([]);
      setQueueError("Supabase가 설정되지 않아 배정 대기 목록을 불러올 수 없어요.");
      return;
    }
    setQueueLoading(true);
    setQueueError(null);
    const res = await fetchPlacementQueueProfiles();
    setQueueLoading(false);
    if (!res.ok) {
      setQueue([]);
      setQueueError(res.error);
      return;
    }
    setQueue(res.data);
    setAssignDraft((prev) => {
      const next = { ...prev };
      for (const row of res.data) {
        if (!next[row.id]) next[row.id] = groups[0]?.id ?? "";
      }
      return next;
    });
  }, [supabaseEnabled, groups]);

  const loadJoinedNames = useCallback(async () => {
    if (!supabaseEnabled) {
      setJoinedNames(new Set());
      setRosterError("Supabase가 설정되지 않아 가입 여부를 불러올 수 없어요.");
      return;
    }
    setRosterLoading(true);
    setRosterError(null);
    const res = await fetchVerifiedLegalNames();
    setRosterLoading(false);
    if (!res.ok) {
      setJoinedNames(new Set());
      setRosterError(res.error);
      return;
    }
    setJoinedNames(new Set(res.data));
  }, [supabaseEnabled]);

  const rosterAllSelected = rosterRoomIds.size === 0;

  const visibleRosterRooms = useMemo(() => {
    if (rosterAllSelected) return DARAKBANGS;
    return DARAKBANGS.filter((d) => rosterRoomIds.has(d.id));
  }, [rosterAllSelected, rosterRoomIds]);

  const selectRosterAll = () => {
    setRosterRoomIds(new Set());
    setOpenSuns(new Set());
  };

  const toggleRosterRoom = (id: string) => {
    setRosterRoomIds((prev) => {
      // Leaving 「전체」: start with only this room.
      if (prev.size === 0) return new Set([id]);
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // None left → back to 「전체」.
      return next;
    });
    setOpenSuns(new Set());
  };

  const toggleSun = (key: string) => {
    setOpenSuns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const sunJoinCount = (names: string[]) => {
    const joined = names.filter((n) => joinedNames.has(n)).length;
    return { total: names.length, joined };
  };

  useEffect(() => {
    if (!currentUser?.isAdmin) return;
    void loadQueue();
    void loadJoinedNames();
  }, [currentUser?.isAdmin, loadQueue, loadJoinedNames]);

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

  const onAssign = async (profile: ProfileRow) => {
    const groupId = assignDraft[profile.id] || groups[0]?.id;
    if (!groupId) {
      showToast("배정할 순을 선택해 주세요.");
      return;
    }
    const groupName = groups.find((g) => g.id === groupId)?.name ?? "순";
    setBusyId(profile.id);
    const res = await adminAssignProfileToGroup(profile.id, groupId);
    setBusyId(null);
    if (!res.ok) {
      showToast(res.error);
      return;
    }
    assignUserGroup(profile.id, groupId);
    setQueue((prev) => prev.filter((p) => p.id !== profile.id));
    const legal = profile.legal_name?.trim();
    if (legal) {
      setJoinedNames((prev) => new Set(prev).add(legal));
    }
    showToast(`${displayName(profile)} → ${groupName} 배정 완료`);
  };

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
          명단 · 배정 대기 · 유저 별 빛을 관리합니다.
        </p>
      </header>

      <section className="premium-qt-sheet">
        <div className="admin-tabs" role="tablist" aria-label="관리자 메뉴">
          {(
            [
              ["roster", "명단"],
              ["placement", "배정 대기"],
              ["users", "유저 별 빛"],
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

        {tab === "placement" ? (
          <div
            id="admin-panel-placement"
            role="tabpanel"
            aria-labelledby="admin-tab-placement"
            className="premium-panel animate-fade-up"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="premium-panel-title">미배정 · 새가족</h2>
                <p className="type-caption text-text-secondary">
                  verify에서 순 없이 들어온 멤버를 실제 순에 배정합니다. 배정 시
                  역할은 순원으로 저장됩니다.
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 type-caption font-semibold text-[var(--color-sky-deep)]"
                onClick={() => void loadQueue()}
                disabled={queueLoading}
              >
                {queueLoading ? "불러오는 중…" : "새로고침"}
              </button>
            </div>

            {queueError ? (
              <p className="mt-3 type-caption font-semibold text-red-600">
                {queueError}
              </p>
            ) : null}

            {queueLoading && queue.length === 0 ? (
              <p className="py-8 text-center type-body-sm text-text-secondary">
                목록을 불러오는 중…
              </p>
            ) : null}

            {!queueLoading && !queueError && queue.length === 0 ? (
              <p className="py-8 text-center type-body-sm text-text-secondary">
                지금 배정 대기 중인 사람이 없어요.
              </p>
            ) : null}

            <ul className="admin-select-list mt-3">
              {queue.map((profile) => {
                const draft = assignDraft[profile.id] ?? groups[0]?.id ?? "";
                const busy = busyId === profile.id;
                return (
                  <li key={profile.id} className="admin-group-row">
                    <div className="min-w-0">
                      <p className="truncate type-body font-semibold text-text-main">
                        {displayName(profile)}
                      </p>
                      <p className="type-caption text-text-secondary">
                        {placementLabel(profile)}
                        {profile.display_name?.trim() &&
                        profile.legal_name?.trim() &&
                        profile.display_name.trim() !==
                          profile.legal_name.trim()
                          ? ` · 별명 ${profile.display_name.trim()}`
                          : ""}
                      </p>
                    </div>
                    <label className="mt-2 block type-caption text-text-secondary">
                      배정할 순
                      <select
                        className="admin-field mt-1"
                        value={draft}
                        disabled={busy || groups.length === 0}
                        onChange={(e) =>
                          setAssignDraft((prev) => ({
                            ...prev,
                            [profile.id]: e.target.value,
                          }))
                        }
                      >
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <PrimaryButton
                      type="button"
                      className="mt-2 w-full"
                      disabled={busy || !draft}
                      onClick={() => void onAssign(profile)}
                    >
                      {busy ? "배정 중…" : "이 순으로 배정"}
                    </PrimaryButton>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {tab === "roster" ? (
          <div
            id="admin-panel-roster"
            role="tabpanel"
            aria-labelledby="admin-tab-roster"
            className="premium-panel animate-fade-up"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="premium-panel-title mb-0">명단</h2>
              <button
                type="button"
                className="shrink-0 type-caption font-semibold text-[var(--color-sky-deep)]"
                onClick={() => void loadJoinedNames()}
                disabled={rosterLoading}
              >
                {rosterLoading ? "불러오는 중…" : "새로고침"}
              </button>
            </div>

            {rosterError ? (
              <p className="mt-3 type-caption font-semibold text-red-600">
                {rosterError}
              </p>
            ) : null}

            <div
              className="admin-roster-chips mt-4"
              role="group"
              aria-label="다락방 필터"
            >
              <button
                type="button"
                aria-pressed={rosterAllSelected}
                className={`admin-roster-chip${rosterAllSelected ? " is-active" : ""}`}
                onClick={selectRosterAll}
              >
                전체
              </button>
              {DARAKBANGS.map((room) => {
                const active =
                  !rosterAllSelected && rosterRoomIds.has(room.id);
                return (
                  <button
                    key={room.id}
                    type="button"
                    aria-pressed={active}
                    className={`admin-roster-chip${active ? " is-active" : ""}`}
                    onClick={() => toggleRosterRoom(room.id)}
                  >
                    {room.name.replace(/\s*다락방\s*$/, "")}
                  </button>
                );
              })}
            </div>

            {rosterLoading ? (
              <p className="mt-3 type-caption text-text-secondary">
                가입 현황 불러오는 중…
              </p>
            ) : null}

            <div className="mt-4 space-y-5">
              {visibleRosterRooms.map((room) => (
                <section key={room.id}>
                  <h3 className="type-body font-bold text-text-main">
                    {room.name}
                  </h3>
                  <ul className="admin-roster-accordion mt-2">
                    {room.suns.map((sun) => {
                      const sunKey = `${room.id}:${sun.groupName}`;
                      const open = openSuns.has(sunKey);
                      const counts = sunJoinCount(sun.memberNames);
                      return (
                        <li key={sunKey} className="admin-roster-acc">
                          <button
                            type="button"
                            className="admin-roster-acc__head"
                            aria-expanded={open}
                            onClick={() => toggleSun(sunKey)}
                          >
                            <span className="type-body font-semibold text-text-main">
                              {sun.groupName}
                            </span>
                            <span className="type-caption text-text-secondary">
                              {sun.memberNames.length === 0
                                ? "자유 입력"
                                : `가입 ${counts.joined}/${counts.total}`}
                              <span
                                className="admin-roster-acc__chev"
                                aria-hidden
                              >
                                {open ? "▾" : "▸"}
                              </span>
                            </span>
                          </button>
                          {open ? (
                            <div className="admin-roster-acc__body">
                              {sun.memberNames.length === 0 ? (
                                <p className="type-body-sm text-text-secondary">
                                  고정 명단 없음 · verify에서 본명을 직접
                                  입력합니다.
                                </p>
                              ) : (
                                <ul className="admin-roster-members">
                                  {sun.memberNames.map((name) => {
                                    const joined = joinedNames.has(name);
                                    return (
                                      <li
                                        key={name}
                                        className="admin-roster-member"
                                      >
                                        <span className="type-body font-semibold text-text-main">
                                          {name}
                                        </span>
                                        <span
                                          className={`type-caption font-semibold ${
                                            joined
                                              ? "text-[var(--color-sky-deep)]"
                                              : "text-text-secondary"
                                          }`}
                                        >
                                          {joined ? "가입" : "미가입"}
                                        </span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
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
                {TERM_14_LABEL} 누적
              </p>
            </div>
            <p className="mb-3 type-caption text-text-secondary">
              선택 월의 빛과 {TERM_14_LABEL} 전체 누적을 함께 봅니다. 순위는 해당
              월 빛 기준입니다.
            </p>
            <input
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="이름 또는 순 검색"
              className="admin-field mb-3"
            />

            <div className="admin-user-table" role="table" aria-label="유저 별 빛">
              <div className="admin-user-table__head" role="row">
                <span className="admin-user-table__rank" role="columnheader">
                  순위
                </span>
                <span className="admin-user-table__name" role="columnheader">
                  이름
                </span>
                <span className="admin-user-table__num" role="columnheader">
                  월
                </span>
                <span
                  className="admin-user-table__num admin-user-table__num--all"
                  role="columnheader"
                >
                  14기 전체
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
                        className="justify-start"
                        textClassName="type-body-sm font-semibold text-text-main"
                      />
                    </div>
                    <div
                      className="admin-user-table__num admin-user-table__num--all"
                      role="cell"
                    >
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
