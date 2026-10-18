/* Lecture des fichiers autorisés par l'utilisateur, sans serveur ni réseau. */
(function (global) {
  "use strict";

  const ROOT_NAME = "B2&B3DG";
  const IMAGE_TYPES = /\.(png|jpe?g|gif|webp|svg|avif)$/i;
  const normalize = value => value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const excluded = name => name.startsWith(".") || ["avant de commencer", "deroulle", "deroule", "introduction"].includes(normalize(name).replace(/[\s_-]+/g, " ").trim());
  const stem = name => name.replace(/\.[^.]+$/, "");
  const compareText = (a, b) => normalize(a).localeCompare(normalize(b), "fr");
  function slideOrder(a, b) {
    const left = stem(a.name).match(/^\d+/);
    const right = stem(b.name).match(/^\d+/);
    if (left && !right) return -1;
    if (!left && right) return 1;
    if (left && right && BigInt(left[0]) !== BigInt(right[0])) return BigInt(left[0]) < BigInt(right[0]) ? -1 : 1;
    return compareText(stem(a.name), stem(b.name));
  }

  function groupEntries(entries) {
    const groups = new Map();
    const accepted = entries.filter(entry => !entry.path.split("/").some(excluded));
    for (const entry of accepted) {
      const parts = entry.path.split("/");
      const name = parts.pop();
      if (!parts.length || parts.some(p => normalize(p) === "images") || !/\.md$/i.test(name) || excluded(stem(name))) continue;
      const id = parts.join("/");
      if (!groups.has(id)) groups.set(id, { id, title: parts.at(-1), sources: [] });
      groups.get(id).sources.push({ ...entry, name });
    }
    for (const group of groups.values()) {
      group.sources.sort(slideOrder);
      group.images = accepted.filter(entry => entry.path.startsWith(group.id + "/images/") &&
        !entry.path.slice((group.id + "/images/").length).includes("/") && IMAGE_TYPES.test(entry.path));
    }
    return Array.from(groups.values()).sort((a, b) => compareText(a.id, b.id));
  }

  function annotatePrompts(doc) {
    const labels = {
      "type d'image": "Type d’image", "type d’image": "Type d’image",
      "sujet": "Sujet et action", "sujet et action": "Sujet et action",
      "environnement": "Environnement", "composition": "Composition",
      "lumiere": "Lumière et couleurs", "lumiere et couleurs": "Lumière et couleurs",
      "matieres": "Matières et finition", "matieres et finition": "Matières et finition",
      "texte": "Texte et éléments graphiques", "texte et elements graphiques": "Texte et éléments graphiques",
      "contraintes": "Contraintes et éléments à conserver",
      "contraintes et elements a conserver": "Contraintes et éléments à conserver"
    };
    const walker = doc.createTreeWalker(doc.body, 4);
    const nodes = [];
    while (walker.nextNode()) {
      if (!walker.currentNode.parentElement.closest("code, pre, a, script, style")) nodes.push(walker.currentNode);
    }
    for (const node of nodes) {
      const pattern = /\[([^\]\n]+):([^\]:\n]+)\]/g;
      const text = node.textContent;
      const fragment = doc.createDocumentFragment();
      let end = 0;
      for (const match of text.matchAll(pattern)) {
        const rawLabel = match[2].trim();
        const label = labels[normalize(rawLabel)];
        if (!label) continue;
        fragment.append(doc.createTextNode(text.slice(end, match.index)));
        const tag = doc.createElement("span");
        tag.className = "prompt-tag";
        tag.tabIndex = 0;
        tag.dataset.promptTag = label;
        tag.setAttribute("aria-label", label + " : " + match[1]);
        tag.textContent = match[1];
        fragment.append(tag);
        end = match.index + match[0].length;
      }
      if (end) {
        fragment.append(doc.createTextNode(text.slice(end)));
        node.replaceWith(fragment);
      }
    }
  }

  class Source {
    constructor() {
      this.directory = null;
      this.imported = null;
      this.urls = new Map();
      this.mode = null;
      this.sequence = 0;
      this.remote = false;
    }

    async loadPublished() {
      const data = global.COURSE_DATA;
      if (!data) throw new Error("Les cours doivent être générés avec generer_prod.py.");
      this.imported = data.files.map(entry => entry.content !== undefined
        ? { path: entry.path, file: new File([entry.content], entry.path.split("/").at(-1)) }
        : { path: entry.path, url: new URL(entry.url, document.baseURI).href });
      this.remote = true;
      return this.read();
    }

    async selectDirectory() {
      // L'appel doit rester déclenché directement par un clic de l'utilisateur.
      let directory = await global.showDirectoryPicker({ mode: "read", id: "b2-b3-cours" });
      if (directory.name !== ROOT_NAME) {
        try { directory = await directory.getDirectoryHandle(ROOT_NAME); }
        catch { throw new Error("Choisissez le dossier B2&B3DG, ou le dossier qui le contient."); }
      }
      this.remote = false;
      this.directory = directory;
      this.imported = null;
      this.mode = "live";
      this.sequence++;
    }

    importFiles(files) {
      const entries = [];
      for (const file of files) {
        const parts = file.webkitRelativePath.split("/");
        const rootIndex = parts.indexOf(ROOT_NAME);
        if (rootIndex < 0) continue;
        const path = parts.slice(rootIndex + 1).join("/");
        if (path) entries.push({ path, file });
      }
      if (!entries.length) throw new Error("Choisissez le dossier B2&B3DG, ou le dossier qui le contient.");
      this.remote = false;
      this.imported = entries;
      this.directory = null;
      this.mode = "import";
      this.sequence++;
    }

    async listFiles() {
      if (this.imported) return this.imported;
      if (!this.directory) return [];
      const entries = [];
      const walk = async (directory, parent = "") => {
        for await (const [name, handle] of directory.entries()) {
          if (excluded(name)) continue;
          const path = parent + name;
          if (handle.kind === "directory") await walk(handle, path + "/");
          else if (/\.md$/i.test(name) || IMAGE_TYPES.test(name)) entries.push({ path, handle });
        }
      };
      await walk(this.directory);
      return entries;
    }

    async read() {
      const sequence = this.sequence;
      const groups = groupEntries(await this.listFiles());
      const used = new Set();
      const newUrls = new Map();
      const decks = [];
      try {
        for (const group of groups) {
          const slides = [];
          for (const entry of group.sources) {
            const file = entry.file || await entry.handle.getFile();
            const content = (await file.text()).replace(/^\uFEFF/, "");
            // Le HTML du Markdown est nettoyé avant toute insertion dans la page.
            const document = new DOMParser().parseFromString(global.DOMPurify.sanitize(global.marked.parse(content)), "text/html");
            annotatePrompts(document);
            const heading = document.querySelector("h1");
            const title = heading?.textContent || stem(entry.name);
            heading?.remove();
            const id = stem(entry.name);
            const matching = group.images.filter(image => {
              const imageStem = stem(image.path.split("/").at(-1)).toLowerCase();
              const key = id.toLowerCase();
              return imageStem === key || imageStem.startsWith(key + "-") || imageStem.startsWith(key + "_");
            }).sort((a, b) => {
              const aStem = stem(a.path.split("/").at(-1));
              const bStem = stem(b.path.split("/").at(-1));
              return Number(aStem.toLowerCase() !== id.toLowerCase()) - Number(bStem.toLowerCase() !== id.toLowerCase()) || compareText(a.path, b.path);
            });
            const images = [];
            for (const image of matching) {
              if (this.remote && image.url) {
                images.push({ url: image.url, name: image.path.split("/").at(-1) });
                continue;
              }
              const imageFile = image.file || await image.handle.getFile();
              const key = `${sequence}:${image.path}:${imageFile.lastModified}:${imageFile.size}`;
              used.add(key);
              let url = this.urls.get(key) || newUrls.get(key);
              if (!url) { url = URL.createObjectURL(imageFile); newUrls.set(key, url); }
              images.push({ url, name: imageFile.name });
            }
            slides.push({ id, filename: entry.name, title, html: document.body.innerHTML.trim(), images });
          }
          decks.push({ id: group.id, title: group.title, slides });
        }
        if (sequence !== this.sequence) throw new Error("Le dossier sélectionné a changé.");
        for (const [key, url] of this.urls) {
          if (!used.has(key)) { URL.revokeObjectURL(url); this.urls.delete(key); }
        }
        for (const [key, url] of newUrls) this.urls.set(key, url);
        return { decks, revision: JSON.stringify(decks) };
      } catch (error) {
        for (const url of newUrls.values()) URL.revokeObjectURL(url);
        throw error;
      }
    }
  }

  global.CourseFiles = { Source, groupEntries, slideOrder, annotatePrompts };
})(globalThis);
