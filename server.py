#!/usr/bin/env python3
"""Présentation locale : les Markdown restent l'unique source du cours."""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import mimetypes
import re
import unicodedata
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit

try:
    import markdown
except ImportError:
    raise SystemExit("Installez le moteur Markdown : python3 -m pip install -r requirements.txt")

APP = Path(__file__).resolve().parent
DEFAULT_ROOT = APP / "B2&B3DG"
IMAGE_TYPES = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif"}


def normalized(value):
    return "".join(c for c in unicodedata.normalize("NFKD", value.casefold()) if not unicodedata.combining(c))


def excluded(value):
    name = re.sub(r"[\s_-]+", " ", normalized(value)).strip()
    return name in {"avant de commencer", "deroulle", "deroule", "introduction"} or value.startswith(".")


def slide_order(path):
    match = re.match(r"^(\d+)", path.stem)
    return (0, int(match[1]), normalized(path.stem)) if match else (1, 0, normalized(path.stem))


def catalog(root):
    """Relire le disque permet aussi d'ajouter/supprimer des slides et des cours."""
    decks, assets = [], {}
    if not root.is_dir():
        return {"decks": [], "revision": "empty"}, assets
    for directory in sorted(root.rglob("*"), key=lambda p: normalized(str(p))):
        if not directory.is_dir() or directory.is_symlink():
            continue
        relative = directory.relative_to(root)
        if any(excluded(p) or normalized(p) == "images" for p in relative.parts):
            continue
        files = sorted((p for p in directory.iterdir() if p.is_file() and not p.is_symlink()
                        and p.suffix.lower() == ".md" and not excluded(p.stem)), key=slide_order)
        if not files:
            continue
        slides = []
        image_dir = directory / "images"
        images = sorted((p for p in image_dir.iterdir() if p.is_file() and not p.is_symlink()
                         and p.suffix.lower() in IMAGE_TYPES), key=lambda p: normalized(p.name)) if image_dir.is_dir() and not image_dir.is_symlink() else []
        for source in files:
            text = source.read_text(encoding="utf-8-sig")
            rendered = markdown.markdown(text, extensions=["extra", "sane_lists"])
            heading = re.search(r"<h1>(.*?)</h1>", rendered, re.S)
            title = html.unescape(re.sub(r"<[^>]+>", "", heading[1])) if heading else source.stem
            body = rendered[:heading.start()] + rendered[heading.end():] if heading else rendered
            matching = [p for p in images if p.stem.casefold() == source.stem.casefold()
                        or p.stem.casefold().startswith(source.stem.casefold() + "-")
                        or p.stem.casefold().startswith(source.stem.casefold() + "_")]
            matching.sort(key=lambda p: (p.stem.casefold() != source.stem.casefold(), normalized(p.name)))
            media = []
            for image in matching:
                key = image.relative_to(root).as_posix()
                assets[key] = image
                stamp = f"{image.stat().st_mtime_ns}-{image.stat().st_size}"
                media.append({"url": "/media/" + quote(key, safe="/") + "?v=" + stamp, "name": image.name})
            slides.append({"id": source.stem, "filename": source.name, "title": title, "html": body, "images": media})
        decks.append({"id": relative.as_posix(), "title": directory.name, "slides": slides})
    revision = hashlib.sha256(json.dumps(decks, ensure_ascii=False).encode()).hexdigest()
    return {"decks": decks, "revision": revision}, assets


def make_handler(root):
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            path = unquote(urlsplit(self.path).path)
            if path == "/api/courses":
                try:
                    data, _ = catalog(root)
                except (OSError, UnicodeError) as error:
                    self.send_error(503, f"Lecture des cours impossible : {error}")
                    return
                etag = '"' + data["revision"] + '"'
                if self.headers.get("If-None-Match") == etag:
                    self.send_response(304)
                    self.send_header("ETag", etag)
                    self.end_headers()
                    return
                self.respond(json.dumps(data, ensure_ascii=False).encode(), "application/json; charset=utf-8", etag)
                return
            if path.startswith("/media/"):
                _, assets = catalog(root)
                file = assets.get(path.removeprefix("/media/"))
            else:
                file = {"/": APP / "index.html", "/index.html": APP / "index.html",
                        "/app.js": APP / "app.js", "/style.css": APP / "style.css",
                        "/local-files.js": APP / "local-files.js",
                        "/vendor/marked.umd.js": APP / "vendor/marked.umd.js",
                        "/vendor/purify.min.js": APP / "vendor/purify.min.js",
                        "/favicon.svg": APP / "favicon.svg"}.get(path)
            if file is None or not file.is_file():
                self.send_error(404)
                return
            self.respond(file.read_bytes(), mimetypes.guess_type(file.name)[0] or "application/octet-stream")

        def respond(self, body, content_type, etag=None):
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-cache")
            self.send_header("X-Content-Type-Options", "nosniff")
            if etag:
                self.send_header("ETag", etag)
            self.end_headers()
            self.wfile.write(body)

    return Handler


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--root", type=Path, default=DEFAULT_ROOT)
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), make_handler(args.root.resolve()))
    print(f"Cours : http://{args.host}:{server.server_port} — Ctrl+C pour arrêter", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
