#!/usr/bin/env python3
"""Netlify build helper: restore photos and the intro video from b64/ chunks."""
from __future__ import annotations

import base64
import urllib.request
from pathlib import Path

MEDIA = [
    "intro.mp4",
    "intro.jpg",
    "photos/crete.jpg",
    "photos/santorini.jpg",
    "photos/athens.jpg",
]

MIN_BYTES = {
    "intro.mp4": 100_000,
}

MIRRORS = [
    "https://cdn.jsdelivr.net/gh/vlaka79/greece-adventure-2026@main/{path}",
    "https://raw.githubusercontent.com/vlaka79/greece-adventure-2026/main/{path}",
]


def big_enough(path: Path) -> bool:
    if not path.is_file():
        return False
    minimum = MIN_BYTES.get(path.as_posix(), 20_000)
    return path.stat().st_size >= minimum


def decode_b64() -> None:
    root = Path("b64")
    if not root.exists():
        print("no b64/ directory; skipping decode")
        return
    for folder in sorted(root.rglob("*")):
        if not folder.is_dir():
            continue
        parts = sorted(p for p in folder.iterdir() if p.is_file() and p.suffix == ".txt")
        if not parts:
            continue
        rel = folder.relative_to(root)
        try:
            data = b"".join(base64.b64decode("".join(p.read_text().split())) for p in parts)
        except Exception as exc:
            print(f"decode failed for {rel}: {exc}")
            continue
        out = Path(rel)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(data)
        print(f"wrote {out} ({len(data)} bytes)")
    for blob in sorted(root.rglob("*.b64")):
        rel = blob.relative_to(root).with_suffix("")
        # photos/album/name.jpg.b64 -> photos/album/name.jpg
        if rel.suffix == "":
            continue
        try:
            data = base64.b64decode("".join(blob.read_text().split()))
        except Exception as exc:
            print(f"decode failed for {blob}: {exc}")
            continue
        out = Path(rel)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(data)
        print(f"wrote {out} ({len(data)} bytes)")


def fetch_missing() -> None:
    for rel in MEDIA:
        dest = Path(rel)
        if big_enough(dest):
            print(f"ok {rel} ({dest.stat().st_size} bytes)")
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        fetched = False
        for tmpl in MIRRORS:
            url = tmpl.format(path=rel)
            try:
                print(f"fetch {rel} from {url}")
                with urllib.request.urlopen(url, timeout=60) as resp:
                    data = resp.read()
                dest.write_bytes(data)
                print(f"wrote {rel} ({len(data)} bytes)")
                fetched = True
                break
            except Exception as exc:
                print(f"fetch failed {url}: {exc}")
        if not fetched:
            print(f"still missing {rel}")


def main() -> None:
    decode_b64()
    fetch_missing()
    inject_og()
    for rel in MEDIA:
        dest = Path(rel)
        print(f"final {rel}: {'ok '+str(dest.stat().st_size) if dest.is_file() else 'MISSING'}")




def inject_og() -> None:
    """Stamp Open Graph tags from status.json so link previews stay current."""
    import json
    import re
    status_path = Path("status.json")
    index_path = Path("index.html")
    if not status_path.is_file() or not index_path.is_file():
        print("og skip: missing status.json or index.html")
        return
    try:
        status = json.loads(status_path.read_text())
    except Exception as exc:
        print(f"og skip: {exc}")
        return
    pc = status.get("postcard") or {}
    loc = (status.get("location") or "").strip()
    place = (pc.get("place") or "").split(",")[-1].strip() or loc
    title = f"Daniel & Julia · {place or loc or 'Greece'}"
    desc = (pc.get("note") or pc.get("title") or "Greece Adventure 2026").strip()
    photo = pc.get("photo") or "/photos/album/crete-chania-lighthouse-selfie.jpg"
    if photo.startswith("/"):
        photo = "https://djbooneadventures.com" + photo

    def attr(s: str) -> str:
        return (
            s.replace("&", "&amp;")
            .replace('"', "&quot;")
            .replace("<", "&lt;")
        )

    def stamp(doc: str, kind: str, name: str, value: str) -> str:
        attr_name = "property" if kind == "property" else "name"
        pattern = rf'(<meta {attr_name}="{re.escape(name)}" content=")[^"]*(" />)'
        return re.sub(pattern, lambda m: m.group(1) + attr(value) + m.group(2), doc, count=1)

    html = index_path.read_text()
    html = stamp(html, "property", "og:title", title)
    html = stamp(html, "property", "og:description", desc)
    html = stamp(html, "property", "og:image", photo)
    html = stamp(html, "name", "twitter:title", title)
    html = stamp(html, "name", "twitter:description", desc[:180])
    html = stamp(html, "name", "twitter:image", photo)
    index_path.write_text(html)
    print(f"og updated: {title}")


if __name__ == "__main__":
    main()
