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

# Redact secrets in dry-run logs (never print DB URL / keys).
redact_arg() {
  local a="$1"
  if [[ "$a" == postgresql://* || "$a" == postgres://* ]]; then
    printf '%s' 'postgresql://***REDACTED***'
  elif [[ "$a" == eyJ* || "$a" == sb_* ]]; then
    printf '%s' '***REDACTED_KEY***'
  else
    printf '%q' "$a"
  fi
}

run() {
  if [[ "$DRY_RUN" == "1" ]]; then
    printf '[dry-run]'
    local a
    for a in "$@"; do
      printf ' '
      redact_arg "$a"
    done
    printf '\n'
  else
    "$@"
  fi
}

# Prefer pg_dump (no Docker). Fall back to supabase CLI if needed.
resolve_pg_dump() {
  if command -v pg_dump >/dev/null 2>&1; then
    command -v pg_dump
    return 0
  fi
  if [[ -x /opt/homebrew/opt/libpq/bin/pg_dump ]]; then
    printf '%s' /opt/homebrew/opt/libpq/bin/pg_dump
    return 0
  fi
  if [[ -x /usr/local/opt/libpq/bin/pg_dump ]]; then
    printf '%s' /usr/local/opt/libpq/bin/pg_dump
    return 0
  fi
  return 1
}

PG_DUMP_BIN=""
if resolve_pg_dump >/dev/null; then
  PG_DUMP_BIN="$(resolve_pg_dump)"
fi

if [[ -z "${SUPABASE_DB_URL:-}" && -z "${SUPABASE_PROJECT_REF:-}" ]]; then
  echo "Set SUPABASE_DB_URL or SUPABASE_PROJECT_REF (env / .env.local)." >&2
  if [[ "$DRY_RUN" != "1" ]]; then
    exit 1
  fi
  echo "[dry-run] missing DB env — would dump schema + data once configured."
fi

if [[ -z "$PG_DUMP_BIN" ]] && ! command -v supabase >/dev/null 2>&1; then
  echo "Need pg_dump (brew install libpq) or supabase CLI." >&2
  [[ "$DRY_RUN" == "1" ]] || exit 1
fi

run mkdir -p "$BACKUP_DIR"

dump_db() {
  if [[ -n "${SUPABASE_DB_URL:-}" && -n "$PG_DUMP_BIN" ]]; then
    local dburl="$SUPABASE_DB_URL"
    # Supabase requires TLS; append if the URI has no sslmode.
    if [[ "$dburl" != *"sslmode="* ]]; then
      if [[ "$dburl" == *"?"* ]]; then
        dburl="${dburl}&sslmode=require"
      else
        dburl="${dburl}?sslmode=require"
      fi
    fi
    # Schema-only + data-only via libpq (works without Docker).
    if ! run "$PG_DUMP_BIN" --dbname="$dburl" --schema-only --no-owner --no-privileges -f "$SCHEMA_OUT"; then
      echo "" >&2
      echo "DB dump failed. If the host looks like db.xxxxx.supabase.co, this Mac may not" >&2
      echo "resolve that direct address (IPv6-only). In Supabase Connect → choose" >&2
      echo "「Session pooler」 connection string (…pooler.supabase.com) and put that in" >&2
      echo "SUPABASE_DB_URL instead. Username is usually postgres.<project-ref>." >&2
      return 1
    fi
    run "$PG_DUMP_BIN" --dbname="$dburl" --data-only --no-owner --no-privileges -f "$DATA_OUT"
    return 0
  fi

  if ! command -v supabase >/dev/null 2>&1; then
    echo "pg_dump not found and supabase CLI missing." >&2
    return 1
  fi

  echo "Note: supabase db dump may require Docker Desktop. Prefer: brew install libpq" >&2
  if [[ -n "${SUPABASE_DB_URL:-}" ]]; then
    run supabase db dump --db-url "$SUPABASE_DB_URL" -f "$SCHEMA_OUT"
    run supabase db dump --db-url "$SUPABASE_DB_URL" --data-only -f "$DATA_OUT"
  else
    run supabase db dump --project-ref "$SUPABASE_PROJECT_REF" -f "$SCHEMA_OUT"
    run supabase db dump --project-ref "$SUPABASE_PROJECT_REF" --data-only -f "$DATA_OUT"
  fi
}

if [[ "$DRY_RUN" == "1" ]] || [[ -n "${SUPABASE_DB_URL:-}" || -n "${SUPABASE_PROJECT_REF:-}" ]]; then
  dump_db
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
