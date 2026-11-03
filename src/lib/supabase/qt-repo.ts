import type { QtCompletion, QtEntry, QtEntryFields } from "@/types";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";

export type QtRepoResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function mapEntry(row: {
  user_id: string;
  entry_date: string;
  meditation: string;
  verse: string;
  prayer: string;
  updated_at: string;
}): QtEntry {
  return {
    userId: row.user_id,
    date: row.entry_date,
    meditation: row.meditation ?? "",
    verse: row.verse ?? "",
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
    .select("user_id, entry_date, meditation, verse, prayer, updated_at")
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
  const { data, error } = await sb
    .from("qt_entries")
    .upsert(
      {
        user_id: userId,
        entry_date: date,
        meditation: fields.meditation,
        verse: fields.verse,
        prayer: fields.prayer,
        updated_at: updatedAt,
      },
      { onConflict: "user_id,entry_date" },
    )
    .select("user_id, entry_date, meditation, verse, prayer, updated_at")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: mapEntry(data) };
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
