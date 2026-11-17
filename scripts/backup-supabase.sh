#!/usr/bin/env bash
# Dump Supabase schema + data + Storage `avatars` for 드림 매일큐티.
# Secrets via env only (never pass passwords on argv / never echo them).
#
# Required for DB dump (one of):
#   SUPABASE_DB_URL   — Postgres connection string (Settings → Database)
#   Or: SUPABASE_PROJECT_REF + logged-in `supabase` CLI / SUPABASE_ACCESS_TOKEN
#
# Required for avatar Storage download (one key):
#   NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)
#   SUPABASE_SERVICE_ROLE_KEY (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY
#
# Optional:
#   BACKUP_DIR        — output directory (default: ./backups)
#   DRY_RUN=1         — print commands only
#   SKIP_AVATARS=1    — DB dump only
#
# Usage:
#   DRY_RUN=1 npm run backup:supabase
#   npm run backup:supabase
#
# Notes:
#   - Prefer weekly dumps off-repo; Free plan dashboard backups have short retention.
#   - Do not commit ./backups to Git.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Load matching keys from .env.local if present (no printing of values).
load_dotenv_keys() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  local line key val
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" =~ ^(SUPABASE_[A-Z0-9_]+|NEXT_PUBLIC_SUPABASE_[A-Z0-9_]+)=(.*)$ ]]; then
      key="${BASH_REMATCH[1]}"
      val="${BASH_REMATCH[2]}"
      # Strip optional surrounding quotes.
      if [[ "$val" =~ ^\"(.*)\"$ ]]; then val="${BASH_REMATCH[1]}"; fi
      if [[ "$val" =~ ^\'(.*)\'$ ]]; then val="${BASH_REMATCH[1]}"; fi
      # Don't override an already-exported value.
      if [[ -z "${!key:-}" ]]; then
        export "$key=$val"
      fi
    fi
  done < "$file"
}

load_dotenv_keys "$ROOT/.env.local"

BACKUP_DIR="${BACKUP_DIR:-./backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
SCHEMA_OUT="${BACKUP_DIR}/schema-${STAMP}.sql"
DATA_OUT="${BACKUP_DIR}/data-${STAMP}.sql"
AVATARS_OUT="${BACKUP_DIR}/avatars-${STAMP}"
DRY_RUN="${DRY_RUN:-0}"
SKIP_AVATARS="${SKIP_AVATARS:-0}"

run() {
  if [[ "$DRY_RUN" == "1" ]]; then
    printf '[dry-run]'
    printf ' %q' "$@"
    printf '\n'
  else
    "$@"
  fi
}

if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI not found. Install: brew install supabase/tap/supabase" >&2
  echo "Or: https://supabase.com/docs/guides/cli" >&2
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[dry-run] would run: supabase db dump ..."
  else
    exit 1
  fi
fi

if [[ -z "${SUPABASE_DB_URL:-}" && -z "${SUPABASE_PROJECT_REF:-}" ]]; then
  echo "Set SUPABASE_DB_URL or SUPABASE_PROJECT_REF (env / .env.local)." >&2
  if [[ "$DRY_RUN" != "1" ]]; then
    exit 1
  fi
  echo "[dry-run] missing DB env — would dump schema + data once configured."
fi

run mkdir -p "$BACKUP_DIR"

if [[ "$DRY_RUN" == "1" ]] || [[ -n "${SUPABASE_DB_URL:-}" || -n "${SUPABASE_PROJECT_REF:-}" ]]; then
  if command -v supabase >/dev/null 2>&1; then
    if [[ -n "${SUPABASE_DB_URL:-}" ]]; then
      run supabase db dump --db-url "$SUPABASE_DB_URL" -f "$SCHEMA_OUT"
      run supabase db dump --db-url "$SUPABASE_DB_URL" --data-only -f "$DATA_OUT"
    elif [[ -n "${SUPABASE_PROJECT_REF:-}" ]]; then
      run supabase db dump --project-ref "$SUPABASE_PROJECT_REF" -f "$SCHEMA_OUT"
      run supabase db dump --project-ref "$SUPABASE_PROJECT_REF" --data-only -f "$DATA_OUT"
    fi
  fi
fi

if [[ "$SKIP_AVATARS" == "1" ]]; then
  echo "SKIP_AVATARS=1 — skipping Storage avatars download."
else
  if ! command -v python3 >/dev/null 2>&1; then
    echo "python3 not found — cannot download avatars." >&2
    [[ "$DRY_RUN" == "1" ]] || exit 1
  else
    run env DRY_RUN="$DRY_RUN" python3 "$ROOT/scripts/backup-avatars.py" "$AVATARS_OUT"
  fi
fi

if [[ "$DRY_RUN" != "1" ]]; then
  echo "Wrote:"
  [[ -f "$SCHEMA_OUT" ]] && echo "  $SCHEMA_OUT"
  [[ -f "$DATA_OUT" ]] && echo "  $DATA_OUT"
  [[ -d "$AVATARS_OUT" ]] && echo "  $AVATARS_OUT/  (avatar images)"
  echo "Copy this backups folder off-machine (Drive). Do not git commit it."
fi
