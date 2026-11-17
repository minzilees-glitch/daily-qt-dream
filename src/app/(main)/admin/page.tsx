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
  const [tab, setTab] = useState<Tab>("placement");
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
  const [rosterQuery, setRosterQuery] = useState("");

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

  const filteredDarakbangs = useMemo(() => {
    const q = rosterQuery.trim();
    if (!q) return DARAKBANGS;
    return DARAKBANGS.map((room) => {
      const suns = room.suns
        .map((sun) => {
          const members = sun.memberNames.filter(
            (name) =>
              name.includes(q) ||
              sun.groupName.includes(q) ||
              room.name.includes(q),
          );
          if (
            room.name.includes(q) ||
            sun.groupName.includes(q) ||
            members.length > 0
          ) {
            return {
              ...sun,
              memberNames:
                room.name.includes(q) || sun.groupName.includes(q)
                  ? sun.memberNames
                  : members,
            };
          }
          return null;
        })
        .filter((s): s is (typeof room.suns)[number] => s !== null);
      return suns.length > 0 ? { ...room, suns } : null;
    }).filter((r): r is (typeof DARAKBANGS)[number] => r !== null);
  }, [rosterQuery]);

  const rosterJoinedCount = useMemo(() => {
    let total = 0;
    let joined = 0;
    for (const room of DARAKBANGS) {
      for (const sun of room.suns) {
        for (const name of sun.memberNames) {
          total += 1;
          if (joinedNames.has(name)) joined += 1;
        }
      }
    }
    return { total, joined };
  }, [joinedNames]);

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
          배정 대기 · 명단 가입 현황 · 유저 빛을 관리합니다.
        </p>
      </header>

      <section className="premium-qt-sheet">
        <div className="admin-tabs" role="tablist" aria-label="관리자 메뉴">
          {(
            [
              ["placement", "배정 대기"],
              ["roster", "명단"],
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
              <div>
                <h2 className="premium-panel-title">다락방 · 순 · 명단</h2>
                <p className="type-caption text-text-secondary">
                  정식 명단 기준입니다. 가입은 본명 인증(
                  <span className="font-semibold">verified</span>)과 일치할 때
                  표시됩니다.
                </p>
                <p className="mt-1 type-caption text-text-secondary">
                  가입 {rosterJoinedCount.joined} / 명단{" "}
                  {rosterJoinedCount.total}
                  {rosterLoading ? " · 불러오는 중…" : ""}
                </p>
              </div>
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

            <input
              value={rosterQuery}
              onChange={(e) => setRosterQuery(e.target.value)}
              placeholder="다락방 · 순 · 본명 검색"
              className="admin-field mt-3 mb-3"
            />

            <div className="space-y-5">
              {filteredDarakbangs.map((room) => (
                <section key={room.id} className="admin-roster-room">
                  <h3 className="type-body font-bold text-text-main">
                    {room.name}
                  </h3>
                  <ul className="admin-group-list mt-2">
                    {room.suns.map((sun) => (
                      <li key={`${room.id}-${sun.groupName}`} className="admin-group-row">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="type-body font-semibold text-text-main">
                            {sun.groupName}
                          </p>
                          <p className="type-caption text-text-secondary">
                            {sun.memberNames.length === 0
                              ? "자유 입력"
                              : `${sun.memberNames.filter((n) => joinedNames.has(n)).length}/${sun.memberNames.length} 가입`}
                          </p>
                        </div>
                        {sun.memberNames.length === 0 ? (
                          <p className="mt-2 type-caption text-text-secondary">
                            명단 없음 · verify에서 본명을 직접 입력합니다.
                          </p>
                        ) : (
                          <ul className="mt-2 space-y-1.5">
                            {sun.memberNames.map((name) => {
                              const joined = joinedNames.has(name);
                              return (
                                <li
                                  key={`${sun.groupName}-${name}`}
                                  className="flex items-center justify-between gap-2"
                                >
                                  <span className="type-body-sm font-medium text-text-main">
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
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            {filteredDarakbangs.length === 0 ? (
              <p className="py-8 text-center type-body-sm text-text-secondary">
                검색 결과가 없습니다.
              </p>
            ) : null}
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

            <div className="admin-user-table" role="table" aria-label="유저 빛">
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
