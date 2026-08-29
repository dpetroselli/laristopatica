// Generatore del sito statico La Ristopatica.
// Uso: node build.js   → rigenera tutto in dist/
const fs = require("fs");
const path = require("path");
const { site, about, quartieri, guideFood, viaggi } = require("./content.json");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const allGuides = [
  ...quartieri.map((g) => ({ ...g, group: "quartieri" })),
  ...guideFood.map((g) => ({ ...g, group: "food" })),
  ...viaggi.map((g) => ({ ...g, group: "viaggi" })),
];

const groupMeta = {
  quartieri: { label: "Quartieri di Roma", index: "quartieri.html" },
  food: { label: "Guide food", index: "index.html#food" },
  viaggi: { label: "Mini guide di viaggio", index: "viaggi.html" },
};

function head(title, description, slug) {
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${site.domain}/${slug === "index" ? "" : slug + ".html"}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:image" content="${site.domain}/assets/img/hero.jpg">
<link rel="icon" type="image/png" sizes="32x32" href="assets/img/favicon-32.png">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#faf3eb" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#191512" media="(prefers-color-scheme: dark)">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Work+Sans:wght@400;500;600&family=Caveat:wght@600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css">
</head>
<body>`;
}

function header(active) {
  const nav = [
    ["index.html", "Home", "home"],
    ["quartieri.html", "Quartieri di Roma", "quartieri"],
    ["index.html#food", "Guide food", "food"],
    ["viaggi.html", "Viaggi", "viaggi"],
  ];
  return `
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="index.html">
      <img src="assets/img/logo.png" alt="La Ristopatica" width="52" height="52">
      <span>La Ristopatica</span>
    </a>
    <button class="nav-toggle" aria-label="Apri menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
    <nav class="site-nav">
      ${nav.map(([href, label, key]) => `<a href="${href}"${key === active ? ' class="active"' : ""}>${label}</a>`).join("\n      ")}
      <a class="nav-ig" href="${site.instagram}" target="_blank" rel="noopener">Instagram ↗</a>
    </nav>
  </div>
</header>`;
}

function footer() {
  return `
<footer class="site-footer">
  <div class="wrap footer-inner">
    <img src="assets/img/logo.png" alt="" width="64" height="64">
    <p class="footer-claim">Racconti di cibo, ristoranti e luoghi che restano nel cuore.</p>
    <p><a href="${site.instagram}" target="_blank" rel="noopener">${site.instagramHandle}</a></p>
    <p class="footer-note">© ${new Date().getFullYear()} La Ristopatica · Michela Bosco · Tutti i diritti riservati</p>
  </div>
</footer>
<script src="assets/js/app.js"></script>
</body>
</html>`;
}

function card(g) {
  const href = `${g.slug}.html`;
  return `<a class="card tint-${g.color}" href="${href}">
    <span class="card-emoji">${g.emoji}</span>
    <span class="card-title">${esc(g.title)}</span>
    <span class="card-teaser">${esc(g.teaser)}</span>
    <span class="card-cta">Leggi la guida →</span>
  </a>`;
}

// ---------------------------------------------------------------------------
// Pagina guida
// ---------------------------------------------------------------------------
function guidePage(g) {
  const gm = groupMeta[g.group];
  const siblings = allGuides.filter((x) => x.group === g.group);
  const i = siblings.findIndex((x) => x.slug === g.slug);
  const prev = siblings[(i - 1 + siblings.length) % siblings.length];
  const next = siblings[(i + 1) % siblings.length];

  const sections = g.sections
    .map((s) => {
      const paras = (s.paras || []).map((p) => `<p>${esc(p)}</p>`).join("\n");
      let items = "";
      if (s.items && s.items.length) {
        const detailed = s.items.some((it) => it.desc && it.desc.length > 60);
        if (s.grid || (!detailed && s.items.length > 6)) {
          items = `<ul class="place-grid">${s.items
            .map((it) => `<li>${esc(it.name)}${it.desc ? ` <em>· ${esc(it.desc)}</em>` : ""}</li>`)
            .join("")}</ul>`;
        } else if (detailed) {
          items = `<div class="place-cards">${s.items
            .map(
              (it) => `<article class="place-card">
              <h3>${esc(it.name)}${it.place ? ` <span class="place-loc">· ${esc(it.place)}</span>` : ""}</h3>
              ${it.desc ? `<p>${esc(it.desc)}</p>` : ""}
            </article>`
            )
            .join("")}</div>`;
        } else {
          items = `<ul class="place-list">${s.items
            .map((it) => `<li><strong>${esc(it.name)}</strong>${it.place ? ` <span class="place-loc">· ${esc(it.place)}</span>` : ""}${it.desc ? ` <em>· ${esc(it.desc)}</em>` : ""}</li>`)
            .join("")}</ul>`;
        }
      }
      return `<section class="guide-section">
        <h2>${esc(s.title)}</h2>
        ${paras}
        ${items}
      </section>`;
    })
    .join("\n");

  return `${head(`${g.title} — ${site.name}`, g.teaser, g.slug)}
${header(g.group)}
<main class="wrap guide">
  <p class="breadcrumb"><a href="index.html">Home</a> › <a href="${gm.index}">${gm.label}</a> › ${esc(g.title)}</p>
  <div class="guide-head tint-${g.color}">
    <span class="guide-emoji">${g.emoji}</span>
    <h1>${esc(g.title)}</h1>
    <p class="guide-teaser">${esc(g.teaser)}</p>
  </div>
  <div class="guide-intro">
    ${g.intro.map((p) => `<p>${esc(p)}</p>`).join("\n    ")}
  </div>
  ${sections}
  <nav class="guide-pager">
    <a href="${prev.slug}.html">← ${esc(prev.title)}</a>
    <a href="${gm.index}" class="pager-up">Tutte le guide</a>
    <a href="${next.slug}.html">${esc(next.title)} →</a>
  </nav>
</main>
${footer()}`;
}

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------
function homePage() {
  return `${head(`${site.name} — ${site.tagline}`, site.description, "index")}
${header("home")}
<main>
  <section class="hero">
    <div class="wrap hero-inner">
      <img class="hero-logo" src="assets/img/logo.png" alt="La Ristopatica" width="150" height="150">
      <h1>La Ristopatica</h1>
      <p class="hero-tag">${esc(site.tagline)}</p>
      <p class="hero-sub">Guide gastronomiche dei quartieri di Roma, colazioni imperdibili, gite fuori porta e mini guide di viaggio — scritte, mangiate e vissute da Michela Bosco.</p>
      <div class="hero-cta">
        <a class="btn btn-primary" href="quartieri.html">🍝 Scopri i quartieri di Roma</a>
        <a class="btn btn-ghost" href="viaggi.html">✈️ Mini guide di viaggio</a>
      </div>
    </div>
  </section>

  <section class="wrap banner">
    <img src="assets/img/hero.jpg" alt="Piatti, colazioni e scorci raccontati da La Ristopatica" loading="lazy">
  </section>

  <section class="wrap search-block">
    <label class="search-label" for="search">Cosa cerchi?</label>
    <input id="search" type="search" placeholder="Cerca una guida: Trastevere, colazioni, Tokyo…" autocomplete="off">
  </section>

  <section class="wrap" id="quartieri">
    <div class="section-head">
      <h2>🍝 Mangiare bene, quartiere per quartiere</h2>
      <p>Roma è un universo di sapori che cambia da quartiere a quartiere. Ogni zona ha la sua anima gastronomica: posti autentici, locali di qualità ed esperienze culinarie curate personalmente. Buon appetito, ovunque tu sia 🍷🍕</p>
    </div>
    <div class="cards" data-searchable>
      ${quartieri.map(card).join("\n      ")}
    </div>
  </section>

  <section class="wrap" id="food">
    <div class="section-head">
      <h2>🥐 Guide food</h2>
      <p>Colazioni che fanno le briciole, gite d'autunno e viaggi nel mondo restando a Roma.</p>
    </div>
    <div class="cards" data-searchable>
      ${guideFood.map(card).join("\n      ")}
    </div>
  </section>

  <section class="wrap" id="viaggi">
    <div class="section-head">
      <h2>✈️ Mini guide di viaggio</h2>
      <p>Appunti di viaggio e storie di sapori, da Tokyo alla Lapponia.</p>
    </div>
    <div class="cards" data-searchable>
      ${viaggi.map(card).join("\n      ")}
    </div>
  </section>

  <section class="about" id="chi-sono">
    <div class="wrap about-inner">
      <h2>${esc(about.title)}</h2>
      ${about.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("\n      ")}
      <p class="about-sign">Michela 🍴</p>
      <a class="btn btn-primary" href="${site.instagram}" target="_blank" rel="noopener">Seguimi su Instagram</a>
    </div>
  </section>
</main>
${footer()}`;
}

// ---------------------------------------------------------------------------
// Indici (quartieri / viaggi)
// ---------------------------------------------------------------------------
function indexPage(slug, titolo, emoji, introParas, list, active) {
  return `${head(`${titolo} — ${site.name}`, introParas[0], slug)}
${header(active)}
<main class="wrap">
  <div class="section-head page-head">
    <h1>${emoji} ${esc(titolo)}</h1>
    ${introParas.map((p) => `<p>${esc(p)}</p>`).join("\n    ")}
  </div>
  <div class="cards">
    ${list.map(card).join("\n    ")}
  </div>
</main>
${footer()}`;
}

// ---------------------------------------------------------------------------
// PWA: manifest + service worker + sitemap
// ---------------------------------------------------------------------------
function manifest() {
  return JSON.stringify(
    {
      name: "La Ristopatica",
      short_name: "Ristopatica",
      description: site.description,
      lang: "it",
      start_url: "./index.html",
      scope: "./",
      display: "standalone",
      background_color: "#faf3eb",
      theme_color: "#c2372c",
      icons: [
        { src: "assets/img/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
        { src: "assets/img/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
      ],
    },
    null,
    2
  );
}

function serviceWorker(pages) {
  const assets = [
    "./",
    ...pages.map((p) => `./${p}`),
    "./assets/css/style.css",
    "./assets/js/app.js",
    "./assets/img/logo.png",
    "./assets/img/hero.jpg",
    "./assets/img/icon-192.png",
    "./assets/img/icon-512.png",
    "./manifest.webmanifest",
  ];
  return `// Service worker La Ristopatica — cache-first con aggiornamento in background
const CACHE = "ristopatica-v${Date.now()}";
const ASSETS = ${JSON.stringify(assets, null, 2)};

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fresh = fetch(e.request)
        .then((res) => {
          if (res.ok && new URL(e.request.url).origin === location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fresh;
    })
  );
});
`;
}

function sitemap(pages) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${site.domain}/${p === "index.html" ? "" : p}</loc></url>`).join("\n")}
</urlset>`;
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, "assets"), { recursive: true });
fs.cpSync(path.join(ROOT, "assets"), path.join(DIST, "assets"), { recursive: true });
// pannello admin online (salva su GitHub tramite API)
fs.mkdirSync(path.join(DIST, "admin"), { recursive: true });
fs.copyFileSync(path.join(ROOT, "admin", "index.html"), path.join(DIST, "admin", "index.html"));

const written = [];
function write(name, html) {
  fs.writeFileSync(path.join(DIST, name), html);
  written.push(name);
}

write("index.html", homePage());
write(
  "quartieri.html",
  indexPage(
    "quartieri",
    "Mini guida gastronomica dei quartieri di Roma (e dintorni)",
    "🍝",
    [
      "Roma è un universo di sapori che cambia da quartiere a quartiere. Con questa guida voglio aiutarti a scoprire il meglio della ristorazione romana secondo me, che tu sia alla ricerca di un ristorante stellato o di un supplì indimenticabile sotto casa.",
      "Ogni zona ha la sua anima gastronomica, e questa guida nasce dal desiderio di raccontarla attraverso posti autentici, locali di qualità ed esperienze culinarie curate personalmente. Clicca sul quartiere che ti interessa e scopri i miei consigli, sempre aggiornati e vissuti. Prossimi quartieri in arrivo!",
    ],
    quartieri,
    "quartieri"
  )
);
write(
  "viaggi.html",
  indexPage(
    "viaggi",
    "Mini guide di viaggio",
    "✈️",
    [
      "Appunti di viaggio e storie di sapori: le mie mini guide per partire con l'acquolina in bocca, da Tokyo alla Lapponia svedese.",
    ],
    viaggi,
    "viaggi"
  )
);
for (const g of allGuides) write(`${g.slug}.html`, guidePage(g));

fs.writeFileSync(path.join(DIST, "manifest.webmanifest"), manifest());
fs.writeFileSync(path.join(DIST, "sw.js"), serviceWorker(written));
fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemap(written));
fs.writeFileSync(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${site.domain}/sitemap.xml\n`);

console.log(`✅ Generati ${written.length} file HTML + manifest, sw, sitemap in dist/`);
