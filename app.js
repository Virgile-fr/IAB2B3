const $ = (id) => document.getElementById(id);
let catalog = { decks: [], revision: null };
let deckIndex = 0;
let slideIndex = 0;
let imageIndex = 0;
let etag = null;
let loading = false;
let refreshQueued = false;
let fitFrame;
let pageTransition;
const isLocalFile = location.protocol === "file:";
const localFiles = new CourseFiles.Source();
let sourceMode = isLocalFile ? "local" : "auto";
let controlsTimer;
let controlsHovered = false;
let fullscreenAttempted = false;

function showLocalStart() {
  $("local-start").hidden = false;
  $("slide-wrap").hidden = true;
  $("empty").hidden = true;
  $("previous").disabled = true;
  $("next").disabled = true;
  $("presentation-controls").hidden = true;
  if (!("showDirectoryPicker" in window)) {
    $("local-help").textContent = "Ce navigateur importe une copie : resélectionnez le dossier après vos modifications. La lecture automatique est disponible avec Chrome ou Edge.";
    $("import-folder").hidden = true;
  }
}

function localStatus() {
  return localFiles.mode === "import" ? "Copie importée · resélectionner après modification" : "";
}

async function openFolder() {
  if (!("showDirectoryPicker" in window)) { $("folder-input").click(); return; }
  try {
    await localFiles.selectDirectory();
    enterFullscreen();
    sourceMode = "local";
    etag = null;
    $("local-error").textContent = "";
    await refresh();
  } catch (error) {
    if (error.name === "AbortError") return;
    const message = error.name === "SecurityError" ? "La lecture directe est bloquée par ce navigateur. Utilisez « Importer une copie du dossier »." : error.message;
    $("local-error").textContent = message;
    $("status").textContent = message;
    $("import-folder").hidden = false;
  }
}

function acceptCatalog(next) {
  if (next.revision !== catalog.revision) {
    const initial = catalog.revision === null;
    catalog = next;
    readRoute();
    render();
    $("status").textContent = localStatus() || (initial ? "" : "Cours actualisé");
  } else $("status").textContent = localStatus();
}

