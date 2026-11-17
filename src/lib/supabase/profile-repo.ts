import type { User as AuthUser } from "@supabase/supabase-js";
import { extractKakaoMeta } from "@/lib/supabase/auth";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

export type ProfileRepoResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type CommunityStatus = "pending" | "verified" | "exception";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Profile row helpers (Postgres `profiles`, not Storage).
 *
 * Kakao (DQ-17):
 * - `profiles.id` = `auth.uid()` (UUID text).
 * - Nickname / avatar from Kakao metadata on first upsert; user can edit later.
 * - Community verify: 다락방 → 순 → 본명 (roster), not phone.
 *
 * Security (20261118_rls_security_harden — apply only after Kakao works / DQ-699):
 * - Members update own `display_name` / `avatar_url` only (trigger blocks role/group_id).
 * - `group_id` / role / roster membership: admin JWT or service_role seed.
 */

function mapCommunityStatus(raw: string | null | undefined): CommunityStatus {
  if (raw === "verified" || raw === "exception") return raw;
  return "pending";
}

/** Read display_name for one profile (nickname). */
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
 * Prefer `applyCommunityVerification` for post-login roster match.
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

/** Full profile row (or null if missing). */
export async function fetchProfile(
  userId: string,
): Promise<ProfileRepoResult<ProfileRow | null>> {
  const sb = getSupabaseBrowser();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await sb
    .from("profiles")
    .select(
      "id, display_name, group_id, role, avatar_url, legal_name, community_status, created_at, updated_at",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    // Columns may be missing until migration is applied — retry lean select.
    if (/legal_name|community_status|42703|PGRST204/i.test(error.message)) {
      const lean = await sb
        .from("profiles")
        .select("id, display_name, group_id, role, avatar_url, created_at, updated_at")
        .eq("id", userId)
        .maybeSingle();
      if (lean.error) return { ok: false, error: lean.error.message };
      if (!lean.data) return { ok: true, data: null };
      return {
        ok: true,
        data: {
          ...lean.data,
          legal_name: null,
          community_status: lean.data.group_id ? "verified" : "pending",
        } as ProfileRow,
      };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true, data: data as ProfileRow | null };
}

/**
 * Ensure a `profiles` row for the Kakao auth user (`id = auth.uid()`).
 * Fills nickname/avatar from Kakao metadata when the row is new or empty.
 */
export async function ensureKakaoProfile(
  authUser: AuthUser,
): Promise<ProfileRepoResult<ProfileRow>> {
  const sb = getSupabaseBrowser();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const existing = await fetchProfile(authUser.id);
  if (!existing.ok) return existing;
  const meta = extractKakaoMeta(authUser);

  if (existing.data) {
    const patch: Database["public"]["Tables"]["profiles"]["Update"] = {
      updated_at: new Date().toISOString(),
    };
    let needsUpdate = false;
    if (!existing.data.display_name?.trim() && meta.nickname) {
      patch.display_name = meta.nickname;
      needsUpdate = true;
    }
    if (!existing.data.avatar_url && meta.avatarUrl) {
      patch.avatar_url = meta.avatarUrl;
      needsUpdate = true;
    }
    if (needsUpdate) {
      const { error } = await sb
        .from("profiles")
        .update(patch)
        .eq("id", authUser.id);
      if (error) return { ok: false, error: error.message };
      const refreshed = await fetchProfile(authUser.id);
      if (!refreshed.ok) return refreshed;
      if (!refreshed.data) {
        return { ok: false, error: "프로필을 다시 읽지 못했어요." };
      }
      return { ok: true, data: refreshed.data };
    }
    return { ok: true, data: existing.data };
  }

  const insertRow = {
    id: authUser.id,
    display_name: meta.nickname || "드림",
    avatar_url: meta.avatarUrl,
    group_id: null,
    role: "member" as const,
    legal_name: null,
    community_status: "pending" as const,
    updated_at: new Date().toISOString(),
  };

  const { error: insertError } = await sb.from("profiles").insert(insertRow);
  if (insertError) {
    // Migration not applied yet — try without new columns.
    if (/legal_name|community_status|42703|PGRST204/i.test(insertError.message)) {
      const { error: leanErr } = await sb.from("profiles").insert({
        id: authUser.id,
        display_name: insertRow.display_name,
        avatar_url: insertRow.avatar_url,
        group_id: null,
        role: "member",
        updated_at: insertRow.updated_at,
      });
      if (leanErr) return { ok: false, error: leanErr.message };
    } else {
      return { ok: false, error: insertError.message };
    }
  }

  const created = await fetchProfile(authUser.id);
  if (!created.ok) return created;
  if (!created.data) {
    return {
      ok: true,
      data: {
        id: authUser.id,
        display_name: insertRow.display_name,
        avatar_url: insertRow.avatar_url,
        group_id: null,
        role: "member",
        legal_name: null,
        community_status: "pending",
        created_at: new Date().toISOString(),
        updated_at: insertRow.updated_at,
      },
    };
  }
  return { ok: true, data: created.data };
}

export type CommunityVerificationInput = {
  userId: string;
  legalName: string;
  /** Null for 새가족 (no 순 yet). */
  groupId: string | null;
  role: "admin" | "leader" | "member";
  /** Keep existing Kakao nickname unless empty. */
  displayNameFallback?: string;
};

/** Verified profiles' 본명 set (excludes current auth user). RLS-safe RPC. */
export async function fetchClaimedLegalNames(): Promise<
  ProfileRepoResult<string[]>
> {
  const sb = getSupabaseBrowser();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await sb.rpc("claimed_legal_names");
  if (error) {
    if (/claimed_legal_names|42883|PGRST202/i.test(error.message)) {
      return {
        ok: false,
        error:
          "본명 중복 확인 RPC가 없어요. supabase/migrations/20261117_claimed_legal_names.sql 을 적용해 주세요.",
      };
    }
    return { ok: false, error: error.message };
  }

  const names = (data ?? [])
    .map((row: { legal_name?: string | null } | string) =>
      typeof row === "string" ? row.trim() : (row.legal_name ?? "").trim(),
    )
    .filter(Boolean);
  return { ok: true, data: Array.from(new Set(names)) };
}

/** True when another verified profile already owns this 본명. */
export async function isLegalNameTaken(
  candidate: string,
): Promise<ProfileRepoResult<boolean>> {
  const sb = getSupabaseBrowser();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const name = candidate.trim();
  if (!name) return { ok: true, data: false };

  const { data, error } = await sb.rpc("is_legal_name_taken", {
    candidate: name,
  });
  if (error) {
    if (/is_legal_name_taken|42883|PGRST202/i.test(error.message)) {
      return {
        ok: false,
        error:
          "본명 중복 확인 RPC가 없어요. supabase/migrations/20261117_claimed_legal_names.sql 을 적용해 주세요.",
      };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true, data: Boolean(data) };
}

/** Roster match success → set 본명, 순, role, community_status=verified. */
export async function applyCommunityVerification(
  input: CommunityVerificationInput,
): Promise<ProfileRepoResult<ProfileRow>> {
  const sb = getSupabaseBrowser();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const legalName = input.legalName.trim();
  if (!legalName) return { ok: false, error: "본명을 입력해 주세요." };

  const taken = await isLegalNameTaken(legalName);
  if (!taken.ok) return { ok: false, error: taken.error };
  if (taken.data) {
    return {
      ok: false,
      error: "이미 인증된 본명이에요. 다른 이름을 선택하거나 예외 신청해 주세요.",
    };
  }

  const patch: Database["public"]["Tables"]["profiles"]["Update"] = {
    legal_name: legalName,
    group_id: input.groupId,
    role: input.role,
    community_status: "verified",
    updated_at: new Date().toISOString(),
  };
  if (input.displayNameFallback?.trim()) {
    const current = await fetchDisplayName(input.userId);
    if (current.ok && !current.data) {
      patch.display_name = input.displayNameFallback.trim();
    }
  }

  const { error } = await sb
    .from("profiles")
    .update(patch)
    .eq("id", input.userId);

  if (error) {
    if (/legal_name|community_status|42703|PGRST204/i.test(error.message)) {
      const { error: leanErr } = await sb
        .from("profiles")
        .update({
          group_id: input.groupId,
          role: input.role,
          display_name: legalName,
          updated_at: patch.updated_at,
        })
        .eq("id", input.userId);
      if (leanErr) return { ok: false, error: leanErr.message };
    } else {
      return { ok: false, error: error.message };
    }
  }

  const refreshed = await fetchProfile(input.userId);
  if (!refreshed.ok) return refreshed;
  if (!refreshed.data) {
    return {
      ok: true,
      data: {
        id: input.userId,
        display_name: legalName,
        legal_name: legalName,
        group_id: input.groupId,
        role: input.role,
        avatar_url: null,
        community_status: "verified",
        created_at: new Date().toISOString(),
        updated_at: patch.updated_at!,
      },
    };
  }
  return {
    ok: true,
    data: {
      ...refreshed.data,
      community_status: mapCommunityStatus(
        refreshed.data.community_status ?? "verified",
      ),
      legal_name: refreshed.data.legal_name ?? legalName,
      group_id: refreshed.data.group_id ?? input.groupId,
    },
  };
}

/** Manual exception path when roster match fails — pending admin review. */
export async function submitCommunityException(
  userId: string,
  legalName: string,
  note: string,
): Promise<ProfileRepoResult<ProfileRow>> {
  const sb = getSupabaseBrowser();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const name = legalName.trim();
  if (!name) return { ok: false, error: "본명을 입력해 주세요." };

  const { error } = await sb
    .from("profiles")
    .update({
      legal_name: name,
      community_status: "exception",
      // Park note in display until admin tooling exists (no secrets).
      display_name:
        note.trim().length > 0
          ? `${name} · 확인요청`
          : name,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    if (/legal_name|community_status|42703|PGRST204/i.test(error.message)) {
      return {
        ok: false,
        error:
          "본명·예외 컬럼이 아직 DB에 없어요. supabase/migrations/20261117_kakao_community_verify.sql 을 적용해 주세요.",
      };
    }
    return { ok: false, error: error.message };
  }

  const refreshed = await fetchProfile(userId);
  if (!refreshed.ok) return refreshed;
  if (!refreshed.data) {
    return { ok: false, error: "예외 신청 후 프로필을 읽지 못했어요." };
  }
  return { ok: true, data: refreshed.data };
}

export function isCommunityVerified(profile: ProfileRow | null | undefined): boolean {
  if (!profile) return false;
  if (profile.community_status === "verified") return true;
  // Pre-migration fallback: group_id set implies verified.
  if (!profile.community_status && profile.group_id) return true;
  return false;
}
