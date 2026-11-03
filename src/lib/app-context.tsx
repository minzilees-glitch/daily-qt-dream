"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type {
  Group,
  MonthlyAward,
  QtCompletion,
  QtEntry,
  QtEntryFields,
  User,
} from "@/types";
import {
  getMockData,
  getTestUser,
  TEST_USER_ID,
} from "@/lib/mock-data";
import { isFutureDate } from "@/lib/dates";
import { loadJson, removeKey, saveJson } from "@/lib/storage";
import {
  normalizeEntry,
  trimFields,
  validationMessage,
} from "@/lib/qt-entry";
import {
  clearAvatar,
  dataUrlToBlob,
  fetchProfileAvatarMap,
  uploadAndSaveAvatar,
} from "@/lib/supabase/avatar-repo";
import {
  deleteQtEntry,
  fetchQtPresence,
  fetchUserQtEntries,
  isSupabaseConfigured,
  upsertQtEntry,
} from "@/lib/supabase/qt-repo";

interface AppState {
  ready: boolean;
  currentUser: User | null;
  groups: Group[];
  users: User[];
  completions: QtCompletion[];
  reflections: QtEntry[];
  awards: MonthlyAward[];
  /** True when NEXT_PUBLIC_SUPABASE_* is set. */
  supabaseEnabled: boolean;
  loginAsTestUser: () => void;
  logout: () => void;
  /** Save QT entry; marks day complete if valid. */
  saveEntry: (
    date: string,
    fields: QtEntryFields,
  ) => Promise<{ ok: boolean; message: string }>;
  /** Clear entry and uncomplete the day. */
  clearEntry: (date: string) => Promise<{ ok: boolean; message: string }>;
  assignUserGroup: (userId: string, groupId: string) => void;
  /** Admin batch assign — membership is admin-managed only. */
  assignUsersToGroup: (userIds: string[], groupId: string) => void;
  setGroupLeader: (groupId: string, userId: string) => void;
  confirmAward: (yearMonth: string, groupId: string, lights: number) => void;
  /**
   * Save profile photo for the current user.
   * Optimistic local map first; when Supabase is configured, also uploads to
   * Storage (`avatars/{userId}/avatar.*`) and updates `profiles.avatar_url`.
   */
  setAvatarUrl: (
    dataUrl: string | null,
  ) => Promise<{ ok: boolean; message: string }>;
  isCompleted: (userId: string, date: string) => boolean;
  getReflection: (userId: string, date: string) => QtEntry | undefined;
  getEntry: (userId: string, date: string) => QtEntry | undefined;
  /** Date just marked complete — drives one-shot light ray burst. */
  lastEarnedDate: string | null;
}

const AppContext = createContext<AppState | null>(null);

const SESSION_KEY = "session-user-id";
const OVERRIDES_KEY = "qt-overrides-v2";

interface Overrides {
  /** Used when Supabase env is missing (local fallback). */
  completions: QtCompletion[];
  reflections: QtEntry[];
  userGroupMap: Record<string, string>;
  leaderMap: Record<string, string>;
  awards: MonthlyAward[];
  /** Profile photo data URLs keyed by user id. */
  avatarMap: Record<string, string>;
}

const emptyOverrides = (): Overrides => ({
  completions: [],
  reflections: [],
  userGroupMap: {},
  leaderMap: {},
  awards: [],
  avatarMap: {},
});

type StoreSnapshot = {
  sessionUserId: string | null;
  overrides: Overrides;
  version: number;
};

const SERVER_SNAP: StoreSnapshot = {
  sessionUserId: null,
  overrides: emptyOverrides(),
  version: 0,
};

let clientSnap: StoreSnapshot = SERVER_SNAP;
let version = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function readFresh(): StoreSnapshot {
  version += 1;
  const raw = loadJson<Overrides>(OVERRIDES_KEY, emptyOverrides());
  clientSnap = {
    sessionUserId: loadJson<string | null>(SESSION_KEY, null),
    overrides: {
      ...raw,
      reflections: (raw.reflections ?? []).map((r) =>
        normalizeEntry(r as QtEntry & { content?: string }),
      ),
    },
    version,
  };
  return clientSnap;
}

function getSnapshot(): StoreSnapshot {
  return clientSnap;
}

function getServerSnapshot(): StoreSnapshot {
  return SERVER_SNAP;
}

