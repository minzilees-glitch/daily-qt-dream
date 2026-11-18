import type { QtCompletion, QtEntry, QtEntryFields } from "@/types";
import { getAuthSession } from "@/lib/supabase/auth";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";

export type QtRepoResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Whether presence rows cover the whole 순 (RPC) or own rows only (legacy anon). */
export type QtPresenceScope = "group" | "own";

const ENTRY_SELECT_FULL =
  "user_id, entry_date, meditation, verse, decision_obedience, prayer, updated_at" as const;
const ENTRY_SELECT_LEGACY =
  "user_id, entry_date, meditation, verse, prayer, updated_at" as const;

/**
 * Prod may lag migration `20261104_qt_decision_obedience.sql`.
 * Cache the working shape after the first successful probe so we do not
 * keep failing SELECT/UPSERT with PGRST204 / missing-column errors.
 */
type QtSchemaMode = "full" | "legacy";
let qtSchemaMode: QtSchemaMode | null = null;

function isMissingDecisionObedienceError(error: {
  message?: string;
  code?: string;
}): boolean {
  return (
    /decision_obedience/i.test(error.message ?? "") ||
    error.code === "PGRST204" ||
    error.code === "42703"
  );
}

type EntryRow = {
  user_id: string;
  entry_date: string;
  meditation: string;
  verse: string;
  decision_obedience?: string | null;
  prayer: string;
  updated_at: string;
};

function mapEntry(row: EntryRow): QtEntry {
  return {
    userId: row.user_id,
    date: row.entry_date,
    meditation: row.meditation ?? "",
    verse: row.verse ?? "",
    decisionObedience: row.decision_obedience ?? "",
    prayer: row.prayer ?? "",
    updatedAt: row.updated_at,
  };
}

/** Full QT text for one user (owner). */
export async function fetchUserQtEntries(
  userId: string,
): Promise<QtRepoResult<QtEntry[]>> {
  const sb = getSupabaseBrowser();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const selectFull = () =>
    sb
      .from("qt_entries")
      .select(ENTRY_SELECT_FULL)
      .eq("user_id", userId)
      .order("entry_date", { ascending: false });

  const selectLegacy = () =>
    sb
      .from("qt_entries")
      .select(ENTRY_SELECT_LEGACY)
      .eq("user_id", userId)
      .order("entry_date", { ascending: false });

  if (qtSchemaMode === "legacy") {
    const cached = await selectLegacy();
    if (cached.error) return { ok: false, error: cached.error.message };
    return {
      ok: true,
      data: (cached.data ?? []).map((row) => mapEntry(row as EntryRow)),
    };
  }

  if (qtSchemaMode === "full") {
    const cached = await selectFull();
    if (cached.error) return { ok: false, error: cached.error.message };
    return {
      ok: true,
      data: (cached.data ?? []).map((row) => mapEntry(row as EntryRow)),
    };
  }

  const first = await selectFull();
  if (!first.error) {
    qtSchemaMode = "full";
    return {
      ok: true,
      data: (first.data ?? []).map((row) => mapEntry(row as EntryRow)),
    };
  }

  if (!isMissingDecisionObedienceError(first.error)) {
    return { ok: false, error: first.error.message };
  }

  const second = await selectLegacy();
  if (second.error) return { ok: false, error: second.error.message };
  qtSchemaMode = "legacy";
  return {
    ok: true,
    data: (second.data ?? []).map((row) => mapEntry(row as EntryRow)),
  };
}

/**
 * Presence rows for light counts (no QT journal text).
 * Prefers SECURITY DEFINER RPC `get_qt_presence` (same-group / admin).
 * Falls back to presence view, then user_id+entry_date select (own rows under RLS).
 */
export async function fetchQtPresence(): Promise<
  QtRepoResult<QtCompletion[]> & { scope?: QtPresenceScope }