function currentDeck() { return catalog.decks[deckIndex]; }
function currentSlide() { return currentDeck()?.slides[slideIndex]; }
function pad(n) { return String(n).padStart(2, "0"); }
function routeFor(deck, slide) { return `#${encodeURIComponent(deck.id)}/${encodeURIComponent(slide.id)}`; }
function readRoute() {
  const route = location.hash.slice(1);
  for (let d = 0; d < catalog.decks.length; d++) {
    const deck = catalog.decks[d];
    const s = deck.slides.findIndex(slide => routeFor(deck, slide).slice(1) === route);
    if (s >= 0) { deckIndex = d; slideIndex = s; return; }
  }
  deckIndex = 0; slideIndex = 0;
}
function go(d, s, focus = true) {
  deckIndex = d; slideIndex = s;
  history.replaceState(null, "", routeFor(currentDeck(), currentSlide()));
  pageTransition?.skipTransition();
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const update = () => {
    render();
    fit(true);
    if (focus) $("slide").focus({ preventScroll: true });
  };
  if (document.startViewTransition && !reduceMotion) {
    const transition = document.startViewTransition(update);
    pageTransition = transition;
    transition.ready.catch(() => {});
    transition.finished.catch(() => {}).finally(() => { if (pageTransition === transition) pageTransition = null; });
    return transition.updateCallbackDone;
  }
  render();
  if (focus) $("slide").focus({ preventScroll: true });
  if (!reduceMotion) {
    document.querySelector(".slide-content").animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 420, easing: "ease-out" });
    if (currentSlide()?.images.length) $("visual").animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: "ease-out" });
  }
}
function move(delta) {
  if (!currentDeck()) return;
  const next = slideIndex + delta;
  if (next >= 0 && next < currentDeck().slides.length) go(deckIndex, next);
}
function renderImage() {
  const slide = currentSlide();
  if (!slide?.images.length) return;
  const image = slide.images[imageIndex];
  $("slide-image").src = image.url;
  $("slide-image").alt = `Visuel du cours : ${slide.title}${slide.images.length > 1 ? ` (${imageIndex + 1}/${slide.images.length})` : ""}`;
  $("image-count").textContent = `${imageIndex + 1} / ${slide.images.length}`;
  $("image-controls").hidden = slide.images.length < 2;
  $("image-prev").disabled = imageIndex === 0;
  $("image-next").disabled = imageIndex === slide.images.length - 1;
}
function render() {
  const deck = currentDeck();
  const slide = currentSlide();
  $("local-start").hidden = true;
  $("presentation-controls").hidden = !slide;
  document.body.classList.toggle("presenting", Boolean(slide));
  $("empty").hidden = Boolean(slide);
  $("slide-wrap").hidden = !slide;
  $("previous").disabled = !slide || slideIndex === 0;
  $("next").disabled = !slide || slideIndex === deck.slides.length - 1;
  if (!slide) {
    renderContents();
    return;
  }
  document.title = `${slide.title} · B2 & B3`;
  $("slide-title").textContent = slide.title.replace(/^\d+\s*[-.\u2013\u2014]\s*/, "");
  $("text-flow").innerHTML = slide.html;
  for (const link of $("text-flow").querySelectorAll('a[href^="http"]')) {
    link.target = "_blank"; link.rel = "noopener noreferrer";
  }
  $("slide").className = `${slide.images.length ? "with-image" : "text-only"}${slide.id === "0" ? " cover" : ""}`;
  $("visual").hidden = !slide.images.length;
  imageIndex = 0;
  if (slide.images.length) renderImage();
  else $("slide-image").removeAttribute("src");
  $("slide-page").textContent = `${pad(slideIndex + 1)} / ${pad(deck.slides.length)}`;
  $("text-area").scrollTop = 0;
  renderContents();
  fit();
}
function fit(immediate = false) {
  cancelAnimationFrame(fitFrame);
  const layout = () => {
    const stage = $("stage");
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) return;
    const scale = width / 1600;
    const logicalHeight = height / scale;
    $("slide-wrap").style.width = `${width}px`;
    $("slide-wrap").style.height = `${height}px`;
    $("slide").style.height = `${logicalHeight}px`;
    $("slide").style.transform = `scale(${scale})`;
    const image = $("slide-image");
    const gutter = parseFloat(getComputedStyle($("visual")).paddingTop);
    const imageWidth = image.naturalHeight ? Math.min(747, (logicalHeight - 2 * gutter) * image.naturalWidth / image.naturalHeight + 2 * gutter) : 700;
    $("slide").style.setProperty("--image-width", `${imageWidth}px`);
    const title = $("slide-title");
    title.style.fontSize = "";
    let titleSize = parseFloat(getComputedStyle(title).fontSize);
    const maxTitleHeight = $("slide").classList.contains("cover") ? logicalHeight * .45 : logicalHeight * .25;
    while (title.offsetHeight > maxTitleHeight && titleSize > 32) title.style.fontSize = `${--titleSize}px`;
    const text = $("text-flow");
    text.style.fontSize = "";
    text.classList.remove("compact");
    $("slide").classList.remove("dense");
    let size = parseFloat(getComputedStyle(text).fontSize);
    const overflows = () => text.scrollHeight > text.clientHeight + 2 || text.scrollWidth > text.clientWidth + 2;
    // Ajuster la composition sans retirer ni réécrire une phrase du Markdown.
    while (overflows() && size > 22) {
      text.style.fontSize = `${--size}px`;
    }
    if (overflows()) {
      $("slide").classList.add("dense");
      text.classList.add("compact");
      text.style.fontSize = "";
      size = parseFloat(getComputedStyle(text).fontSize);
      while (overflows() && size > 16) text.style.fontSize = `${--size}px`;
    }
    // Un futur texte très long reste intégralement accessible par défilement.
  };
  if (immediate === true) layout();
  else fitFrame = requestAnimationFrame(layout);
}
function renderContents() {
  const list = $("course-list");
  list.replaceChildren();
  catalog.decks.forEach((deck, d) => {
    const section = document.createElement("section");
    const heading = document.createElement("h3");
    heading.className = "course-heading";
    heading.textContent = deck.title;
    section.append(heading);
    deck.slides.forEach((slide, s) => {
      const button = document.createElement("button");
      button.className = "slide-link";
      const number = document.createElement("span");
      number.className = "item-number";
      number.textContent = /^\d/.test(slide.id) ? pad(parseInt(slide.id, 10)) : slide.id;
      const title = document.createElement("span");
      title.textContent = slide.title.replace(/^\d+\s*[-.\u2013\u2014]\s*/, "");
      button.append(number, title);
      if (d === deckIndex && s === slideIndex) button.setAttribute("aria-current", "true");
      button.onclick = () => { $("contents").close(); go(d, s); };
      section.append(button);
    });
    list.append(section);
  });
}
async function refresh() {
  if (loading) { refreshQueued = true; return; }
  if (sourceMode === "local" && !localFiles.mode) return;
  loading = true;
  try {
    if (sourceMode === "local") {
      acceptCatalog(await localFiles.read());
      return;
    }
    if (sourceMode === "published") {
      acceptCatalog(await localFiles.loadPublished());
      return;
    }
    const response = await fetch(new URL("api/courses", document.baseURI), { headers: etag ? { "If-None-Match": etag } : {} });
    if (response.status === 304) { $("status").textContent = ""; return; }
    if (sourceMode === "auto" && (!response.ok || !response.headers.get("Content-Type")?.includes("application/json"))) {
      sourceMode = "published";
      $("folder-button").textContent = "Actualiser les cours";
      $("empty-folder").textContent = "Actualiser les cours";
      acceptCatalog(await localFiles.loadPublished());
      return;
    }
    if (!response.ok) throw new Error("Lecture impossible");
    sourceMode = "server";
    const next = await response.json();
    etag = response.headers.get("ETag");
    acceptCatalog(next);
  } catch (error) {
    if (sourceMode === "local") {
      const message = "Lecture du dossier interrompue · sélectionnez-le à nouveau.";
      $("status").textContent = message;
      $("local-error").textContent = message;
      return;
    }
    $("status").textContent = "Connexion interrompue · nouvelle tentative…";
    if (catalog.revision === null) {
      $("slide-title").textContent = "Le cours est indisponible.";
      $("text-flow").textContent = "Le chargement sera retenté automatiquement. Si vous venez de publier le site, vérifiez que le déploiement est terminé.";
      fit();
    }
  } finally {
    loading = false;
    if (refreshQueued) { refreshQueued = false; queueMicrotask(refresh); }
  }
}
$("previous").onclick = () => move(-1);
$("open-folder").onclick = openFolder;
async function reloadFolder() {
  if (sourceMode !== "local") await refresh();
  else if (localFiles.mode === "live") await openFolder();
  else $("folder-input").click();
}
$("folder-button").onclick = reloadFolder;
$("empty-folder").onclick = reloadFolder;
$("import-folder").onclick = () => $("folder-input").click();
$("folder-input").onchange = async event => {
  if (!event.target.files.length) return;
  enterFullscreen();
  try {
    localFiles.importFiles(event.target.files);
    sourceMode = "local";
    etag = null;
    await refresh();
  } catch (error) { $("local-error").textContent = error.message; $("status").textContent = error.message; }
  finally { event.target.value = ""; }
};
$("next").onclick = () => move(1);
$("contents-button").onclick = () => { $("contents").showModal(); $("contents").querySelector('[aria-current="true"]')?.scrollIntoView({ block: "center" }); };
$("contents-close").onclick = () => $("contents").close();
$("image-prev").onclick = () => { imageIndex--; renderImage(); };
$("image-next").onclick = () => { imageIndex++; renderImage(); };
$("image-open").onclick = () => {
  $("large-image").src = $("slide-image").src;
  $("large-image").alt = $("slide-image").alt;
  $("lightbox").showModal();
};
$("lightbox-close").onclick = () => $("lightbox").close();
for (const dialog of document.querySelectorAll("dialog")) {
  dialog.addEventListener("click", event => { if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  } });
}
async function enterFullscreen() {
  fullscreenAttempted = true;
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
  } catch { /* La planche remplit déjà la fenêtre si le navigateur refuse le plein écran natif. */ }
}
document.addEventListener("fullscreenchange", fit);

