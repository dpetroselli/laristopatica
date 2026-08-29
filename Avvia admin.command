#!/bin/zsh
# Doppio click per aprire il pannello contenuti de La Ristopatica.
cd "$(dirname "$0")"
if ! command -v node >/dev/null; then
  echo "⚠️  Serve Node.js: scaricalo da https://nodejs.org e riprova."
  read -r "?Premi Invio per chiudere…"
  exit 1
fi
(sleep 1 && open "http://localhost:8735") &
node admin.js
