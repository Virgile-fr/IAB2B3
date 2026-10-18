"""Vérifier les règles du cours et sa mise à jour depuis les fichiers sources."""
import json
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from server import catalog, make_handler


class CourseTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.course = self.root / "Cours"
        self.course.mkdir()

    def write(self, name, text="# Titre\n\nContenu."):
        path = self.course / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
        return path

    def test_numeric_prefixes_then_alphabetical(self):
        for name in ["B3", "10", "2", "B2", "0", "11", "1", "3-exemple", "Annexe"]:
            self.write(name + ".md")
        data, _ = catalog(self.root)
        self.assertEqual([s["id"] for s in data["decks"][0]["slides"]],
                         ["0", "1", "2", "3-exemple", "10", "11", "Annexe", "B2", "B3"])

    def test_only_course_subdirectories_and_no_excluded_content(self):
        (self.root / "syllabus.md").write_text("# Caché")
        self.write("0.md")
        for name in ["avant de commencer", "déroullé", "déroulé", "introduction"]:
            self.write(name + ".md")
            self.write(name + "/1.md")
        self.write("images/notice.md")
        (self.root / "Cours vide").mkdir()
        data, _ = catalog(self.root)
        self.assertEqual(len(data["decks"]), 1)
        self.assertEqual([s["id"] for s in data["decks"][0]["slides"]], ["0"])

    def test_images_match_exact_slide_and_supplements(self):
        self.write("1.md")
        self.write("10.md")
        self.write("2.md")
        for name in ["1.gif", "1-link.png", "10.png", "10-detail.png"]:
            self.write("images/" + name, "fake image bytes")
        data, assets = catalog(self.root)
        slides = {s["id"]: s for s in data["decks"][0]["slides"]}
        self.assertEqual([i["name"] for i in slides["1"]["images"]], ["1.gif", "1-link.png"])
        self.assertEqual(slides["2"]["images"], [])
        self.assertEqual(len(slides["10"]["images"]), 2)
        self.assertEqual(len(assets), 4)

    def test_edits_additions_and_deletions_without_restart(self):
        source = self.write("0.md", "# Original\n\nTexte **important**.")
        first, _ = catalog(self.root)
        self.assertIn("<strong>important</strong>", first["decks"][0]["slides"][0]["html"])
        self.assertNotIn("<h1>", first["decks"][0]["slides"][0]["html"])
        source.write_text("# Nouveau\n\nTexte changé.", encoding="utf-8")
        self.write("1.md")
        second, _ = catalog(self.root)
        self.assertNotEqual(first["revision"], second["revision"])
        self.assertEqual(second["decks"][0]["slides"][0]["title"], "Nouveau")
        source.unlink()
        third, _ = catalog(self.root)
        self.assertEqual([s["id"] for s in third["decks"][0]["slides"]], ["1"])

    def test_http_routes_cache_and_live_changes(self):
        source = self.write("0.md", "# Première\n\nContenu.")
        self.write("images/0.gif", "GIF89a")
        server = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(self.root))
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(server.server_close)
        self.addCleanup(server.shutdown)
        base = f"http://127.0.0.1:{server.server_port}"
        with urlopen(base + "/") as response:
            self.assertEqual(response.status, 200)
            self.assertIn(b'lang="fr"', response.read())
        with urlopen(base + "/api/courses") as response:
            etag = response.headers["ETag"]
            data = json.load(response)
        with self.assertRaises(HTTPError) as cached:
            urlopen(Request(base + "/api/courses", headers={"If-None-Match": etag}))
        self.assertEqual(cached.exception.code, 304)
        source.write_text("# Modifiée\n\nNouveau contenu.", encoding="utf-8")
        with urlopen(Request(base + "/api/courses", headers={"If-None-Match": etag})) as response:
            self.assertEqual(json.load(response)["decks"][0]["slides"][0]["title"], "Modifiée")
        image_url = data["decks"][0]["slides"][0]["images"][0]["url"]
        with urlopen(base + image_url) as response:
            self.assertEqual(response.headers["Content-Type"], "image/gif")
        for forbidden in ["/server.py", "/media/../server.py", "/media/Cours/0.md", "/B2%26B3DG/instructions.md"]:
            with self.assertRaises(HTTPError) as missing:
                urlopen(base + forbidden)
            self.assertEqual(missing.exception.code, 404)


if __name__ == "__main__":
    unittest.main()
