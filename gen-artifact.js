// Genera artifact.html: versione single-file del sito (anteprima condivisibile).
// Uso: node build.js && node gen-artifact.js
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");

const dataUri = (p, mime) =>
  `data:${mime};base64,${fs.readFileSync(path.join(ROOT, "assets/img", p)).toString("base64")}`;

const LOGO = dataUri("logo.png", "image/png");
const HERO = dataUri("hero.jpg", "image/jpeg");

// --- CSS: riusa style.css e rende il tema scuro compatibile con data-theme ---
let css = fs.readFileSync(path.join(ROOT, "assets/css/style.css"), "utf8");
const darkMatch = css.match(/@media \(prefers-color-scheme: dark\) \{\s*:root \{([\s\S]*?)\n  \}\n\}/);
if (!darkMatch) throw new Error("Blocco dark non trovato in style.css");
const darkTokens = darkMatch[1];
css = css.replace(
  darkMatch[0],
  `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {${darkTokens}\n  }\n}\n:root[data-theme="dark"] {${darkTokens}\n}`
);

// --- Pagine: estrae <main> da ogni file di dist e riscrive i link interni ---
const pages = fs
  .readdirSync(DIST)
  .filter((f) => f.endsWith(".html"))
  .map((f) => {
    const slug = f.replace(/\.html$/, "");
    const html = fs.readFileSync(path.join(DIST, f), "utf8");
    const title = html.match(/<title>([\s\S]*?)<\/title>/)[1];
    let main = html.match(/<main[^>]*>[\s\S]*?<\/main>/)[0];
    main = main
      .replace(/href="index\.html#[^"]*"/g, 'href="#/index"')
      .replace(/href="([a-z0-9-]+)\.html"/g, 'href="#/$1"')
      .replace(/src="assets\/img\/logo\.png"/g, `src="${LOGO}"`)
      .replace(/src="assets\/img\/hero\.jpg"/g, `src="${HERO}"`);
    return { slug, title, main };
  });

const navLinks = [
  ["#/index", "Home"],
  ["#/quartieri", "Quartieri di Roma"],
  ["#/viaggi", "Viaggi"],
];

const html = `<meta charset="UTF-8">
<title>La Ristopatica</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Work+Sans:wght@400;500;600&family=Caveat:wght@600&display=swap" rel="stylesheet">
<style>
${css}
main[data-page] { display: none; }
main[data-page].current { display: block; }
.preview-note { text-align:center; font-size:0.8rem; color:var(--ink-soft); padding:8px 16px; background:var(--bg-soft); border-bottom:1px solid var(--line); }
</style>
<div class="preview-note">Anteprima del nuovo sito laristopatica.com — versione navigabile single-file</div>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="#/index">
      <img src="${LOGO}" alt="La Ristopatica" width="52" height="52">
      <span>La Ristopatica</span>
    </a>
    <button class="nav-toggle" aria-label="Apri menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
    <nav class="site-nav">
      ${navLinks.map(([h, l]) => `<a href="${h}" data-nav>${l}</a>`).join("\n      ")}
      <a class="nav-ig" href="https://www.instagram.com/la_ristopatica" target="_blank" rel="noopener">Instagram ↗</a>
    </nav>
  </div>
</header>
${pages.map((p) => p.main.replace("<main", `<main data-page="${p.slug}" data-title="${p.title.replace(/"/g, "&quot;")}"`)).join("\n")}
<footer class="site-footer">
  <div class="wrap footer-inner">
    <img src="${LOGO}" alt="" width="64" height="64">
    <p class="footer-claim">Racconti di cibo, ristoranti e luoghi che restano nel cuore.</p>
    <p><a href="https://www.instagram.com/la_ristopatica" target="_blank" rel="noopener">@la_ristopatica</a></p>
    <p class="footer-note">© 2026 La Ristopatica · Michela Bosco · Tutti i diritti riservati</p>
  </div>
</footer>
<script>
(function () {
  var mains = document.querySelectorAll("main[data-page]");
  function show() {
    var slug = (location.hash.replace(/^#\\//, "") || "index");
    var found = false;
    mains.forEach(function (m) {
      var ok = m.dataset.page === slug;
      m.classList.toggle("current", ok);
      if (ok) { found = true; document.title = m.dataset.title; }
    });
    if (!found) { mains.forEach(function (m) { m.classList.toggle("current", m.dataset.page === "index"); }); }
    window.scrollTo(0, 0);
    var nav = document.querySelector(".site-nav");
    nav.classList.remove("open");
    document.querySelector(".nav-toggle").setAttribute("aria-expanded", "false");
  }
  window.addEventListener("hashchange", show);
  show();

  var toggle = document.querySelector(".nav-toggle");
  toggle.addEventListener("click", function () {
    var open = document.querySelector(".site-nav").classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  var search = document.getElementById("search");
  if (search) {
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-searchable] .card"));
    search.addEventListener("input", function () {
      var q = search.value.trim().toLowerCase();
      cards.forEach(function (c) {
        c.style.display = !q || c.textContent.toLowerCase().indexOf(q) !== -1 ? "" : "none";
      });
      document.querySelectorAll("[data-searchable]").forEach(function (grid) {
        var visible = grid.querySelectorAll(".card:not([style*='none'])").length;
        grid.closest("section").style.display = visible ? "" : "none";
      });
    });
  }
})();
</script>
`;

fs.writeFileSync(path.join(ROOT, "artifact.html"), html);
console.log(`✅ artifact.html generato (${(html.length / 1024).toFixed(0)} KB, ${pages.length} pagine)`);
