#!/usr/bin/env python3
"""
bs_tail.py — Better Stack "last N" logs with time & level filters, plus handy Vercel-focused filters.

Quick start:
  python bs_tail.py --limit 100
  python bs_tail.py --limit 100 --since "2025-10-15T00:00:00Z"
  python bs_tail.py --before "2025-10-15T01:00:00Z" --min-level warning
  python bs_tail.py --since "2025-10-15T00:00:00Z" --before "2025-10-15T01:00:00Z"  # all in window
  python bs_tail.py --only-source lambda --status-class 5xx --json

Docs:
  python bs_tail.py --help   # brief flags
  python bs_tail.py --man    # detailed usage
"""

import argparse, json, os, sys, textwrap
from typing import Iterable, List, Tuple, Optional
import requests

CONNECT_HOST=os.environ.get("BS_CONNECT_HOST")
CONNECT_USER=os.environ.get("BS_CONNECT_USER")
CONNECT_PASS=os.environ.get("BS_CONNECT_PASS")
TABLE_PREFIX=os.environ.get("BS_TABLE_PREFIX")

SQL_BASE = """
SELECT dt, raw
FROM (
  SELECT dt, raw FROM remote({tp}_logs)
  UNION ALL
  SELECT dt, raw FROM s3Cluster(primary, {tp}_s3) WHERE _row_type = 1
)
{where}
ORDER BY dt {order}
{limit_clause}
FORMAT JSONEachRow
"""

LEVEL_RANK = {
    "debug": 10,
    "info": 20,
    "notice": 25,
    "warning": 30, "warn": 30,
    "error": 40, "err": 40,
    "critical": 50,
    "fatal": 60,
}

METHODS = {"GET","POST","PUT","PATCH","DELETE","HEAD","OPTIONS"}

def man_print_and_exit():
    doc = r"""
NAME
    bs_tail.py - Fetch the last N Better Stack log entries (Vercel-friendly), with time, level, and HTTP filters.

SYNOPSIS
    bs_tail.py [--limit N] [--since TIME] [--before TIME] [--order asc|desc]
               [--min-level LEVEL] [--json]
               [--only-source {lambda,static,build}]...
               [--status-class {1xx,2xx,3xx,4xx,5xx}]...
               [--min-status CODE]
               [--method METHOD]
               [--path EXACT] [--path-like SUBSTR]
               [--contains SUBSTR]
               [--deployment-id ID]
               [--env {production,preview,development}]

DESCRIPTION
    Queries Better Stack's Connect HTTP endpoint (ClickHouse) to retrieve recent logs, then pretty-prints
    a compact table (or JSON). Time filters (--since/--before) are applied server-side. Level and HTTP filters
    are applied client-side to be resilient to schema variations in 'raw'.

TIME FILTERS
    --since TIME
        Include logs with dt >= TIME. TIME is parsed server-side with ClickHouse parseDateTimeBestEffortOrNull,
        so ISO8601 ("2025-10-15T00:00:00Z") is recommended.
    --before TIME
        Include logs with dt < TIME.

COUNT & ORDER
    --limit N
        Max rows to return (after client-side filtering). If BOTH --since and --before are given and --limit is omitted,
        the entire window is returned.
    --order asc|desc
        Sort by dt before limiting (default: desc = newest first).

LEVEL FILTER
    --min-level LEVEL
        Only show logs at or above LEVEL. Levels (case-insensitive): debug, info, notice, warning|warn, error|err, critical, fatal.

HTTP/Vercel FILTERS
    --only-source {lambda,static,build}
        Restrict to events with raw.source equal to the given values. Can be repeated.
    --status-class {1xx,2xx,3xx,4xx,5xx}
        Keep only rows whose HTTP status belongs to any given class. Can be repeated.
    --min-status CODE
        Keep only rows with HTTP status >= CODE (e.g. 400).
    --method METHOD
        Keep only rows with the given HTTP method (e.g. GET). Case-insensitive; common verbs recognized.
    --path EXACT
        Keep only rows whose path equals EXACT (matches raw.vercel.path or raw.vercel.proxy.path).
    --path-like SUBSTR
        Keep rows whose path contains SUBSTR (substring match).
    --contains SUBSTR
        Keep rows whose message contains SUBSTR (substring match).
    --deployment-id ID
        Keep rows whose raw.vercel.deployment_id equals ID.
    --env {production,preview,development}
        Keep rows whose raw.vercel.environment equals this value.

OUTPUT
    By default prints a fixed-width table with columns: time (UTC), level, status, method, path, message.
    Use --json to emit a JSON array of objects.

EXAMPLES
    bs_tail.py --limit 100 --since "2025-10-15T00:00:00Z"
    bs_tail.py --limit 100 --before "2025-10-15T01:00:00Z" --min-level warning
    bs_tail.py --since "2025-10-15T00:00:00Z" --before "2025-10-15T01:00:00Z"
    bs_tail.py --only-source lambda --status-class 5xx --path-like "/api" --contains "nextauth"
    bs_tail.py --deployment-id dpl_ABC123 --env production --json

NOTES
    - If --min-level is used, the script internally over-fetches from ClickHouse to preserve up to --limit rows after filtering.
    - 'raw' is stored as an escaped JSON string; this script decodes it and looks primarily under 'raw.vercel.*' and
      'raw.vercel.proxy.*' for HTTP context, falling back to compatible fields if present elsewhere.

"""
    print(doc.strip())
    sys.exit(0)

