// Pannello admin de La Ristopatica.
// Avvio: node admin.js  →  http://localhost:8735
// Legge e scrive content.json, e a ogni salvataggio rigenera il sito in dist/.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const ROOT = __dirname;
const PORT = 8735;
const CONTENT = path.join(ROOT, "content.json");
const BACKUPS = path.join(ROOT, "backups");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webmanifest": "application/manifest+json",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
};

function send(res, code, body, type) {
  res.writeHead(code, { "Content-Type": type || "application/json; charset=utf-8" });
  res.end(body);
}

function serveFile(res, file) {
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, "Not found", "text/plain");
    send(res, 200, data, MIME[path.extname(file)] || "application/octet-stream");
  });
}

function rebuild(cb) {
  execFile(process.execPath, [path.join(ROOT, "build.js")], { cwd: ROOT }, (err, stdout, stderr) =>
    cb(err, (stdout || "") + (stderr || ""))
  );
}

// Controlli minimi prima di scrivere: struttura giusta e slug validi/unici.
function validate(c) {
  if (!c || typeof c !== "object") return "contenuto non valido";
  for (const k of ["site", "about", "quartieri", "guideFood", "viaggi"])
    if (!(k in c)) return `manca la sezione "${k}"`;
  const slugs = new Set();
  for (const group of ["quartieri", "guideFood", "viaggi"]) {
    if (!Array.isArray(c[group])) return `"${group}" deve essere una lista`;
    for (const g of c[group]) {
      if (!g.slug || !/^[a-z0-9-]+$/.test(g.slug)) return `slug non valido: "${g.slug || "(vuoto)"}"`;
      if (["index", "quartieri", "viaggi", "assets", "sw", "manifest"].includes(g.slug))
        return `lo slug "${g.slug}" è riservato`;
      if (slugs.has(g.slug)) return `slug duplicato: "${g.slug}"`;
      slugs.add(g.slug);
      if (!g.title) return "ogni guida deve avere un titolo";
      if (!Array.isArray(g.intro) || !Array.isArray(g.sections)) return `"${g.title}": intro e sezioni devono essere liste`;
    }
  }
  return null;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const p = url.pathname;

  // API -------------------------------------------------------------------
  if (p === "/api/content" && req.method === "GET") return serveFile(res, CONTENT);

  if (p === "/api/content" && req.method === "POST") {
    let body = "";
    req.on("data", (ch) => { body += ch; if (body.length > 10e6) req.destroy(); });
    req.on("end", () => {
      let content;
      try { content = JSON.parse(body); } catch { return send(res, 400, JSON.stringify({ ok: false, error: "JSON non valido" })); }
      const err = validate(content);
      if (err) return send(res, 400, JSON.stringify({ ok: false, error: err }));
      fs.mkdirSync(BACKUPS, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      fs.copyFileSync(CONTENT, path.join(BACKUPS, `content-${stamp}.json`));
      const old = fs.readdirSync(BACKUPS).filter((f) => f.startsWith("content-")).sort();
      for (const f of old.slice(0, -30)) fs.unlinkSync(path.join(BACKUPS, f));
      fs.writeFileSync(CONTENT, JSON.stringify(content, null, 2));
      delete require.cache[require.resolve(CONTENT)];
      rebuild((buildErr, log) => {
        if (buildErr) return send(res, 500, JSON.stringify({ ok: false, error: "salvato, ma la rigenerazione è fallita: " + log }));
        send(res, 200, JSON.stringify({ ok: true, log: log.trim() }));
      });
    });
    return;
  }

  // Anteprima del sito generato ------------------------------------------
  if (p === "/site" || p === "/site/") {
    res.writeHead(302, { Location: "/site/index.html" });
    return res.end();
  }
  if (p.startsWith("/site/")) {
    const rel = path.normalize(p.slice("/site/".length)).replace(/^(\.\.[/\\])+/, "");
    return serveFile(res, path.join(ROOT, "dist", rel));
  }

  // Admin UI + asset ------------------------------------------------------
  if (p === "/" || p === "/index.html") return serveFile(res, path.join(ROOT, "admin", "index.html"));
  if (p.startsWith("/assets/")) {
    const rel = path.normalize(p.slice("/assets/".length)).replace(/^(\.\.[/\\])+/, "");
    return serveFile(res, path.join(ROOT, "assets", rel));
  }
  send(res, 404, "Not found", "text/plain");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`🍴 Admin La Ristopatica: http://localhost:${PORT}`);
  console.log(`   Anteprima sito:       http://localhost:${PORT}/site/`);
});
