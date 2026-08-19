#!/usr/bin/env python3
"""Netlify build helper: turn b64/ chunks back into photos and the intro video."""
from __future__ import annotations

import base64
from pathlib import Path


def main() -> None:
    root = Path("b64")
    if not root.exists():
        print("no b64/ directory; skipping")
        return

    for folder in sorted(root.rglob("*")):
        if not folder.is_dir():
            continue
        parts = sorted(p for p in folder.iterdir() if p.is_file() and p.suffix == ".txt")
        if not parts:
            continue
        rel = folder.relative_to(root)
        data = b"".join(base64.b64decode("".join(p.read_text().split())) for p in parts)
        out = Path(rel)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(data)
        print(f"wrote {out} ({len(data)} bytes)")


if __name__ == "__main__":
    main()
