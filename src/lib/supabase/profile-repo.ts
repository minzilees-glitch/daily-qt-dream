import { getSupabaseBrowser } from "@/lib/supabase/client";

export type ProfileRepoResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Profile row helpers (Postgres `profiles`, not Storage).
 *
 * Architecture (Minzi / DQ-693):
 * - She sends 순 roster (members + leader) → seed `groups` + `profiles.group_id`.
 * - Kakao login matches phone → user id (auth not wired yet).
 * - Nickname / avatar URL / QT / stars live on the profile (+ `qt_entries`).
 * - Stars aggregate per 순 and on me page.
 * Full roster import waits for her roster file; this module only scaffolds writes.
 */

/** Read display_name for one profile (pilot nickname). */
export async function fetchDisplayName(
  userId: string,
): Promise<ProfileRepoResult<string | null>> {
  const sb = getSupabaseBrowser();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await sb
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  const name = data?.display_name?.trim() || null;
  return { ok: true, data: name };
}

/** Persist nickname → profiles.display_name. */
export async function updateDisplayName(
  userId: string,
  displayName: string,
): Promise<ProfileRepoResult<string>> {
  const sb = getSupabaseBrowser();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const name = displayName.trim();
  if (!name) return { ok: false, error: "닉네임을 입력해 주세요." };
  if (name.length > 40) {
    return { ok: false, error: "닉네임은 40자 이내로 입력해 주세요." };
  }

  const { error } = await sb
    .from("profiles")
    .update({
      display_name: name,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: name };
}

/** Read profiles.group_id for one user (순 membership). */
export async function fetchProfileGroupId(
  userId: string,
): Promise<ProfileRepoResult<string | null>> {
  const sb = getSupabaseBrowser();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await sb
    .from("profiles")
    .select("group_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data?.group_id ?? null };
}

/**
 * Persist 순 membership → profiles.group_id.
 * Scaffold for DQ-693; roster seed / Kakao phone match still pending her file.
 */
export async function updateProfileGroupId(
  userId: string,
  groupId: string | null,
): Promise<ProfileRepoResult<string | null>> {
  const sb = getSupabaseBrowser();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { error } = await sb
    .from("profiles")
    .update({
      group_id: groupId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: groupId };
}
