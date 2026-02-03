import argparse
import json
import sys
from datetime import datetime, timedelta, timezone


def parse_args():
    parser = argparse.ArgumentParser(
        description="Filter Fly logs JSON by time and content."
    )
    parser.add_argument(
        "--hours", type=int, default=12, help="Hours to look back from now (UTC)"
    )
    parser.add_argument(
        "--contains",
        type=str,
        default="",
        help="Substring that must appear in message (optional, case-insensitive)",
    )
    return parser.parse_args()


def iter_json_objects(data: str):
    decoder = json.JSONDecoder()
    idx = 0
    end = len(data)
    while idx < end:
        while idx < end and data[idx].isspace():
            idx += 1
        if idx >= end:
            break
        try:
            obj, next_idx = decoder.raw_decode(data, idx)
        except json.JSONDecodeError:
            break
        idx = next_idx
        yield obj


def main():
    args = parse_args()
    cutoff = datetime.now(timezone.utc) - timedelta(hours=args.hours)
    data = sys.stdin.read()

    for obj in iter_json_objects(data):
        ts = obj.get("timestamp")
        msg = obj.get("message", "")
        if not ts:
            continue
        try:
            ts_dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        except Exception:
            continue
        if ts_dt < cutoff:
            continue
        if args.contains:
            if args.contains.lower() not in msg.lower():
                continue
        print(f"{ts} {msg}")


if __name__ == "__main__":
    main()