def build_where(since: Optional[str], before: Optional[str]) -> str:
    conds = []
    if since:
        conds.append(f"dt >= parseDateTimeBestEffortOrNull('{since}')")
    if before:
        conds.append(f"dt <  parseDateTimeBestEffortOrNull('{before}')")
    return ("WHERE " + " AND ".join(conds)) if conds else ""

def fetch_rows(limit: int, since: Optional[str], before: Optional[str],
               order_desc: bool, overfetch_factor: int) -> Iterable[dict]:
    fetch_limit = limit * overfetch_factor if limit else None
    where_sql   = build_where(since, before)
    order       = "DESC" if order_desc else "ASC"
    limit_clause= f"LIMIT {fetch_limit}" if fetch_limit else ""

    sql = SQL_BASE.format(tp=TABLE_PREFIX, where=where_sql, order=order, limit_clause=limit_clause)
    url = f"https://{CONNECT_HOST}?output_format_pretty_row_numbers=0"
    resp = requests.post(
        url,
        data=sql.encode("utf-8"),
        headers={"Content-Type": "text/plain"},
        auth=(CONNECT_USER, CONNECT_PASS),
        timeout=60,
    )
    resp.raise_for_status()
    for line in resp.text.splitlines():
        if line.strip():
            yield json.loads(line)

def parse_raw_obj(row: dict) -> dict:
    raw = row.get("raw")
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except Exception:
            return {}
    return {}

def extract_level(raw_obj: dict) -> Optional[str]:
    vercel = raw_obj.get("vercel") or {}
    lvl = vercel.get("level") or raw_obj.get("level")
    return lvl.lower() if isinstance(lvl, str) else None

def level_meets_min(level: Optional[str], min_level: Optional[str]) -> bool:
    if not min_level:
        return True
    if level is None:
        return False
    return LEVEL_RANK.get(level, -1) >= LEVEL_RANK[min_level]

def short(s: Optional[str], n: int) -> str:
    if not s:
        return "-"
    s = s.replace("\n", " ")
    return s if len(s) <= n else s[: n - 1] + "…"

def get_http_bits(raw_obj: dict):
    vercel = raw_obj.get("vercel") or {}
    proxy  = vercel.get("proxy") or {}
    status = proxy.get("status_code") or raw_obj.get("statusCode")
    method = proxy.get("method")
    path   = vercel.get("path") or proxy.get("path")
    return status, method, path, vercel

def status_in_classes(status: Optional[int], classes: List[str]) -> bool:
    if not classes:
        return True
    if not isinstance(status, int):
        return False
    sclass = f"{status // 100}xx"
    return sclass in classes

def apply_filters(rows: List[dict], args) -> List[dict]:
    out = []
    for r in rows:
        raw = parse_raw_obj(r)
        lvl = extract_level(raw)

        # Level floor
        if not level_meets_min(lvl, args.min_level):
            continue

        # Source filter
        src = raw.get("source")
        if args.only_source and (src not in args.only_source):
            continue

        # HTTP bits
        status, method, path, vercel = get_http_bits(raw)
        if status is not None and isinstance(status, str) and status.isdigit():
            status = int(status)
        if isinstance(status, float):
            status = int(status)

        # Status-class
        if args.status_class and not status_in_classes(status, args.status_class):
            continue

        # Min-status
        if args.min_status is not None:
            if not isinstance(status, int) or status < args.min_status:
                continue

        # Method
        if args.method:
            m = method.upper() if isinstance(method, str) else ""
            if m != args.method.upper():
                continue

        # Path exact / like
        if args.path and (path != args.path):
            continue
        if args.path_like and (not isinstance(path, str) or args.path_like not in path):
            continue

        # Message contains
        msg = raw.get("message")
        if args.contains and (not isinstance(msg, str) or args.contains not in msg):
            continue

        # Deployment id
        if args.deployment_id and (vercel.get("deployment_id") != args.deployment_id):
            continue

        # Environment
        if args.env and (vercel.get("environment") != args.env):
            continue

        out.append(r)
    return out

