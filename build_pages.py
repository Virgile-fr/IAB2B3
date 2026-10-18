"""Préparer le site statique et la liste des fichiers, sans modifier les Markdown."""
import json
import shutil
import unicodedata
from pathlib import Path

APP = Path(__file__).resolve().parent
ROOT = APP / "B2&B3DG"
OUT = APP / "_site"

def excluded(part):
    name = "".join(c for c in unicodedata.normalize("NFKD", part.casefold()) if not unicodedata.combining(c))
    return part.startswith(".") or name in {"avant de commencer", "deroulle", "deroule", "introduction"}

def build():
    OUT.mkdir(exist_ok=True)
    for name in ["index.html", "app.js", "local-files.js", "style.css", "favicon.svg"]:
        shutil.copy2(APP / name, OUT / name)
    shutil.copytree(APP / "vendor", OUT / "vendor", dirs_exist_ok=True)
    # Remplacer uniquement les données générées pour retirer les cours supprimés.
    target = OUT / ROOT.name
    if target.exists():
        shutil.rmtree(target)
    files = []
    for source in sorted(ROOT.rglob("*")):
        relative = source.relative_to(ROOT)
        if source.is_symlink() or not source.is_file() or any(excluded(p) for p in relative.parts):
            continue
        if len(relative.parts) < 2:
            continue
        if source.suffix.lower() not in {".md", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif"}:
            continue
        if source.suffix.lower() == ".md" and excluded(source.stem):
            continue
        destination = target / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        files.append(relative.as_posix())
    (OUT / "courses.json").write_text(json.dumps({"root": ROOT.name, "files": files}, ensure_ascii=False), encoding="utf-8")
    (OUT / ".nojekyll").touch()
    print(f"Site prêt dans {OUT}, {len(files)} fichiers de cours et images.")

if __name__ == "__main__":
    build()
