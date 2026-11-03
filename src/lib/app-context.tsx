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
  QtReflection,
  User,
} from "@/types";
import {
  getMockData,
  getTestUser,
  TEST_USER_ID,
} from "@/lib/mock-data";
import { isFutureDate, todaySeoul } from "@/lib/dates";
import { loadJson, removeKey, saveJson } from "@/lib/storage";

interface AppState {
  ready: boolean;
  currentUser: User | null;
  groups: Group[];
  users: User[];
  completions: QtCompletion[];
  reflections: QtReflection[];
  awards: MonthlyAward[];
  loginAsTestUser: () => void;
  logout: () => void;
  toggleCompletion: (date: string) => { ok: boolean; message: string };
  saveReflection: (date: string, content: string) => { ok: boolean; message: string };
  assignUserGroup: (userId: string, groupId: string) => void;
  setGroupLeader: (groupId: string, userId: string) => void;
  confirmAward: (yearMonth: string, groupId: string, rate: number) => void;
  isCompleted: (userId: string, date: string) => boolean;
  getReflection: (userId: string, date: string) => QtReflection | undefined;
}

const AppContext = createContext<AppState | null>(null);

const SESSION_KEY = "session-user-id";
const OVERRIDES_KEY = "qt-overrides";

interface Overrides {
  completions: QtCompletion[];
  reflections: QtReflection[];
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
  clientSnap = {
    sessionUserId: loadJson<string | null>(SESSION_KEY, null),
    overrides: loadJson<Overrides>(OVERRIDES_KEY, emptyOverrides()),
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
    const map = new Map<string, QtReflection>();
    for (const r of base.reflections) {
      map.set(`${r.userId}|${r.date}`, r);
    }
    for (const r of overrides.reflections) {
      map.set(`${r.userId}|${r.date}`, r);
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

  const getReflection = useCallback(
    (userId: string, date: string) => reflectionMap.get(`${userId}|${date}`),
    [reflectionMap],
  );

  const toggleCompletion = useCallback(
    (date: string) => {
      if (!sessionUserId) {
        return { ok: false, message: "로그인이 필요합니다." };
      }
      if (isFutureDate(date)) {
        return { ok: false, message: "미래 날짜는 체크할 수 없습니다." };
      }
      const key = `${sessionUserId}|${date}`;
      const currently = completionMap.get(key) === true;
      const nextCompleted = !currently;
      const nextList = [
        ...overrides.completions.filter(
          (c) => !(c.userId === sessionUserId && c.date === date),
        ),
        { userId: sessionUserId, date, completed: nextCompleted },
      ];
      writeOverrides({ ...overrides, completions: nextList });
      return {
        ok: true,
        message: nextCompleted
          ? "오늘 QT를 완료로 표시했습니다."
          : "QT 완료를 취소했습니다.",
      };
    },
    [sessionUserId, completionMap, overrides],
  );

  const saveReflection = useCallback(
    (date: string, content: string) => {
      if (!sessionUserId) {
        return { ok: false, message: "로그인이 필요합니다." };
      }
      if (isFutureDate(date)) {
        return { ok: false, message: "미래 날짜에는 묵상을 저장할 수 없습니다." };
      }
      const entry: QtReflection = {
        userId: sessionUserId,
        date,
        content: content.trim(),
        updatedAt: new Date().toISOString(),
      };
      const nextList = [
        ...overrides.reflections.filter(
          (r) => !(r.userId === sessionUserId && r.date === date),
        ),
        entry,
      ];
      writeOverrides({ ...overrides, reflections: nextList });
      return { ok: true, message: "묵상을 저장했습니다." };
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
    toggleCompletion,
    saveReflection,
    assignUserGroup,
    setGroupLeader,
    confirmAward,
    isCompleted,
    getReflection,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export { TEST_USER_ID, todaySeoul };