def format_row(row: dict) -> Tuple[str, str, str, str, str, str]:
    raw = parse_raw_obj(row)
    vercel = raw.get("vercel") or {}
    status, method, path, _ = get_http_bits(raw)
    level  = extract_level(raw) or "-"
    dt     = str(row.get("dt", "-"))
    st     = str(status) if status is not None else "-"
    meth   = method or "-"
    pth    = short(path, 80)
    msg    = short(raw.get("message"), 140)
    return dt, level, st, meth, pth, msg

def print_table(rows: List[Tuple[str, str, str, str, str, str]]):
    headers = ("time (UTC)", "level", "st", "meth", "path", "message")
    widths  = [24, 8, 4, 6, 80, 140]
    def emit(cols):
        parts = []
        for (val, w) in zip(cols, widths):
            parts.append(val.ljust(w)[:w])
        print("  ".join(parts))
    emit(headers)
    print("-" * (sum(widths) + 10))
    for r in rows:
        emit([str(c) for c in r])

def main():
    if not all([CONNECT_HOST, CONNECT_USER, CONNECT_PASS, TABLE_PREFIX]):
        print("Error: One or more required environment variables are not set.", file=sys.stderr)
        print("Please create a .env file with BS_CONNECT_HOST, BS_CONNECT_USER, BS_CONNECT_PASS, and BS_TABLE_PREFIX.", file=sys.stderr)
        sys.exit(1)
    ap = argparse.ArgumentParser(
        description="Query Better Stack logs with time/level and HTTP/Vercel filters.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
        epilog="Tip: Use --json for machine-readable output, or --man for a longer help page."
    )

    # Primary
    ap.add_argument("--limit", type=int, default=100,
                    help="Max rows to return (after filtering). Omit with --since+--before to get all in window.")
    ap.add_argument("--since", type=str,
                    help="Start time (inclusive). ISO8601 recommended, e.g. 2025-10-15T00:00:00Z")
    ap.add_argument("--before", type=str,
                    help="End time (exclusive). ISO8601 recommended, e.g. 2025-10-15T01:00:00Z")
    ap.add_argument("--order", choices=["asc","desc"], default="desc",
                    help="Sort by dt before limiting.")
    ap.add_argument("--min-level", choices=list(LEVEL_RANK.keys()),
                    help="Only show logs at or above this level.")
    ap.add_argument("--json", action="store_true",
                    help="Emit JSON array instead of a table.")
    ap.add_argument("--man", action="store_true",
                    help="Print detailed manual page and exit.")

    # Extra (client-side) filters
    ap.add_argument("--only-source", choices=["lambda","static","build"], action="append",
                    help="Restrict to raw.source values. Repeatable.")
    ap.add_argument("--status-class", choices=["1xx","2xx","3xx","4xx","5xx"], action="append",
                    help="Keep only rows with HTTP status in any given class. Repeatable.")
    ap.add_argument("--min-status", type=int,
                    help="Keep only rows with HTTP status >= this code (e.g. 400).")
    ap.add_argument("--method", type=str,
                    help="Keep only a specific HTTP method (GET/POST/...).")
    ap.add_argument("--path", type=str,
                    help="Exact path match.")
    ap.add_argument("--path-like", type=str,
                    help="Substring match in path.")
    ap.add_argument("--contains", type=str,
                    help="Substring match in message.")
    ap.add_argument("--deployment-id", type=str,
                    help="Filter by vercel.deployment_id.")
    ap.add_argument("--env", choices=["production","preview","development"],
                    help="Filter by vercel.environment")

    args = ap.parse_args()
    if args.man:
        man_print_and_exit()

    order_desc = args.order == "desc"
    want_all_between = (args.since is not None and args.before is not None and "--limit" not in sys.argv)

    # Overfetch to preserve up to --limit after client-side filters
    overfetch = 10 if (args.min_level or args.only_source or args.status_class or
                       args.min_status is not None or args.method or args.path or
                       args.path_like or args.contains or args.deployment_id or args.env) else 1

    raw_rows = list(fetch_rows(
        limit=(0 if want_all_between else (args.limit or 100)),
        since=args.since,
        before=args.before,
        order_desc=order_desc,
        overfetch_factor=overfetch,
    ))

    filtered = apply_filters(raw_rows, args)

    # Cap unless "all between"
    if not want_all_between:
        filtered = filtered[: (args.limit or 100)]

    if args.json:
        out = []
        for r in filtered:
            dt, level, status, method, path, msg = format_row(r)
            out.append({
                "dt": dt, "level": level, "status": status,
                "method": method, "path": path, "message": msg
            })
        json.dump(out, sys.stdout, ensure_ascii=False, indent=2)
        print()
    else:
        pretty = [format_row(r) for r in filtered]
        print_table(pretty)

if __name__ == "__main__":
    main()
