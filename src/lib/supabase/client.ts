import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

let browserClient: SupabaseClient<Database> | null = null;

/** Project root URL only — strip accidental `/rest/v1` etc. from Connect copy-paste. */
function normalizeSupabaseUrl(raw: string | undefined): string {
  let url = (raw ?? "").trim().replace(/\/+$/, "");
  for (const suffix of ["/rest/v1", "/auth/v1", "/storage/v1"] as const) {
    if (url.endsWith(suffix)) {
      url = url.slice(0, -suffix.length).replace(/\/+$/, "");
    }
  }
  return url;
}

export function isSupabaseConfigured(): boolean {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && key);
}

/**
 * Browser/client Supabase. Returns null when env is missing (local fallback).
 * Kakao OAuth needs persisted session + URL detection for `/auth/callback`.
 */
export function getSupabaseBrowser(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) return null;
  if (browserClient) return browserClient;
  browserClient = createClient<Database>(
    normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    },
  );
  return browserClient;
}
