import { getSupabaseBrowser } from "@/lib/supabase/client";

export type ProfileRepoResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

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
