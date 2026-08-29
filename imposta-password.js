// Imposta la password dell'admin online.
// Uso: node imposta-password.js
// Chiede il token GitHub e la password da dare a Michela, poi salva il token
// CIFRATO (AES-256-GCM, chiave derivata dalla password con PBKDF2) in
// admin/segreto.json, che è sicuro da pubblicare insieme al sito.
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const ITER = 600000;

function ask(q, hidden) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (hidden) {
      const orig = rl._writeToOutput.bind(rl);
      rl._writeToOutput = (s) => { if (s.includes(q)) orig(s); else orig("*"); };
    }
    rl.question(q, (a) => { rl.close(); if (hidden) process.stdout.write("\n"); resolve(a.trim()); });
  });
}

(async () => {
  console.log("🔐 Imposta la password dell'admin online de La Ristopatica\n");
  const token = await ask("Incolla il token GitHub (github_pat_… o ghp_…): ", true);
  if (!/^(github_pat_|ghp_)/.test(token)) {
    console.error("⚠️  Non sembra un token GitHub. Riprova.");
    process.exit(1);
  }
  const pass = await ask("Scegli la password per Michela (minimo 8 caratteri, meglio una frase): ", true);
  if (pass.length < 8) {
    console.error("⚠️  Troppo corta: minimo 8 caratteri. Una frase tipo 'supplì alle 11 di sera' è perfetta.");
    process.exit(1);
  }
  const pass2 = await ask("Ripeti la password: ", true);
  if (pass !== pass2) {
    console.error("⚠️  Le due password non coincidono.");
    process.exit(1);
  }

  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(pass, salt, ITER, 32, "sha256");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(token, "utf8"), cipher.final(), cipher.getAuthTag()]);

  const out = {
    v: 1,
    iter: ITER,
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    data: enc.toString("base64"),
  };
  fs.writeFileSync(path.join(__dirname, "admin", "segreto.json"), JSON.stringify(out, null, 2));
  console.log("\n✅ Fatto: admin/segreto.json creato (contiene il token cifrato, si può pubblicare).");
  console.log("   Ora fai il push (o chiedi a Claude): git add admin/segreto.json && git commit -m 'Password admin' && git push");
  console.log("   Poi comunica la password a Michela a voce o in chat privata.");
})();
