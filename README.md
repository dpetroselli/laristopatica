# La Ristopatica — sito web + app (PWA)

Rifacimento completo di [laristopatica.com](https://laristopatica.com): tutti i contenuti
delle guide (quartieri di Roma, guide food, mini guide di viaggio) sono stati migrati dal
vecchio sito Notion in un sito statico veloce, con SEO vera e installabile come app sul
telefono (PWA).

## Struttura

| File / cartella | Cosa è |
|---|---|
| `content.json` | **Tutti i contenuti** del sito (testi, guide, locali). Modificabile a mano o dal pannello admin. |
| `admin.js` + `admin/` | **Pannello admin** per aggiungere/modificare i contenuti senza toccare il codice. |
| `Avvia admin.command` | Doppio click (macOS) per aprire il pannello admin nel browser. |
| `build.js` | Generatore: crea le pagine HTML + manifest PWA + service worker + sitemap in `dist/`. |
| `gen-artifact.js` | Genera `artifact.html`, la versione single-file usata come anteprima condivisibile. |
| `assets/` | CSS, JS, logo e immagini (copiati in `dist/assets` a ogni build). |
| `backups/` | Copia automatica di `content.json` a ogni salvataggio dall'admin (ultime 30). |
| `dist/` | **Il sito pronto da pubblicare.** Non modificarlo a mano: viene rigenerato. |

## Pannello admin (per Michela)

Doppio click su **`Avvia admin.command`** (oppure `node admin.js` dal terminale), si apre
http://localhost:8735 con il pannello in italiano:

- a sinistra l'elenco delle guide (Quartieri, Guide food, Viaggi) + «Sito» e «Chi sono»;
- «**+ nuova**» crea una guida: titolo, emoji, colore card, introduzione, sezioni con
  l'elenco dei posti (nome / luogo / nota), tutto con pulsanti sposta/elimina;
- «**💾 Salva e pubblica**» salva e **rigenera automaticamente il sito** (pagina, card in
  home, indici, sitemap e cache offline si aggiornano da soli);
- «**Anteprima sito**» apre il sito appena rigenerato (http://localhost:8735/site/);
- ogni salvataggio crea un backup in `backups/`, quindi niente panico.

L'unica cosa che l'admin non fa è caricare `dist/` online: dopo aver salvato va
ripubblicata la cartella `dist/` (vedi sotto).

## Aggiornare a mano (senza admin)

1. Modifica `content.json`.
2. Rigenera:

```bash
node build.js
```

3. Anteprima locale:

```bash
python3 -m http.server 8734 --directory dist
```

poi apri http://localhost:8734

## Come si pubblica

Il contenuto di `dist/` è un sito statico puro: si può pubblicare ovunque.

- **Netlify** (gratis): trascina la cartella `dist/` su https://app.netlify.com/drop
- **GitHub Pages / Cloudflare Pages / Vercel**: punta il deploy alla cartella `dist/`
- **Sul dominio attuale** (`laristopatica.com`, oggi WordPress): carica i file di `dist/`
  nella root del hosting al posto dell'installazione WordPress (o in una sottocartella per provare).

Nota: il campo «Dominio del sito» (in admin → Sito, oppure `site.domain` in
`content.json`) è usato per canonical/sitemap — se pubblichi su un altro dominio,
aggiornalo e rigenera.

## L'app

Il sito è una **PWA**: aperto da smartphone (su HTTPS), il browser propone
"Aggiungi a schermata Home" / "Installa app". Una volta installata:

- si apre a tutto schermo con icona e splash del brand;
- **funziona anche offline**: il service worker (`sw.js`) salva tutte le guide in cache,
  quindi si possono consultare i ristoranti anche senza rete (es. in viaggio);
- gli aggiornamenti del sito si scaricano da soli in background.

## Aggiungere un nuovo quartiere (esempio a mano)

Il modo più semplice è il pannello admin («+ nuova» accanto a Quartieri di Roma).
A mano, in `content.json`, dentro l'array `"quartieri"`:

```json
{
  "slug": "prati",
  "title": "Prati",
  "emoji": "🏛️",
  "color": "blu",
  "teaser": "Una frase breve per la card.",
  "intro": ["Paragrafo di introduzione…"],
  "sections": [
    { "title": "🍝 Trattorie", "items": [{ "name": "Nome locale", "desc": "nota opzionale" }] }
  ]
}
```

(`color`: terracotta, oliva, rosa, blu, senape o azzurro.) Poi `node build.js`: la
pagina, la card in home, l'indice, la sitemap e la cache offline si aggiornano da soli.
