"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
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
import { isFutureDate, todaySeoul } from "@/lib/dates";
import { loadJson, removeKey, saveJson } from "@/lib/storage";
import {
  isEmptyQtEntry,
  isValidQtEntry,
  normalizeEntry,
  trimFields,
  validationMessage,
} from "@/lib/qt-entry";

interface AppState {
  ready: boolean;
  currentUser: User | null;
  groups: Group[];
  users: User[];
  completions: QtCompletion[];
  reflections: QtEntry[];
  awards: MonthlyAward[];
  loginAsTestUser: () => void;
  logout: () => void;
  /** Save QT entry; marks day complete if valid. */
  saveEntry: (
    date: string,
    fields: QtEntryFields,
  ) => { ok: boolean; message: string };
  /** Clear entry and uncomplete the day. */
  clearEntry: (date: string) => { ok: boolean; message: string };
  assignUserGroup: (userId: string, groupId: string) => void;
  /** Admin batch assign — membership is admin-managed only. */
  assignUsersToGroup: (userIds: string[], groupId: string) => void;
  setGroupLeader: (groupId: string, userId: string) => void;
  confirmAward: (yearMonth: string, groupId: string, rate: number) => void;
  isCompleted: (userId: string, date: string) => boolean;
  getReflection: (userId: string, date: string) => QtEntry | undefined;
  getEntry: (userId: string, date: string) => QtEntry | undefined;
}

const AppContext = createContext<AppState | null>(null);

const SESSION_KEY = "session-user-id";
const OVERRIDES_KEY = "qt-overrides-v2";

interface Overrides {
  completions: QtCompletion[];
  reflections: QtEntry[];
  userGroupMap: Record<string, string>;
  leaderMap: Record<string, string>;
  awards: MonthlyAward[];
}

const emptyOverrides = (): Overrides => ({
  completions: [],
  reflections: [],
  userGroupMap: {},
  leaderMap: {},
  awards: [],
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

  const users = useMemo(() => {
    return base.users.map((u) => {
      const groupId = overrides.userGroupMap[u.id] ?? u.groupId;
      const isLeader =
        (overrides.leaderMap[groupId] ??
          base.groups.find((g) => g.id === groupId)?.leaderId) === u.id;
      return { ...u, groupId, isLeader };
    });
  }, [base, overrides.userGroupMap, overrides.leaderMap]);

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
    for (const c of overrides.completions) {
      map.set(`${c.userId}|${c.date}`, c.completed);
    }
    return map;
  }, [base.completions, overrides.completions]);

  const reflectionMap = useMemo(() => {
    const map = new Map<string, QtEntry>();
    for (const r of base.reflections) {
      map.set(`${r.userId}|${r.date}`, normalizeEntry(r));
    }
    for (const r of overrides.reflections) {
      map.set(`${r.userId}|${r.date}`, normalizeEntry(r));
    }
    return map;
  }, [base.reflections, overrides.reflections]);

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
    for (const a of overrides.awards) map.set(a.yearMonth, a);
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

  const saveEntry = useCallback(
    (date: string, fields: QtEntryFields) => {
      if (!sessionUserId) {
        return { ok: false, message: "로그인이 필요합니다." };
      }
      if (isFutureDate(date)) {
        return { ok: false, message: "미래 날짜에는 저장할 수 없습니다." };
      }
      const err = validationMessage(fields);
      if (err) return { ok: false, message: err };

      const trimmed = trimFields(fields);
      const entry: QtEntry = {
        userId: sessionUserId,
        date,
        ...trimmed,
        updatedAt: new Date().toISOString(),
      };
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
      return {
        ok: true,
        message: "오늘도 주님의 말씀 안에서 살아가시기를 기도합니다",
      };
    },
    [sessionUserId, overrides],
  );

  const clearEntry = useCallback(
    (date: string) => {
      if (!sessionUserId) {
        return { ok: false, message: "로그인이 필요합니다." };
      }
      if (isFutureDate(date)) {
        return { ok: false, message: "미래 날짜는 변경할 수 없습니다." };
      }
      const nextReflections = overrides.reflections.filter(
        (r) => !(r.userId === sessionUserId && r.date === date),
      );
      // Explicit uncomplete override even if base mock had a completion
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
    [sessionUserId, overrides],
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
    (yearMonth: string, groupId: string, rate: number) => {
      const next = [
        ...overrides.awards.filter((a) => a.yearMonth !== yearMonth),
        { yearMonth, groupId, rate, confirmed: true },
      ];
      writeOverrides({ ...overrides, awards: next });
    },
    [overrides],
  );

  const value: AppState = {
    ready: clientReady,
    currentUser,
    groups,
    users,
    completions,
    reflections,
    awards,
    loginAsTestUser,
    logout,
    saveEntry,
    clearEntry,
    assignUserGroup,
    assignUsersToGroup,
    setGroupLeader,
    confirmAward,
    isCompleted,
    getReflection,
    getEntry,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export { TEST_USER_ID, todaySeoul, isEmptyQtEntry, isValidQtEntry };
