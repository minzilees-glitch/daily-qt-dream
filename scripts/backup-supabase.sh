#!/usr/bin/env bash
# Dump Supabase schema + data for 드림 매일큐티.
# Secrets via env only (never pass passwords on argv).
#
# Required (one of):
#   SUPABASE_DB_URL   — Postgres connection string (Settings → Database)
#   Or: SUPABASE_PROJECT_REF + logged-in `supabase` CLI / SUPABASE_ACCESS_TOKEN
#
# Optional:
#   BACKUP_DIR        — output directory (default: ./backups)
#   DRY_RUN=1         — print commands only
#
# Usage:
#   DRY_RUN=1 npm run backup:supabase
#   npm run backup:supabase
#
# Notes:
#   - DB dump does NOT include Storage objects (avatars). Back those up separately
#     (Dashboard download or Storage API). See docs in the project store:
#     supabase-backup-security.md
#   - Prefer weekly schema dumps off-repo; daily automated backups via Supabase plan.

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
SCHEMA_OUT="${BACKUP_DIR}/schema-${STAMP}.sql"
DATA_OUT="${BACKUP_DIR}/data-${STAMP}.sql"
DRY_RUN="${DRY_RUN:-0}"

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
  echo "supabase CLI not found. Install: https://supabase.com/docs/guides/cli" >&2
  echo "Or use Dashboard → Database → Backups / SQL export." >&2
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[dry-run] would run: supabase db dump --db-url \"\$SUPABASE_DB_URL\" ..."
    exit 0
  fi
  exit 1
fi

if [[ -z "${SUPABASE_DB_URL:-}" && -z "${SUPABASE_PROJECT_REF:-}" ]]; then
  echo "Set SUPABASE_DB_URL or SUPABASE_PROJECT_REF (env only; no secrets on argv)." >&2
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[dry-run] missing env — commands that would run once configured:"
    echo "  mkdir -p ${BACKUP_DIR}"
    echo "  supabase db dump --db-url \"\$SUPABASE_DB_URL\" -f ${SCHEMA_OUT}"
    echo "  supabase db dump --db-url \"\$SUPABASE_DB_URL\" --data-only -f ${DATA_OUT}"
    exit 0
  fi
  exit 1
fi

run mkdir -p "$BACKUP_DIR"

if [[ -n "${SUPABASE_DB_URL:-}" ]]; then
  run supabase db dump --db-url "$SUPABASE_DB_URL" -f "$SCHEMA_OUT"
  run supabase db dump --db-url "$SUPABASE_DB_URL" --data-only -f "$DATA_OUT"
else
  run supabase db dump --project-ref "$SUPABASE_PROJECT_REF" -f "$SCHEMA_OUT"
  run supabase db dump --project-ref "$SUPABASE_PROJECT_REF" --data-only -f "$DATA_OUT"
fi

if [[ "$DRY_RUN" != "1" ]]; then
  echo "Wrote:"
  echo "  $SCHEMA_OUT"
  echo "  $DATA_OUT"
  echo "Storage (avatars) is not included — back up separately if needed."
fi
