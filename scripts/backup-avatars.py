#!/usr/bin/env python3
"""Download all objects from the Supabase Storage `avatars` bucket.

Env (secrets via env only — never print them):
  NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY
    (bucket is public-read; anon is enough to list/download if policies allow)

Usage:
  python3 scripts/backup-avatars.py ./backups/avatars-STAMP
  DRY_RUN=1 python3 scripts/backup-avatars.py ./backups/avatars-STAMP
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

BUCKET = "avatars"


def die(msg: str, code: int = 1) -> None:
    print(msg, file=sys.stderr)
    raise SystemExit(code)


def env_url() -> str:
    raw = (os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL") or "").strip()
    if not raw:
        die(
            "Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) for avatar Storage backup.",
        )
    # Project URL only — strip accidental API suffixes like /rest/v1 from Connect copy-paste.
    url = raw.rstrip("/")
    for suffix in ("/rest/v1", "/auth/v1", "/storage/v1"):
        if url.endswith(suffix):
            url = url[: -len(suffix)].rstrip("/")
    return url


def env_key() -> str:
    key = (
        os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        or ""
    ).strip()
    if not key:
        die(
            "Set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY "
            "for avatar Storage backup (.env.local).",
        )
    return key


def api_request(url: str, key: str, method: str, path: str, body: dict[str, Any] | None = None) -> Any:
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        f"{url}{path}",
        data=data,
        method=method,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            raw = res.read()
            if not raw:
                return None
            return json.loads(raw.decode("utf-8"))
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", errors="replace")
        die(f"Storage API {method} {path} failed ({err.code}): {detail[:400]}")
    except urllib.error.URLError as err:
        die(f"Storage API network error: {err}")


def list_prefix(url: str, key: str, prefix: str) -> list[dict[str, Any]]:
    items = api_request(
        url,
        key,
        "POST",
        f"/storage/v1/object/list/{BUCKET}",
        {
            "prefix": prefix,
            "limit": 1000,
            "offset": 0,
            "sortBy": {"column": "name", "order": "asc"},
        },
    )
    if items is None:
        return []
    if not isinstance(items, list):
        die(f"Unexpected list response for prefix={prefix!r}")
    return items


def walk_files(url: str, key: str, prefix: str = "") -> list[str]:
    """Return object paths relative to the bucket root."""
    out: list[str] = []
    for item in list_prefix(url, key, prefix):
        name = item.get("name")
        if not isinstance(name, str) or not name:
            continue
        path = f"{prefix}{name}" if prefix.endswith("/") or not prefix else f"{prefix}/{name}"
        path = path.lstrip("/")
        # Folders: id is null / metadata null in Storage list API.
        is_folder = item.get("id") is None and item.get("metadata") is None
        if is_folder:
            folder_prefix = path if path.endswith("/") else f"{path}/"
            out.extend(walk_files(url, key, folder_prefix))
        else:
            out.append(path)
    return out


def download_public(url: str, key: str, object_path: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    # Prefer authenticated download (works even if bucket visibility changes).
    req = urllib.request.Request(
        f"{url}/storage/v1/object/{BUCKET}/{object_path}",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as res, open(dest, "wb") as fh:
            while True:
                chunk = res.read(1024 * 256)
                if not chunk:
                    break
                fh.write(chunk)
    except urllib.error.HTTPError:
        # Fallback: public URL (avatars bucket is public-read).
        pub = f"{url}/storage/v1/object/public/{BUCKET}/{object_path}"
        urllib.request.urlretrieve(pub, dest)


def main() -> None:
    if len(sys.argv) != 2:
        die(f"Usage: {sys.argv[0]} <output-dir>")

    out_dir = Path(sys.argv[1]).expanduser().resolve()
    dry = os.environ.get("DRY_RUN", "0") == "1"
    url = env_url()
    key = env_key()

    if dry:
        print(f"[dry-run] would list + download Storage bucket `{BUCKET}` → {out_dir}")
        print(f"[dry-run] using URL host only: {url.split('://', 1)[-1].split('/', 1)[0]}")
        return

    files = walk_files(url, key)
    if not files:
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "README.txt").write_text(
            "No objects found in Storage bucket `avatars`.\n",
            encoding="utf-8",
        )
        print(f"No avatars found. Wrote note: {out_dir / 'README.txt'}")
        return

    out_dir.mkdir(parents=True, exist_ok=True)
    for i, path in enumerate(files, 1):
        dest = out_dir / path
        print(f"[{i}/{len(files)}] {path}")
        download_public(url, key, path, dest)

    print(f"Downloaded {len(files)} avatar object(s) → {out_dir}")


if __name__ == "__main__":
    main()
