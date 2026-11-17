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
import { getMockData, TEST_USER_ID } from "@/lib/mock-data";
import { isFutureDate, todaySeoul } from "@/lib/dates";
import { loadJson, removeKey, saveJson, trySaveJson } from "@/lib/storage";
import {
  entryHasQtContent,
  normalizeEntry,
  trimFields,
  validationMessage,
} from "@/lib/qt-entry";
import {
  blobToDataUrl,
  compressAvatarImage,
  isPrecompressedAvatarJpeg,
} from "@/lib/avatar-image";
import {
  clearAvatar,
  dataUrlToBlob,
  fetchProfileAvatarMap,
  uploadAndSaveAvatar,
} from "@/lib/supabase/avatar-repo";
import {
  applyCommunityVerification,
  ensureKakaoProfile,
  fetchDisplayName,
  fetchProfileGroupId,
  isCommunityVerified,
  submitCommunityException,
  updateDisplayName,
  updateProfileGroupId,
  type CommunityStatus,
  type ProfileRow,
} from "@/lib/supabase/profile-repo";
import {
  getAuthSession,
  signOutAuth,
} from "@/lib/supabase/auth";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import {
  deleteQtEntry,
  fetchQtPresence,
  fetchUserQtEntries,
  isSupabaseConfigured,
  upsertQtEntry,
} from "@/lib/supabase/qt-repo";
import type { User as AuthUser } from "@supabase/supabase-js";

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
  /** Kakao community gate: pending | verified | exception */
  communityStatus: CommunityStatus;
  /** After `/auth/callback` — sync session + profile into app state. */
  hydrateFromAuthUser: (
    authUser: AuthUser,
    profile: ProfileRow,
  ) => Promise<void>;
  applyRosterVerification: (input: {
    legalName: string;
    groupId: string | null;
    role: "admin" | "leader" | "member";
  }) => Promise<{ ok: boolean; message: string }>;
  submitVerificationException: (
    legalName: string,
    note: string,
  ) => Promise<{ ok: boolean; message: string }>;
  logout: () => Promise<void>;
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
   * Accepts a compressed JPEG `Blob` (preferred) or a data URL.
   * With Supabase: upload Blob → write `profiles.avatar_url` (public URL only);
   * cloud errors hard-fail. Without Supabase: local data URL only.
   */
  setAvatarUrl: (
    image: Blob | string | null,
  ) => Promise<{ ok: boolean; message: string }>;
  /** Update nickname (profiles.display_name when Supabase is on). */
  setDisplayName: (
    name: string,
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
  /**
   * Profile photo keyed by user id.
   * Local-only mode: data URLs. Supabase mode: public Storage URLs only.
   */
  avatarMap: Record<string, string>;
  /** Nickname overrides keyed by user id (profiles.display_name). */
  nameMap?: Record<string, string>;
  /**
   * Completions that do not earn lights (past-date backfills).
   * Keys: `userId|YYYY-MM-DD`. Persists for both local + Supabase saves.
   */
  noLightKeys?: string[];
}

