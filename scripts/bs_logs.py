#!/usr/bin/env python3
"""
Fetch last N Better Stack logs via Search API.

Usage:
  python scripts/bs_logs.py --env prod --n 100 [--q "level:error"]

Env vars required:
  - BETTERSTACK_TELEMETRY_API_TOKEN (read/search API token)
  - BETTERSTACK_SOURCE_ID_PRODUCTION (optional; filters to prod source)
  - BETTERSTACK_SOURCE_ID_PREVIEW    (optional; filters to preview source)

If the relevant source ID env var is set, the script filters to that source.
Otherwise, it searches across all sources the token has access to.
"""
import argparse
import datetime as dt
import os
import sys
import textwrap
from urllib.parse import urlencode

import json
import urllib.request

API_URL = "https://api.betterstack.com/api/v2/logs/search"

def env_str(name: str) -> str:
    return (os.getenv(name) or "").strip()

def build_query(args) -> str:
    # Base query; allow user override
    if args.q:
        return args.q
    # Default: all logs, no extra filter; caller can filter by level in UI if desired
    return "*"

def fetch_logs(token: str, query: str, hours: int, limit: int, source_id: str | None) -> dict:
to = dt.datetime.now(dt.timezone.utc)
frm = to - dt.timedelta(hours=hours)

    params = {
        "query": query,
        "from": to_iso(frm),
        "to": to_iso(to),
        "limit": str(limit),
    }
    if source_id:
        # Better Stack supports limiting by sources param (comma-separated ids)
        params["sources"] = source_id

    url = f"{API_URL}?{urlencode(params)}"
    req = urllib.request.Request(url, method="GET")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Accept", "application/json")

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            return json.loads(body)
    except Exception as e:
        print(f"Error fetching logs: {e}", file=sys.stderr)
        sys.exit(2)

def to_iso(d: dt.datetime) -> str:
    return d.astimezone(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

def main():
    parser = argparse.ArgumentParser(description="Fetch Better Stack logs")
    parser.add_argument("--env", choices=["prod", "preview"], default="prod")
    parser.add_argument("--n", type=int, default=100, help="number of lines to fetch (<=500)")
    parser.add_argument("--hours", type=int, default=24, help="lookback window in hours (1-168)")
    parser.add_argument("--q", type=str, default=None, help="optional Better Stack query string")
    args = parser.parse_args()

    token = env_str("BETTERSTACK_TELEMETRY_API_TOKEN")
    if not token:
        print("BETTERSTACK_TELEMETRY_API_TOKEN not set", file=sys.stderr)
        sys.exit(1)

    limit = max(1, min(500, args.n))
    hours = max(1, min(168, args.hours))
    query = build_query(args)

    source_id = None
    if args.env == "prod":
        source_id = env_str("BETTERSTACK_SOURCE_ID_PRODUCTION") or None
    else:
        source_id = env_str("BETTERSTACK_SOURCE_ID_PREVIEW") or None

    data = fetch_logs(token, query, hours, limit, source_id)

    # Print a concise summary first
    meta = data.get("meta") or {}
    entries = data.get("data") or data.get("entries") or []
    print(f"From: {meta.get('from') or ''}  To: {meta.get('to') or ''}  Count: {len(entries)}")

    # Print each line compactly
    for e in entries:
        # entries can differ based on drain vs logtail; try common fields
        ts = e.get("timestamp") or e.get("dt") or e.get("@timestamp") or ""
        level = e.get("level") or e.get("severity") or ""
        msg = e.get("message") or e.get("msg") or e.get("log") or ""
        # squeeze newlines
        msg = " ".join(str(msg).splitlines())
        print(f"{ts} [{level}] {msg}")

if __name__ == "__main__":
    main()