function subscribe(listener: () => void) {
  if (clientSnap === SERVER_SNAP) {
    readFresh();
  }
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (!e.key || e.key.startsWith("daily-qt:")) {
      readFresh();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function writeSession(id: string | null) {
  if (id) saveJson(SESSION_KEY, id);
  else removeKey(SESSION_KEY);
  readFresh();
  emit();
}

function writeOverrides(next: Overrides) {
  saveJson(OVERRIDES_KEY, next);
  readFresh();
  emit();
}

const READY_TRUE = true;
const READY_FALSE = false;

function subscribeReady() {
  return () => {};
}
function getReadySnapshot() {
  return READY_TRUE;
}
function getReadyServerSnapshot() {
  return READY_FALSE;
}

type RemoteQt = {
  /** Full entries for the logged-in user. */
  myEntries: QtEntry[];
  /** Presence for light counts (all users that have rows in Supabase). */
  presence: QtCompletion[];
  loadedFor: string | null;
};

const EMPTY_REMOTE: RemoteQt = {
  myEntries: [],
  presence: [],
  loadedFor: null,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const clientReady = useSyncExternalStore(
    subscribeReady,
    getReadySnapshot,
    getReadyServerSnapshot,
  );

  const sessionUserId = snap.sessionUserId;
  const overrides = snap.overrides;
  const base = useMemo(() => getMockData(), []);
  const supabaseEnabled = isSupabaseConfigured();

  const [remoteQt, setRemoteQt] = useState<RemoteQt>(EMPTY_REMOTE);
  const [remoteAvatars, setRemoteAvatars] = useState<Record<string, string>>(
    {},
  );
  const [lastEarnedDate, setLastEarnedDate] = useState<string | null>(null);
  const [remoteTick, setRemoteTick] = useState(0);

  useEffect(() => {
    if (!supabaseEnabled || !sessionUserId) return;
    let cancelled = false;
    (async () => {
      const [mine, presence, avatars] = await Promise.all([
        fetchUserQtEntries(sessionUserId),
        fetchQtPresence(),
        fetchProfileAvatarMap(),
      ]);
      if (cancelled) return;
      setRemoteQt({
        myEntries: mine.ok ? mine.data : [],
        presence: presence.ok ? presence.data : [],
        loadedFor: sessionUserId,
      });
      if (avatars.ok) setRemoteAvatars(avatars.data);
      setRemoteTick((t) => t + 1);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabaseEnabled, sessionUserId]);

  const remoteReady =
    supabaseEnabled &&
    !!sessionUserId &&
    remoteQt.loadedFor === sessionUserId;

  const users = useMemo(() => {
    return base.users.map((u) => {
      const groupId = overrides.userGroupMap[u.id] ?? u.groupId;
      const isLeader =
        (overrides.leaderMap[groupId] ??
          base.groups.find((g) => g.id === groupId)?.leaderId) === u.id;
      // Local optimistic / offline → remote profiles.avatar_url → mock
      const avatarUrl =
        overrides.avatarMap?.[u.id] ??
        remoteAvatars[u.id] ??
        u.avatarUrl ??
        null;
      return { ...u, groupId, isLeader, avatarUrl };
    });
  }, [
    base,
    overrides.userGroupMap,
    overrides.leaderMap,
    overrides.avatarMap,
    remoteAvatars,
  ]);

  const groups = useMemo(() => {
    return base.groups.map((g) => ({
      ...g,
      leaderId: overrides.leaderMap[g.id] ?? g.leaderId,
    }));
  }, [base.groups, overrides.leaderMap]);

  const completionMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const c of base.completions) {
      map.set(`${c.userId}|${c.date}`, c.completed);
    }

    if (remoteReady) {
      // Prefer Supabase presence for light counts; clear mock days for the
      // logged-in user so lights = their real qt_entries only.
      if (sessionUserId) {
        for (const key of [...map.keys()]) {
          if (key.startsWith(`${sessionUserId}|`)) map.delete(key);
        }
      }
      for (const c of remoteQt.presence) {
        map.set(`${c.userId}|${c.date}`, c.completed);
      }
    } else if (!supabaseEnabled) {
      for (const c of overrides.completions) {
        map.set(`${c.userId}|${c.date}`, c.completed);
      }
    }
    return map;
    // remoteTick forces refresh after optimistic local remote updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    base.completions,
    overrides.completions,
    supabaseEnabled,
    remoteReady,
    remoteQt,
    sessionUserId,
    remoteTick,
  ]);

  const reflectionMap = useMemo(() => {
    const map = new Map<string, QtEntry>();
    for (const r of base.reflections) {
      map.set(`${r.userId}|${r.date}`, normalizeEntry(r));
    }

    if (remoteReady && sessionUserId) {
      for (const key of [...map.keys()]) {
        if (key.startsWith(`${sessionUserId}|`)) map.delete(key);
      }
      for (const r of remoteQt.myEntries) {
        map.set(`${r.userId}|${r.date}`, normalizeEntry(r));
      }
    } else if (!supabaseEnabled) {
      for (const r of overrides.reflections) {
        map.set(`${r.userId}|${r.date}`, normalizeEntry(r));
      }
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    base.reflections,
    overrides.reflections,
    supabaseEnabled,
    remoteReady,
    remoteQt,
    sessionUserId,
    remoteTick,
  ]);

  const completions = useMemo(() => {
    const list: QtCompletion[] = [];
    for (const [key, completed] of completionMap) {
      const [userId, date] = key.split("|");
      if (completed) list.push({ userId, date, completed: true });
    }
    return list;
  }, [completionMap]);

  const reflections = useMemo(
    () => Array.from(reflectionMap.values()),
    [reflectionMap],
  );

  const awards = useMemo(() => {
    const map = new Map(base.awards.map((a) => [a.yearMonth, a]));
    for (const raw of overrides.awards) {
      const lights =
        typeof (raw as { lights?: number }).lights === "number"
          ? (raw as { lights: number }).lights
          : 0;
      map.set(raw.yearMonth, {
        yearMonth: raw.yearMonth,
        groupId: raw.groupId,
        lights,
        confirmed: raw.confirmed,
      });
    }
    return Array.from(map.values()).sort((a, b) =>
      b.yearMonth.localeCompare(a.yearMonth),
    );
  }, [base.awards, overrides.awards]);

  const currentUser = useMemo(() => {
    if (!sessionUserId) return null;
    return users.find((u) => u.id === sessionUserId) ?? null;
  }, [sessionUserId, users]);

  const loginAsTestUser = useCallback(() => {
    writeSession(getTestUser().id);
  }, []);

  const logout = useCallback(() => {
    writeSession(null);
  }, []);

  const isCompleted = useCallback(
    (userId: string, date: string) =>
      completionMap.get(`${userId}|${date}`) === true,
    [completionMap],
  );

  const getEntry = useCallback(
    (userId: string, date: string) => reflectionMap.get(`${userId}|${date}`),
    [reflectionMap],
  );

  const getReflection = getEntry;

  const notifyEarned = useCallback((date: string) => {
    setLastEarnedDate(date);
    window.setTimeout(() => {
      setLastEarnedDate((cur) => (cur === date ? null : cur));
    }, 1200);
  }, []);

  const saveEntry = useCallback(
    async (date: string, fields: QtEntryFields) => {
      if (!sessionUserId) {
        return { ok: false, message: "로그인이 필요합니다." };
      }
      if (isFutureDate(date)) {
        return { ok: false, message: "미래 날짜에는 저장할 수 없습니다." };
      }
      const wasComplete =
        completionMap.get(`${sessionUserId}|${date}`) === true;
      const err = validationMessage(fields);
      if (err) return { ok: false, message: err };

      const trimmed = trimFields(fields);
      const entry: QtEntry = {
        userId: sessionUserId,
        date,
        ...trimmed,
        updatedAt: new Date().toISOString(),
      };

      if (supabaseEnabled) {
        const res = await upsertQtEntry(sessionUserId, date, trimmed);
        if (!res.ok) {
          return {
            ok: false,
            message: `저장 실패: ${res.error}. Supabase 마이그레이션·시드(u-001)를 확인하세요.`,
          };
        }
        setRemoteQt((prev) => {
          const myEntries = [
            ...prev.myEntries.filter(
              (r) => !(r.userId === sessionUserId && r.date === date),
            ),
            res.data,
          ];
          const presence = [
            ...prev.presence.filter(
              (c) => !(c.userId === sessionUserId && c.date === date),
            ),
            { userId: sessionUserId, date, completed: true },
          ];
          return {
            myEntries,
            presence,
            loadedFor: sessionUserId,
          };
        });
        setRemoteTick((t) => t + 1);
        if (!wasComplete) notifyEarned(date);
        return {
          ok: true,
          message: "오늘도 주님의 말씀 안에서 살아가시기를 기도합니다",
        };
      }

      const nextReflections = [
        ...overrides.reflections.filter(
          (r) => !(r.userId === sessionUserId && r.date === date),
        ),
        entry,
      ];
      const nextCompletions = [
        ...overrides.completions.filter(
          (c) => !(c.userId === sessionUserId && c.date === date),
        ),
        { userId: sessionUserId, date, completed: true },
      ];
      writeOverrides({
        ...overrides,
        reflections: nextReflections,
        completions: nextCompletions,
      });
      if (!wasComplete) notifyEarned(date);
      return {
        ok: true,
        message: "오늘도 주님의 말씀 안에서 살아가시기를 기도합니다",
      };
    },
    [sessionUserId, overrides, supabaseEnabled, completionMap, notifyEarned],
  );

  const clearEntry = useCallback(
    async (date: string) => {
      if (!sessionUserId) {
        return { ok: false, message: "로그인이 필요합니다." };
      }
      if (isFutureDate(date)) {
        return { ok: false, message: "미래 날짜는 변경할 수 없습니다." };
      }

      if (supabaseEnabled) {
        const res = await deleteQtEntry(sessionUserId, date);
        if (!res.ok) {
          return {
            ok: false,
            message: `삭제 실패: ${res.error}`,
          };
        }
        setRemoteQt((prev) => ({
          myEntries: prev.myEntries.filter(
            (r) => !(r.userId === sessionUserId && r.date === date),
          ),
          presence: prev.presence.filter(
            (c) => !(c.userId === sessionUserId && c.date === date),
          ),
          loadedFor: sessionUserId,
        }));
        setRemoteTick((t) => t + 1);
        return { ok: true, message: "기록을 지우고 완료를 취소했습니다." };
      }

      const nextReflections = overrides.reflections.filter(
        (r) => !(r.userId === sessionUserId && r.date === date),
      );
      const nextCompletions = [
        ...overrides.completions.filter(
          (c) => !(c.userId === sessionUserId && c.date === date),
        ),
        { userId: sessionUserId, date, completed: false },
      ];
      writeOverrides({
        ...overrides,
        reflections: nextReflections,
        completions: nextCompletions,
      });
      return { ok: true, message: "기록을 지우고 완료를 취소했습니다." };
    },
    [sessionUserId, overrides, supabaseEnabled],
  );

  const assignUserGroup = useCallback(
    (userId: string, groupId: string) => {
      writeOverrides({
        ...overrides,
        userGroupMap: { ...overrides.userGroupMap, [userId]: groupId },
      });
    },
    [overrides],
  );

  const assignUsersToGroup = useCallback(
    (userIds: string[], groupId: string) => {
      const map = { ...overrides.userGroupMap };
      for (const id of userIds) map[id] = groupId;
      writeOverrides({ ...overrides, userGroupMap: map });
    },
    [overrides],
  );

  const setGroupLeader = useCallback(
    (groupId: string, userId: string) => {
      writeOverrides({
        ...overrides,
        leaderMap: { ...overrides.leaderMap, [groupId]: userId },
      });
    },
    [overrides],
  );

  const confirmAward = useCallback(
    (yearMonth: string, groupId: string, lights: number) => {
      const next = [
        ...overrides.awards.filter((a) => a.yearMonth !== yearMonth),
        { yearMonth, groupId, lights, confirmed: true },
      ];
      writeOverrides({ ...overrides, awards: next });
    },
    [overrides],
  );

  const setAvatarUrl = useCallback(
    async (dataUrl: string | null) => {
      if (!sessionUserId) {
        return { ok: false, message: "로그인이 필요해요." };
      }

      // Optimistic local update (instant UI for home / me / walkers)
      const avatarMap = { ...(overrides.avatarMap ?? {}) };
      if (dataUrl) avatarMap[sessionUserId] = dataUrl;
      else delete avatarMap[sessionUserId];
      writeOverrides({ ...overrides, avatarMap });

      if (!supabaseEnabled) {
        return { ok: true, message: "저장했어요." };
      }

      if (!dataUrl) {
        const res = await clearAvatar(sessionUserId);
        if (!res.ok) {
          return { ok: false, message: res.error };
        }
        setRemoteAvatars((prev) => {
          const next = { ...prev };
          delete next[sessionUserId];
          return next;
        });
        return { ok: true, message: "프로필 사진을 삭제했어요." };
      }

      const blob = dataUrlToBlob(dataUrl);
      if (!blob) {
        return { ok: false, message: "이미지 형식을 읽지 못했어요." };
      }

      const res = await uploadAndSaveAvatar(sessionUserId, blob);
      if (!res.ok) {
        return { ok: false, message: res.error };
      }

      // Replace data URL with durable public Storage URL
      avatarMap[sessionUserId] = res.data;
      writeOverrides({ ...overrides, avatarMap });
      setRemoteAvatars((prev) => ({ ...prev, [sessionUserId]: res.data }));
      return { ok: true, message: "프로필 사진을 저장했어요." };
    },
    [overrides, sessionUserId, supabaseEnabled],
  );

  const value: AppState = {
    ready: clientReady,
    currentUser,
    groups,
    users,
    completions,
    reflections,
    awards,
    supabaseEnabled,
    loginAsTestUser,
    logout,
    saveEntry,
    clearEntry,
    assignUserGroup,
    assignUsersToGroup,
    setGroupLeader,
    confirmAward,
    setAvatarUrl,
    isCompleted,
    getReflection,
    getEntry,
    lastEarnedDate,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export { TEST_USER_ID };