const emptyOverrides = (): Overrides => ({
  completions: [],
  reflections: [],
  userGroupMap: {},
  leaderMap: {},
  awards: [],
  avatarMap: {},
  nameMap: {},
  noLightKeys: [],
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

/**
 * Seed roster ids (`u-001`…) must keep legal names from mock data.
 * Drop leftover local nickname overrides (e.g. personal nick 「밍밍이」 on u-001).
 */
function scrubSeedNameOverrides(overrides: Overrides): Overrides {
  const nameMap = overrides.nameMap;
  if (!nameMap) return overrides;
  let changed = false;
  const next: Record<string, string> = { ...nameMap };
  for (const id of Object.keys(next)) {
    if (/^u-\d+$/.test(id)) {
      delete next[id];
      changed = true;
    }
  }
  if (!changed) return overrides;
  return { ...overrides, nameMap: next };
}

function readFresh(): StoreSnapshot {
  version += 1;
  const loaded = loadJson<Overrides>(OVERRIDES_KEY, emptyOverrides());
  const raw = scrubSeedNameOverrides(loaded);
  // Persist scrub so personal nick on seed ids (e.g. 밍밍이 → u-001) does not return.
  if (raw !== loaded) {
    trySaveJson(OVERRIDES_KEY, raw);
  }
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

/** Drop base64 data-URL avatars — they blow mobile localStorage quotas. */
function stripDataUrlAvatars(
  map: Record<string, string> | undefined,
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const [id, url] of Object.entries(map ?? {})) {
    if (url && !url.startsWith("data:")) next[id] = url;
  }
  return next;
}

function writeOverrides(next: Overrides) {
  const persisted = trySaveJson(OVERRIDES_KEY, next);
  if (persisted) {
    readFresh();
  } else {
    // Keep in-memory state even when localStorage quota blocks (large avatars).
    version += 1;
    clientSnap = {
      sessionUserId: clientSnap.sessionUserId,
      overrides: {
        ...next,
        reflections: (next.reflections ?? []).map((r) =>
          normalizeEntry(r as QtEntry & { content?: string }),
        ),
      },
      version,
    };
  }
  emit();
  return persisted;
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

function mapStatus(profile: ProfileRow | null | undefined): CommunityStatus {
  if (!profile) return "pending";
  if (profile.community_status === "verified") return "verified";
  if (profile.community_status === "exception") return "exception";
  if (!profile.community_status && profile.group_id) return "verified";
  return "pending";
}

function profileToUser(profile: ProfileRow, leaderMap: Record<string, string>): User {
  const groupId = profile.group_id ?? "";
  const role = profile.role;
  return {
    id: profile.id,
    name: profile.display_name || profile.legal_name || "드림",
    groupId,
    isAdmin: role === "admin",
    isLeader: role === "leader" || leaderMap[groupId] === profile.id,
    avatarUrl: profile.avatar_url,
  };
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
  const supabaseEnabled = isSupabaseConfigured();

  const [remoteQt, setRemoteQt] = useState<RemoteQt>(EMPTY_REMOTE);
  const [remoteAvatars, setRemoteAvatars] = useState<Record<string, string>>(
    {},
  );
  const [lastEarnedDate, setLastEarnedDate] = useState<string | null>(null);
  const [remoteTick, setRemoteTick] = useState(0);
  const [authBootstrapped, setAuthBootstrapped] = useState(!supabaseEnabled);
  const [authProfile, setAuthProfile] = useState<ProfileRow | null>(null);
  const [communityStatus, setCommunityStatus] =
    useState<CommunityStatus>("pending");

  /** Bootstrap Kakao / Supabase session on load (replaces local test login). */
  useEffect(() => {
    if (!supabaseEnabled) {
      setAuthBootstrapped(true);
      return;
    }
    let cancelled = false;
    const sb = getSupabaseBrowser();
    if (!sb) {
      setAuthBootstrapped(true);
      return;
    }

    const applySession = async (authUser: AuthUser | null) => {
      if (cancelled) return;
      if (!authUser) {
        writeSession(null);
        setAuthProfile(null);
        setCommunityStatus("pending");
        return;
      }
      const ensured = await ensureKakaoProfile(authUser);
      if (cancelled) return;
      if (!ensured.ok) {
        writeSession(authUser.id);
        setAuthProfile(null);
        setCommunityStatus("pending");
        return;
      }
      writeSession(authUser.id);
      setAuthProfile(ensured.data);
      setCommunityStatus(
        isCommunityVerified(ensured.data) ? "verified" : mapStatus(ensured.data),
      );
      // Hydrate nickname / avatar / group into local overrides.
      const nameMap = { ...(getSnapshot().overrides.nameMap ?? {}) };
      if (ensured.data.display_name?.trim()) {
        nameMap[authUser.id] = ensured.data.display_name.trim();
      }
      const avatarMap = { ...(getSnapshot().overrides.avatarMap ?? {}) };
      if (ensured.data.avatar_url) {
        avatarMap[authUser.id] = ensured.data.avatar_url;
      }
      const userGroupMap = {
        ...(getSnapshot().overrides.userGroupMap ?? {}),
      };
      if (ensured.data.group_id) {
        userGroupMap[authUser.id] = ensured.data.group_id;
      }
      writeOverrides({
        ...getSnapshot().overrides,
        nameMap,
        avatarMap: stripDataUrlAvatars(avatarMap),
        userGroupMap,
      });
    };

    (async () => {
      const session = await getAuthSession();
      await applySession(session?.user ?? null);
      if (!cancelled) setAuthBootstrapped(true);
    })();

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      void applySession(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supabaseEnabled]);

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
      // Keep optimistic rows if fetch fails or returns older data (home save race).
      // Only mark remote hydrate ready (loadedFor) when the owner QT fetch succeeds —
      // a failed select must not look like "cloud returned []" and wipe journals.
      setRemoteQt((prev) => {
        const sameUser = prev.loadedFor === sessionUserId;
        if (!mine.ok) {
          return {
            myEntries: sameUser ? prev.myEntries : [],
            presence: presence.ok
              ? presence.data
              : sameUser
                ? prev.presence
                : [],
            // Leave loadedFor unset so remoteReady stays false; local drafts remain.
            loadedFor: sameUser ? prev.loadedFor : null,
          };
        }
        let myEntries = mine.data;
        if (sameUser && prev.myEntries.length > 0) {
          const map = new Map<string, (typeof mine.data)[number]>();
          for (const e of mine.data) map.set(`${e.userId}|${e.date}`, e);
          for (const e of prev.myEntries) {
            const k = `${e.userId}|${e.date}`;
            const remote = map.get(k);
            if (!remote || e.updatedAt > remote.updatedAt) map.set(k, e);
          }
          myEntries = [...map.values()];
        }
        return {
          myEntries,
          presence: presence.ok
            ? presence.data
            : sameUser
              ? prev.presence
              : [],
          loadedFor: sessionUserId,
        };
      });
      if (avatars.ok) setRemoteAvatars(avatars.data);
      // Supabase mode: never keep data-URL thumbnails in localStorage.
      {
        const cur = getSnapshot().overrides;
        const pruned = stripDataUrlAvatars(cur.avatarMap);
        const before = Object.keys(cur.avatarMap ?? {}).length;
        const after = Object.keys(pruned).length;
        if (before !== after) {
          writeOverrides({ ...cur, avatarMap: pruned });
        }
      }

      // DQ-691: flush leftover localStorage QT text → qt_entries.
      // Only drop local rows that actually upserted; keep drafts on cloud failure.
      if (mine.ok) {
        const cur = getSnapshot().overrides;
        const localMine = (cur.reflections ?? []).filter(
          (r) => r.userId === sessionUserId,
        );
        if (localMine.length > 0) {
          const flushed: QtEntry[] = [];
          const flushedDates = new Set<string>();
          for (const entry of localMine) {
            const res = await upsertQtEntry(sessionUserId, entry.date, {
              meditation: entry.meditation,
              verse: entry.verse,
              decisionObedience: entry.decisionObedience,
              prayer: entry.prayer,
            });
            if (res.ok) {
              flushed.push(res.data);
              flushedDates.add(entry.date);
            }
          }
          if (!cancelled && flushed.length > 0) {
            setRemoteQt((prev) => {
              const map = new Map<string, QtEntry>();
              for (const e of prev.myEntries) {
                map.set(`${e.userId}|${e.date}`, e);
              }
              for (const e of flushed) {
                map.set(`${e.userId}|${e.date}`, e);
              }
              return {
                ...prev,
                myEntries: [...map.values()],
                loadedFor: sessionUserId,
              };
            });
          }
          if (flushedDates.size > 0) {
            writeOverrides({
              ...getSnapshot().overrides,
              reflections: (getSnapshot().overrides.reflections ?? []).filter(
                (r) =>
                  !(
                    r.userId === sessionUserId && flushedDates.has(r.date)
                  ),
              ),
              completions: (getSnapshot().overrides.completions ?? []).filter(
                (c) =>
                  !(
                    c.userId === sessionUserId && flushedDates.has(c.date)
                  ),
              ),
            });
          }
        }
      }

      const display = await fetchDisplayName(sessionUserId);
      if (!cancelled && display.ok && display.data) {
        const nameMap = { ...(getSnapshot().overrides.nameMap ?? {}) };
        // Prefer local override if user already edited this session.
        if (!nameMap[sessionUserId]) {
          nameMap[sessionUserId] = display.data;
          writeOverrides({ ...getSnapshot().overrides, nameMap });
        }
      }

      // DQ-693 scaffold: hydrate 순 from profiles.group_id (roster file still pending).
      const group = await fetchProfileGroupId(sessionUserId);
      if (!cancelled && group.ok && group.data) {
        const userGroupMap = {
          ...(getSnapshot().overrides.userGroupMap ?? {}),
        };
        if (!userGroupMap[sessionUserId]) {
          userGroupMap[sessionUserId] = group.data;
          writeOverrides({ ...getSnapshot().overrides, userGroupMap });
        }
      }
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
    const mapped = base.users.map((u) => {
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
      const name = overrides.nameMap?.[u.id]?.trim() || u.name;
      return { ...u, name, groupId, isLeader, avatarUrl };
    });

    // Kakao auth user (UUID) is not in mock seed — inject for group / me views.
    if (authProfile && !mapped.some((u) => u.id === authProfile.id)) {
      const injected = profileToUser(authProfile, overrides.leaderMap);
      const groupId =
        overrides.userGroupMap[authProfile.id] ?? injected.groupId;
      const name =
        overrides.nameMap?.[authProfile.id]?.trim() || injected.name;
      const avatarUrl =
        overrides.avatarMap?.[authProfile.id] ??
        remoteAvatars[authProfile.id] ??
        injected.avatarUrl ??
        null;
      const isLeader =
        (overrides.leaderMap[groupId] ??
          base.groups.find((g) => g.id === groupId)?.leaderId) ===
          authProfile.id || injected.isLeader;
      mapped.push({
        ...injected,
        name,
        groupId,
        isLeader,
        avatarUrl,
        isAdmin: authProfile.role === "admin" || injected.isAdmin,
      });
    }

    return mapped;
  }, [
    base,
    overrides.userGroupMap,
    overrides.leaderMap,
    overrides.avatarMap,
    overrides.nameMap,
    remoteAvatars,
    authProfile,
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

    if (supabaseEnabled && sessionUserId) {
      // Logged-in user lights come from qt_entries / presence when hydrated.
      for (const key of [...map.keys()]) {
        if (key.startsWith(`${sessionUserId}|`)) map.delete(key);
      }
      if (remoteReady) {
        // Session user: presence alone can outrun / miss QT text (empty row,
        // fetch lag). Only count days that still have saved QT content.
        const myContentDates = new Set(
          remoteQt.myEntries
            .filter((e) => entryHasQtContent(e))
            .map((e) => e.date),
        );
        for (const r of overrides.reflections) {
          if (
            r.userId === sessionUserId &&
            entryHasQtContent(r)
          ) {
            myContentDates.add(r.date);
          }
        }
        for (const c of remoteQt.presence) {
          if (
            c.userId === sessionUserId &&
            !myContentDates.has(c.date)
          ) {
            continue;
          }
          map.set(`${c.userId}|${c.date}`, c.completed);
        }
        // Local draft completions after a failed cloud save.
        for (const c of overrides.completions) {
          if (c.userId === sessionUserId) {
            map.set(`${c.userId}|${c.date}`, c.completed);
          }
        }
      } else {
        // Cloud hydrate failed / still loading — keep local draft completions.
        for (const c of overrides.completions) {
          if (c.userId === sessionUserId) {
            map.set(`${c.userId}|${c.date}`, c.completed);
          }
        }
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

    if (supabaseEnabled && sessionUserId) {
      // DQ-691: prefer Postgres qt_entries once hydrate succeeds.
      for (const key of [...map.keys()]) {
        if (key.startsWith(`${sessionUserId}|`)) map.delete(key);
      }
      if (remoteReady) {
        for (const r of remoteQt.myEntries) {
          map.set(`${r.userId}|${r.date}`, normalizeEntry(r));
        }
        // Overlay local drafts left after a failed cloud save / partial flush.
        for (const r of overrides.reflections) {
          if (r.userId !== sessionUserId) continue;
          const k = `${r.userId}|${r.date}`;
          const remote = map.get(k);
          if (!remote || r.updatedAt >= remote.updatedAt) {
            map.set(k, normalizeEntry(r));
          }
        }
      } else {
        // Do not treat a failed cloud fetch as empty journals — keep local drafts.
        for (const r of overrides.reflections) {
          if (r.userId === sessionUserId) {
            map.set(`${r.userId}|${r.date}`, normalizeEntry(r));
          }
        }
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

  const noLightKeySet = useMemo(() => {
    const fromOverrides = new Set(overrides.noLightKeys ?? []);
    // Also honor earnsLight:false stored on local completion rows.
    for (const c of overrides.completions) {
      if (c.completed && c.earnsLight === false) {
        fromOverrides.add(`${c.userId}|${c.date}`);
      }
    }
    return fromOverrides;
  }, [overrides.noLightKeys, overrides.completions]);

  const completions = useMemo(() => {
    const list: QtCompletion[] = [];
    for (const [key, completed] of completionMap) {
      const [userId, date] = key.split("|");
      if (!completed) continue;
      list.push({
        userId,
        date,
        completed: true,
        earnsLight: !noLightKeySet.has(key),
      });
    }
    return list;
  }, [completionMap, noLightKeySet]);

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

  const hydrateFromAuthUser = useCallback(
    async (authUser: AuthUser, profile: ProfileRow) => {
      writeSession(authUser.id);
      setAuthProfile(profile);
      setCommunityStatus(
        isCommunityVerified(profile) ? "verified" : mapStatus(profile),
      );
      const nameMap = { ...(getSnapshot().overrides.nameMap ?? {}) };
      if (profile.display_name?.trim()) {
        nameMap[authUser.id] = profile.display_name.trim();
      }
      const avatarMap = { ...(getSnapshot().overrides.avatarMap ?? {}) };
      if (profile.avatar_url) {
        avatarMap[authUser.id] = profile.avatar_url;
      }
      const userGroupMap = {
        ...(getSnapshot().overrides.userGroupMap ?? {}),
      };
      if (profile.group_id) {
        userGroupMap[authUser.id] = profile.group_id;
      }
      writeOverrides({
        ...getSnapshot().overrides,
        nameMap,
        avatarMap: stripDataUrlAvatars(avatarMap),
        userGroupMap,
      });
    },
    [],
  );

  const applyRosterVerification = useCallback(
    async (input: {
      legalName: string;
      groupId: string | null;
      role: "admin" | "leader" | "member";
    }) => {
      if (!sessionUserId) {
        return { ok: false, message: "로그인이 필요해요." };
      }
      const res = await applyCommunityVerification({
        userId: sessionUserId,
        legalName: input.legalName,
        groupId: input.groupId,
        role: input.role,
      });
      if (!res.ok) return { ok: false, message: res.error };
      setAuthProfile(res.data);
      setCommunityStatus("verified");
      const userGroupMap = {
        ...(getSnapshot().overrides.userGroupMap ?? {}),
      };
      if (input.groupId) {
        userGroupMap[sessionUserId] = input.groupId;
      } else {
        delete userGroupMap[sessionUserId];
      }
      writeOverrides({
        ...getSnapshot().overrides,
        userGroupMap,
      });
      return { ok: true, message: "공동체 확인이 완료됐어요." };
    },
    [sessionUserId],
  );

  const submitVerificationException = useCallback(
    async (legalName: string, note: string) => {
      if (!sessionUserId) {
        return { ok: false, message: "로그인이 필요해요." };
      }
      const res = await submitCommunityException(
        sessionUserId,
        legalName,
        note,
      );
      if (!res.ok) return { ok: false, message: res.error };
      setAuthProfile(res.data);
      setCommunityStatus("exception");
      return { ok: true, message: "확인 요청을 남겼어요." };
    },
    [sessionUserId],
  );

  const logout = useCallback(async () => {
    if (supabaseEnabled) {
      await signOutAuth();
    }
    writeSession(null);
    setAuthProfile(null);
    setCommunityStatus("pending");
    setRemoteQt(EMPTY_REMOTE);
  }, [supabaseEnabled]);

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
      const key = `${sessionUserId}|${date}`;
      const wasComplete = completionMap.get(key) === true;
      const err = validationMessage(fields);
      if (err) return { ok: false, message: err };

      const trimmed = trimFields(fields);
      const entry: QtEntry = {
        userId: sessionUserId,
        date,
        ...trimmed,
        updatedAt: new Date().toISOString(),
      };
      // Only same-day completion earns a light; past backfills save without count/burst.
      const onTime = date === todaySeoul();
      const earnsLight = onTime;
      const prevNoLight = overrides.noLightKeys ?? [];
      const nextNoLight = earnsLight
        ? prevNoLight.filter((k) => k !== key)
        : prevNoLight.includes(key)
          ? prevNoLight
          : [...prevNoLight, key];

      if (supabaseEnabled) {
        let res: Awaited<ReturnType<typeof upsertQtEntry>>;
        try {
          res = await upsertQtEntry(sessionUserId, date, trimmed);
        } catch (err) {
          const detail =
            err instanceof Error ? err.message : "네트워크 오류";
          // Keep a local draft so revisit does not look empty after cloud failure.
          writeOverrides({
            ...overrides,
            reflections: [
              ...overrides.reflections.filter(
                (r) => !(r.userId === sessionUserId && r.date === date),
              ),
              entry,
            ],
            completions: [
              ...overrides.completions.filter(
                (c) => !(c.userId === sessionUserId && c.date === date),
              ),
              { userId: sessionUserId, date, completed: true, earnsLight },
            ],
            noLightKeys: nextNoLight,
          });
          return { ok: false, message: `저장 실패: ${detail}` };
        }
        if (!res.ok) {
          writeOverrides({
            ...overrides,
            reflections: [
              ...overrides.reflections.filter(
                (r) => !(r.userId === sessionUserId && r.date === date),
              ),
              entry,
            ],
            completions: [
              ...overrides.completions.filter(
                (c) => !(c.userId === sessionUserId && c.date === date),
              ),
              { userId: sessionUserId, date, completed: true, earnsLight },
            ],
            noLightKeys: nextNoLight,
          });
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
            {
              userId: sessionUserId,
              date,
              completed: true,
              earnsLight,
            },
          ];
          return {
            myEntries,
            presence,
            loadedFor: sessionUserId,
          };
        });
        writeOverrides({ ...overrides, noLightKeys: nextNoLight });
        setRemoteTick((t) => t + 1);
        if (!wasComplete && earnsLight) notifyEarned(date);
        return {
          ok: true,
          message: earnsLight
            ? "오늘도 주님의 말씀 안에서 살아가시기를 기도합니다"
            : "지난 큐티를 저장했어요. 빛은 모이지 않아요.",
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
        { userId: sessionUserId, date, completed: true, earnsLight },
      ];
      writeOverrides({
        ...overrides,
        reflections: nextReflections,
        completions: nextCompletions,
        noLightKeys: nextNoLight,
      });
      if (!wasComplete && earnsLight) notifyEarned(date);
      return {
        ok: true,
        message: earnsLight
          ? "오늘도 주님의 말씀 안에서 살아가시기를 기도합니다"
          : "지난 큐티를 저장했어요. 빛은 모이지 않아요.",
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

      const key = `${sessionUserId}|${date}`;
      const nextNoLight = (overrides.noLightKeys ?? []).filter((k) => k !== key);

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
        writeOverrides({ ...overrides, noLightKeys: nextNoLight });
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
        noLightKeys: nextNoLight,
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
      // DQ-693 scaffold: profiles.group_id (full roster seed waits for Minzi’s file).
      if (supabaseEnabled) {
        void updateProfileGroupId(userId, groupId);
      }
    },
    [overrides, supabaseEnabled],
  );

  const assignUsersToGroup = useCallback(
    (userIds: string[], groupId: string) => {
      const map = { ...overrides.userGroupMap };
      for (const id of userIds) map[id] = groupId;
      writeOverrides({ ...overrides, userGroupMap: map });
      if (supabaseEnabled) {
        for (const id of userIds) {
          void updateProfileGroupId(id, groupId);
        }
      }
    },
    [overrides, supabaseEnabled],
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
    async (image: Blob | string | null) => {
      if (!sessionUserId) {
        return { ok: false, message: "로그인이 필요해요." };
      }

      if (!image) {
        if (supabaseEnabled) {
          const res = await clearAvatar(sessionUserId);
          if (!res.ok) {
            return { ok: false, message: res.error };
          }
          setRemoteAvatars((prev) => {
            const next = { ...prev };
            delete next[sessionUserId];
            return next;
          });
        }
        const avatarMap = { ...(overrides.avatarMap ?? {}) };
        delete avatarMap[sessionUserId];
        writeOverrides({ ...overrides, avatarMap });
        return { ok: true, message: "프로필 사진을 삭제했어요." };
      }

      // Prefer an already-compressed JPEG Blob from the picker; otherwise compress.
      // Re-encoding a second time freezes the UI on large phone photos.
      let uploadBlob: Blob | null = null;
      let localDataUrl: string | null = null;
      try {
        if (image instanceof Blob && isPrecompressedAvatarJpeg(image)) {
          uploadBlob = image;
          // Local-only mode needs a data URL; cloud path uploads the Blob as-is.
          if (!supabaseEnabled) {
            localDataUrl = await blobToDataUrl(image);
          }
        } else if (
          image instanceof Blob &&
          image.type.startsWith("image/")
        ) {
          const compressed = await compressAvatarImage(image);
          uploadBlob = compressed.blob;
          localDataUrl = compressed.dataUrl;
        } else if (typeof image === "string") {
          const compressed = await compressAvatarImage(image);
          uploadBlob = compressed.blob;
          localDataUrl = compressed.dataUrl;
        } else {
          return { ok: false, message: "이미지 파일만 업로드할 수 있어요." };
        }
      } catch (err) {
        const detail =
          err instanceof Error ? err.message : "이미지 변환에 실패했어요.";
        return { ok: false, message: detail };
      }

      // Local-only: persist compressed data URL (no Supabase).
      if (!supabaseEnabled) {
        if (!localDataUrl) {
          return { ok: false, message: "이미지 형식을 읽지 못했어요." };
        }
        const avatarMap = { ...(overrides.avatarMap ?? {}) };
        avatarMap[sessionUserId] = localDataUrl;
        writeOverrides({ ...overrides, avatarMap });
        return { ok: true, message: "저장했어요." };
      }

      // Supabase on: upload Blob first; persist public URL only (never data URL).
      const blob =
        uploadBlob && uploadBlob.type.startsWith("image/")
          ? uploadBlob
          : localDataUrl
            ? dataUrlToBlob(localDataUrl)
            : null;
      if (!blob) {
        return { ok: false, message: "이미지 형식을 읽지 못했어요." };
      }

      let res: Awaited<ReturnType<typeof uploadAndSaveAvatar>>;
      try {
        res = await uploadAndSaveAvatar(sessionUserId, blob);
      } catch (err) {
        const detail =
          err instanceof Error ? err.message : "클라우드 저장에 실패했어요.";
        return { ok: false, message: detail };
      }
      if (!res.ok) {
        return { ok: false, message: res.error };
      }

      const avatarMap = stripDataUrlAvatars({
        ...(overrides.avatarMap ?? {}),
        [sessionUserId]: res.data,
      });
      writeOverrides({ ...overrides, avatarMap });
      setRemoteAvatars((prev) => ({ ...prev, [sessionUserId]: res.data }));
      return { ok: true, message: "프로필 사진을 저장했어요." };
    },
    [overrides, sessionUserId, supabaseEnabled],
  );

  const setDisplayName = useCallback(
    async (name: string) => {
      if (!sessionUserId) {
        return { ok: false, message: "로그인이 필요해요." };
      }
      const trimmed = name.trim();
      if (!trimmed) {
        return { ok: false, message: "닉네임을 입력해 주세요." };
      }
      if (trimmed.length > 40) {
        return { ok: false, message: "닉네임은 40자 이내로 입력해 주세요." };
      }

      const nameMap = { ...(overrides.nameMap ?? {}) };
      nameMap[sessionUserId] = trimmed;
      writeOverrides({ ...overrides, nameMap });

      if (!supabaseEnabled) {
        return { ok: true, message: "닉네임을 저장했어요." };
      }

      const res = await updateDisplayName(sessionUserId, trimmed);
      if (!res.ok) {
        return {
          ok: true,
          message: `기기에 저장했어요. 클라우드 동기화 실패: ${res.error}`,
        };
      }
      return { ok: true, message: "닉네임을 저장했어요." };
    },
    [overrides, sessionUserId, supabaseEnabled],
  );

  const value: AppState = {
    ready: clientReady && authBootstrapped,
    currentUser,
    groups,
    users,
    completions,
    reflections,
    awards,
    supabaseEnabled,
    communityStatus,
    hydrateFromAuthUser,
    applyRosterVerification,
    submitVerificationException,
    logout,
    saveEntry,
    clearEntry,
    assignUserGroup,
    assignUsersToGroup,
    setGroupLeader,
    confirmAward,
    setAvatarUrl,
    setDisplayName,
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
