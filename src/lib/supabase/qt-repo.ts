import type { QtCompletion, QtEntry, QtEntryFields } from "@/types";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";

export type QtRepoResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const ENTRY_SELECT =
  "user_id, entry_date, meditation, verse, decision_obedience, prayer, updated_at";

function mapEntry(row: {
  user_id: string;
  entry_date: string;
  meditation: string;
  verse: string;
  decision_obedience?: string | null;
  prayer: string;
  updated_at: string;
}): QtEntry {
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

  const { data, error } = await sb
    .from("qt_entries")
    .select(ENTRY_SELECT)
    .eq("user_id", userId)
    .order("entry_date", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []).map(mapEntry) };
}

/**
 * Presence rows for light counts (no QT text).
 * Falls back to selecting only user_id + entry_date from qt_entries
 * if the view is missing.
 */
export async function fetchQtPresence(): Promise<
  QtRepoResult<QtCompletion[]>
> {
  const sb = getSupabaseBrowser();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const viaView = await sb
    .from("qt_entry_presence")
    .select("user_id, entry_date");

  if (!viaView.error) {
    return {
      ok: true,
      data: (viaView.data ?? []).map((r) => ({
        userId: r.user_id,
        date: r.entry_date,
        completed: true,
      })),
    };
  }

  const viaTable = await sb
    .from("qt_entries")
    .select("user_id, entry_date");

  if (viaTable.error) return { ok: false, error: viaTable.error.message };
  return {
    ok: true,
    data: (viaTable.data ?? []).map((r) => ({
      userId: r.user_id,
      date: r.entry_date,
      completed: true,
    })),
  };
}

export async function upsertQtEntry(
  userId: string,
  date: string,
  fields: QtEntryFields,
): Promise<QtRepoResult<QtEntry>> {
  const sb = getSupabaseBrowser();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const updatedAt = new Date().toISOString();
  const row = {
    user_id: userId,
    entry_date: date,
    meditation: fields.meditation,
    verse: fields.verse,
    decision_obedience: fields.decisionObedience,
    prayer: fields.prayer,
    updated_at: updatedAt,
  };

  const first = await sb
    .from("qt_entries")
    .upsert(row, { onConflict: "user_id,entry_date" })
    .select(ENTRY_SELECT)
    .single();

  if (!first.error) return { ok: true, data: mapEntry(first.data) };

  // Production may lag the decision_obedience migration — retry without it
  // so home/history saves still persist meditation/verse/prayer.
  const missingDecisionCol =
    /decision_obedience/i.test(first.error.message) ||
    first.error.code === "PGRST204";
  if (!missingDecisionCol) return { ok: false, error: first.error.message };

  const legacySelect =
    "user_id, entry_date, meditation, verse, prayer, updated_at";
  const legacyRow = {
    user_id: row.user_id,
    entry_date: row.entry_date,
    meditation: row.meditation,
    verse: row.verse,
    prayer: row.prayer,
    updated_at: row.updated_at,
  };
  const second = await sb
    .from("qt_entries")
    // Legacy schema without decision_obedience — cast for Typed client.
    .upsert(legacyRow as typeof row, { onConflict: "user_id,entry_date" })
    .select(legacySelect)
    .single();

  if (second.error) return { ok: false, error: second.error.message };
  return {
    ok: true,
    data: mapEntry({
      ...second.data,
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
