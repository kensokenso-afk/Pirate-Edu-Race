#!/usr/bin/env python3
"""Pecah index.html menjadi css/ dan js/ tanpa mengubah isi atau urutan eksekusi.

Jalankan dari root repo:  python tools/split_index.py
Aman dijalankan ulang: bila tidak ada blok inline besar, tidak ada yang diubah.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "index.html"

# (tag, id atau None, file tujuan). Blok kecil/fallback Tailwind sengaja dibiarkan inline.
TARGETS = [
    ("style", None, "css/style.css"),
    ("style", "mp-style", "css/multiplayer.css"),
    ("script", None, "js/game.js"),
    ("script", "mp-script", "js/multiplayer.js"),
]
MIN_SIZE = 2000  # hanya blok inline yang lebih besar dari ini yang dipindah


def main():
    html = SRC.read_text(encoding="utf-8")
    pattern = re.compile(r"<(style|script)([^>]*)>(.*?)</\1>", re.S)
    out, last, moved = [], 0, []
    for m in pattern.finditer(html):
        tag, attrs, body = m.group(1), m.group(2), m.group(3)
        if "src=" in attrs or "media=" in attrs or len(body) < MIN_SIZE:
            continue
        idm = re.search(r'id="([^"]+)"', attrs)
        key = (tag, idm.group(1) if idm else None)
        target = next((t for t in TARGETS if (t[0], t[1]) == key), None)
        if not target:
            continue
        path = ROOT / target[2]
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(body.strip("\n") + "\n", encoding="utf-8")
        if tag == "style":
            ref = f'<link rel="stylesheet" href="{target[2]}"{attrs}>'
        else:
            ref = f'<script src="{target[2]}"{attrs}></script>'
        out.append(html[last:m.start()])
        out.append(ref)
        last = m.end()
        moved.append(target[2])
    out.append(html[last:])
    if moved:
        SRC.write_text("".join(out), encoding="utf-8")
    print("Dipindah:", ", ".join(moved) if moved else "tidak ada")


if __name__ == "__main__":
    main()