function showControls() {
  if (!currentSlide()) return;
  document.body.classList.add("controls-visible");
  document.body.classList.remove("cursor-idle");
  clearTimeout(controlsTimer);
  controlsTimer = setTimeout(() => {
    if (controlsHovered || $("presentation-controls").querySelector(":focus-visible")) return;
    document.body.classList.remove("controls-visible");
    document.body.classList.add("cursor-idle");
  }, 1800);
}
document.addEventListener("pointermove", showControls, { passive: true });
document.addEventListener("pointerdown", () => {
  showControls();
  if (currentSlide() && !fullscreenAttempted) enterFullscreen();
}, { passive: true });
$("presentation-controls").addEventListener("pointerenter", () => { controlsHovered = true; showControls(); });
$("presentation-controls").addEventListener("pointerleave", () => { controlsHovered = false; showControls(); });
$("presentation-controls").addEventListener("focusin", showControls);
$("presentation-controls").addEventListener("focusout", showControls);
$("slide-image").addEventListener("load", fit);
document.addEventListener("keydown", event => {
  if (event.altKey || event.ctrlKey || event.metaKey || document.querySelector("dialog[open]") || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
  if (event.code === "Space" && /BUTTON|A/.test(event.target.tagName)) return;
  if (["ArrowRight", "PageDown", " "].includes(event.key)) { event.preventDefault(); move(1); }
  if (["ArrowLeft", "PageUp"].includes(event.key)) { event.preventDefault(); move(-1); }
  if (event.key === "Home" && currentDeck()) { event.preventDefault(); go(deckIndex, 0); }
  if (event.key === "End" && currentDeck()) { event.preventDefault(); go(deckIndex, currentDeck().slides.length - 1); }
  if (event.key.toLowerCase() === "f") { event.preventDefault(); enterFullscreen(); }
});
let touchStart;
$("stage").addEventListener("touchstart", event => { touchStart = event.touches.length === 1 ? [event.touches[0].clientX, event.touches[0].clientY] : null; }, { passive: true });
$("stage").addEventListener("touchend", event => {
  if (!touchStart) return;
  const dx = event.changedTouches[0].clientX - touchStart[0];
  const dy = event.changedTouches[0].clientY - touchStart[1];
  if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2) move(dx < 0 ? 1 : -1);
  touchStart = null;
}, { passive: true });
window.addEventListener("hashchange", () => { if (catalog.revision !== null) { readRoute(); render(); } });
new ResizeObserver(fit).observe($("stage"));
if (isLocalFile) showLocalStart();
else refresh();
setInterval(() => { if (sourceMode !== "local" || localFiles.mode === "live") refresh(); }, 2000);
window.addEventListener("focus", refresh);