> {
  const sb = getSupabaseBrowser();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const mapPresence = (
    rows: { user_id: string; entry_date: string }[],
  ): QtCompletion[] =>
    rows.map((r) => ({
      userId: r.user_id,
      date: r.entry_date,
      completed: true,
    }));

  const viaRpc = await sb.rpc("get_qt_presence");
  if (!viaRpc.error) {
    return {
      ok: true,
      scope: "group",
      data: mapPresence(viaRpc.data ?? []),
    };
  }

  /**
   * Hardened RLS: qt_entries / qt_entry_presence only return the signed-in user.
   * Treating that as "group presence" made 우리순 전체 count only the viewer's lights.
   */
  const session = await getAuthSession();
  if (session?.user) {
    return { ok: false, error: viaRpc.error.message };
  }

  const viaView = await sb
    .from("qt_entry_presence")
    .select("user_id, entry_date");

  if (!viaView.error) {
    return {
      ok: true,
      scope: "own",
      data: mapPresence(viaView.data ?? []),
    };
  }

  const viaTable = await sb
    .from("qt_entries")
    .select("user_id, entry_date");

  if (viaTable.error) {
    return {
      ok: false,
      error: viaRpc.error.message || viaTable.error.message,
    };
  }
  return {
    ok: true,
    scope: "own",
    data: mapPresence(viaTable.data ?? []),
  };
}

type FullUpsertRow = {
  user_id: string;
  entry_date: string;
  meditation: string;
  verse: string;
  decision_obedience: string;
  prayer: string;
  updated_at: string;
};

/**
 * Persist QT text to Postgres `qt_entries` (not Storage).
 * Columns: meditation, verse, decision_obedience, prayer.
 * Falls back to legacy columns when decision_obedience is missing on prod.
 */
export async function upsertQtEntry(
  userId: string,
  date: string,
  fields: QtEntryFields,
): Promise<QtRepoResult<QtEntry>> {
  const sb = getSupabaseBrowser();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const updatedAt = new Date().toISOString();
  const fullRow: FullUpsertRow = {
    user_id: userId,
    entry_date: date,
    meditation: fields.meditation,
    verse: fields.verse,
    decision_obedience: fields.decisionObedience,
    prayer: fields.prayer,
    updated_at: updatedAt,
  };
  const legacyRow = {
    user_id: userId,
    entry_date: date,
    meditation: fields.meditation,
    verse: fields.verse,
    prayer: fields.prayer,
    updated_at: updatedAt,
  };

  const upsertFull = () =>
    sb
      .from("qt_entries")
      .upsert(fullRow, { onConflict: "user_id,entry_date" })
      .select(ENTRY_SELECT_FULL)
      .single();

  const upsertLegacy = () =>
    sb
      .from("qt_entries")
      // Legacy schema without decision_obedience — cast for Typed client.
      .upsert(legacyRow as FullUpsertRow, {
        onConflict: "user_id,entry_date",
      })
      .select(ENTRY_SELECT_LEGACY)
      .single();

  if (qtSchemaMode === "legacy") {
    const cached = await upsertLegacy();
    if (cached.error) return { ok: false, error: cached.error.message };
    return {
      ok: true,
      data: mapEntry({
        ...(cached.data as EntryRow),
        decision_obedience: fields.decisionObedience,
      }),
    };
  }

  // Prefer full schema (cached "full" or first probe).
  const first = await upsertFull();
  if (!first.error) {
    qtSchemaMode = "full";
    return { ok: true, data: mapEntry(first.data as EntryRow) };
  }
  if (!isMissingDecisionObedienceError(first.error)) {
    return { ok: false, error: first.error.message };
  }

  const second = await upsertLegacy();
  if (second.error) return { ok: false, error: second.error.message };
  qtSchemaMode = "legacy";
  return {
    ok: true,
    data: mapEntry({
      ...(second.data as EntryRow),
      decision_obedience: fields.decisionObedience,
    }),
  };
}

export async function deleteQtEntry(
  userId: string,
  date: string,
): Promise<QtRepoResult<null>> {
  const sb = getSupabaseBrowser();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { error } = await sb
    .from("qt_entries")
    .delete()
    .eq("user_id", userId)
    .eq("entry_date", date);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}

export { isSupabaseConfigured };
