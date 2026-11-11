# Sito GRIP — versione 5 (animata, in 3D)

Sito statico: HTML, CSS e JavaScript a moduli. Nessun passaggio di build.

## Come aprirlo

```
node tools/server.js
```

Poi apri `http://localhost:5507`. Funziona anche con Live Server di VS Code, ma solo il server qui sopra sa salvare le fotografie (vedi sotto).

Pagine: `index.html`, `catalogo.html`, `privacy.html`, `cookie.html`.

## Dove si cambiano le cose

| Cosa | Dove |
|---|---|
| Tutti i testi e i segnaposto | `content.js` |
| Prodotti HTW e Giatsu (elenco unico) | `dati/prodotti.js` → `PRODOTTI` |
| Famiglie Ercos | `dati/prodotti.js` → `ERCOS` |
| Foto dei prodotti | file in `assets/prodotti/`, nome nel campo `foto` del prodotto |
| Loghi | `assets/marchi/` (copie di `materiale/marchi/`, non modificati) |
| Colori e caratteri | `styles/base.css`, in cima (`:root`) |
| Un pezzo 3D | `scenes/parts/` (`esterna.js`, `aria.js`, `bagno.js`) |
| Una scena | `scenes/macchina.js`, `vetrina.js`, `ercos.js`, `montaggio.js` |
| Il filo | `scenes/filo.js` (3D) e `js/filo-pagina.js` (sulla pagina) |
| Invio del modulo | `js/modulo.js`, funzione `invia()` |

Per aggiungere un prodotto basta una riga in `PRODOTTI`: vetrina, catalogo e filtri si aggiornano da soli. I campi `codice` e `prezzo` sono vuoti apposta: serviranno per l'e-commerce.

## Parametri di prova

Si aggiungono all'indirizzo, anche insieme (`?fermo=1&audit=1`).

- `?fermo=1` — movimento ridotto: niente scorrimento bloccato, scene ferme in posa.
- `?nowebgl=1` — come se mancasse WebGL: al posto del 3D le fotografie delle scene.
- `?audit=1` — carica il controllo. Poi in console:
  - `await GRIP.audit()` — errori, scene, tempi, collegamenti e immagini mancanti, testi vuoti.
  - `GRIP.vista()` — "fotografia" in caratteri di ciò che il 3D sta disegnando.
- `?fps=1` — contatore in basso a sinistra: fotogrammi al secondo, millisecondi medi, il fotogramma peggiore, livello di qualità e risoluzione. È il numero da guardare sul proprio computer.
- `await GRIP.misura()` (con `?audit=1`) — tempo vero della scheda grafica sulla scena visibile, a 1440×810; `GRIP.misura({ w: 1920, h: 1080 })` per lo schermo intero.
- `?snapshot=1` — rigenera le fotografie in `assets/snap/` (scene per la versione senza WebGL e miniature del catalogo). Va rifatto ogni volta che si cambia un pezzo 3D.

Sempre in console: `GRIP.stato()` dà scheda grafica, livello di qualità e tempi; `GRIP.passo(60)` fa avanzare 60 fotogrammi a mano (serve se la finestra è nascosta e l'animazione è ferma); `GRIP.vai(0.5)` porta a metà pagina.

## Qualità adattiva

Il sito misura i tempi di fotogramma e sale o scende a gradini (risoluzione, particelle, profondità di campo). I materiali restano gli stessi. Con schede deboli, come la GT 710, parte già dal livello basso. In più, mentre c'è il loader, misura qualche fotogramma vero e sceglie subito il livello (`GRIP.stato().calibrazione`).

La macro iniziale sulle alette è stata alleggerita l'11/11: la brina non si ricalcola più a ogni fotogramma ma si legge da un piccolo volume di rumore 64×64×64 preparato all'avvio, e le alette si disegnano dalla più vicina, così quelle nascoste non si colorano. Sulla GT 710: da 247 a circa 17 ms per fotogramma a 1440×810.

## Cose da sapere

- **Il modulo non spedisce da solo.** Apre il programma di posta con la richiesta già scritta per `info@gripconsulting.it`. La pagina lo dice sotto il bottone. Quando ci sarà un servizio di invio, si cambia solo `invia()` in `js/modulo.js`.
- **Privacy e cookie** sono segnaposto dichiarati, non informative valide.
- **I modelli 3D** sono forme indicative: nessuna targhetta, sigla o dato tecnico.
- Punti aperti nel codice: cerca `DA CONFERMARE CON GRIP` e `[` nei testi di `content.js`.
- Librerie in `vendor/`, versioni esatte: three 0.170.0, gsap 3.12.5, lenis 1.1.13. Caratteri in `assets/font/`. Il sito non carica nulla da altri siti.
