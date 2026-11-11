/* ==========================================================================
   GRIP — controllo da console, senza screenshot.
   Si carica aprendo il sito con ?audit=1, poi in console:

     await GRIP.audit()        controllo completo: restituisce numeri
     GRIP.vista()              "fotografia" in caratteri di ciò che il 3D disegna
     GRIP.vista(96, 40)        la stessa, più fitta

   audit() controlla: errori JavaScript, scene create, tempi di fotogramma,
   collegamenti interni rotti, immagini mancanti, testi vuoti, scorrimento
   orizzontale indesiderato, ancore del filo.
   ========================================================================== */
const G = window.GRIP;
const SCALA = ' .:-=+*#%@';

/** Disegna un fotogramma e lo riassume: copertura, ingombro, luminosità e mappa in caratteri. */
function vista(col = 64, righe = 28, zona = [0, 0, 1, 1]) {
  const palco = G.palco;
  if (!palco?.ok) return { errore: 'niente WebGL' };
  palco.subito = true; palco.passo(2); palco.subito = false;
  const sorgente = palco.renderer.domElement;
  const c = document.createElement('canvas'); c.width = col; c.height = righe;
  const g = c.getContext('2d', { willReadFrequently: true });
  /* zona = [x0, y0, x1, y1] in frazioni dello schermo: serve a ingrandire un dettaglio */
  const sw = sorgente.width, sh = sorgente.height;
  g.imageSmoothingEnabled = zona[2] - zona[0] > col / sw;
  g.drawImage(sorgente, zona[0] * sw, zona[1] * sh, (zona[2] - zona[0]) * sw, (zona[3] - zona[1]) * sh, 0, 0, col, righe);
  const d = g.getImageData(0, 0, col, righe).data;
  let pieni = 0, somma = 0, minX = col, maxX = -1, minY = righe, maxY = -1, r = 0, v = 0, b = 0;
  const mappa = [];
  for (let y = 0; y < righe; y++) {
    let riga = '';
    for (let x = 0; x < col; x++) {
      const i = (y * col + x) * 4, a = d[i + 3] / 255;
      const lum = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
      const peso = Math.max(a, lum);
      if (peso > 0.03) { pieni++; somma += lum; r += d[i]; v += d[i + 1]; b += d[i + 2]; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
      riga += peso <= 0.03 ? ' ' : SCALA[Math.min(SCALA.length - 1, 1 + Math.floor(lum * (SCALA.length - 1)))];
    }
    mappa.push(riga);
  }
  /* contrasto: quanto varia la luminosità tra pixel vicini (0 = tinta piatta) */
  let salti = 0, conta = 0;
  for (let y = 0; y < righe; y++) for (let x = 1; x < col; x++) { const i = (y * col + x) * 4; salti += Math.abs(d[i + 1] - d[i - 3]) / 255; conta++; }
  const pct = (n, tot) => Math.round((n / tot) * 100);
  return {
    scena: palco.attiva?.id ?? null,
    copertura: pct(pieni, col * righe) + '%',
    ingombro: pieni ? { sinistra: pct(minX, col) + '%', destra: pct(maxX + 1, col) + '%', alto: pct(minY, righe) + '%', basso: pct(maxY + 1, righe) + '%' } : null,
    luminositaMedia: pieni ? Math.round((somma / pieni) * 100) / 100 : 0,
    contrasto: Math.round((salti / conta) * 1000) / 1000,
    coloreMedio: pieni ? '#' + [r, v, b].map((n) => Math.round(n / pieni).toString(16).padStart(2, '0')).join('') : null,
    disegni: palco.renderer.info.render.calls, triangoli: palco.renderer.info.render.triangles,
    mappa: '\n' + mappa.join('\n')
  };
}

async function esiste(url) {
  try { const r = await fetch(url, { method: 'HEAD', cache: 'no-store' }); return r.ok; } catch (e) { return false; }
}

async function audit() {
  const palco = G.palco;
  const esito = { pagina: location.pathname + location.search };

  /* scene: le crea tutte e misura il disegno di ognuna */
  if (palco?.ok) {
    const scene = [];
    const y0 = window.scrollY;
    for (const s of palco.scene) {
      const el = s.sezioni[0];
      const y = el.getBoundingClientRect().top + window.scrollY + Math.max(0, (el.offsetHeight - innerHeight) * 0.5);
      G.vai(y / Math.max(1, document.documentElement.scrollHeight - innerHeight));
      await new Promise((r) => setTimeout(r, 60));
      palco.passo(2);
      const gl = palco.renderer.getContext();
      const t0 = performance.now();
      for (let i = 0; i < 8; i++) palco.passo(1);
      gl.finish();
      const ms = (performance.now() - t0) / 8;
      const v = vista(32, 14);
      scene.push({ id: s.id, creata: !!s.ogg, rotta: !!s.rotta, msCreazione: s.msCreazione ?? null, msFotogramma: Math.round(ms * 10) / 10, copertura: v.copertura, disegni: v.disegni, triangoli: v.triangoli });
    }
    G.vai(y0 / Math.max(1, document.documentElement.scrollHeight - innerHeight));
    esito.scene = scene;
    esito.palco = { gpu: palco.gpu, livello: palco.livello, dpr: palco.dpr, medieMs: palco.tempi.slice() };
  } else esito.scene = 'niente WebGL (pagina in modalità fotografie)';

  /* collegamenti interni e immagini */
  const rotti = [];
  const visti = new Set();
  for (const a of document.querySelectorAll('a[href]')) {
    const h = a.getAttribute('href');
    if (/^(mailto:|tel:|https?:)/.test(h)) continue;
    if (h.startsWith('#')) { if (h.length > 1 && !document.querySelector(h)) rotti.push(h); continue; }
    const file = h.split(/[?#]/)[0];
    if (visti.has(file)) continue; visti.add(file);
    if (!(await esiste(file))) rotti.push(h);
  }
  const immagini = [];
  for (const img of document.querySelectorAll('img')) {
    const src = img.getAttribute('src');
    if (!src) continue;                                    // le fotografie di riserva si caricano solo senza WebGL
    if (img.complete ? img.naturalWidth === 0 : !(await esiste(src))) immagini.push(src);
    if (!img.hasAttribute('alt')) immagini.push('senza alt: ' + src);
  }
  esito.collegamentiRotti = rotti;
  esito.immaginiMancanti = immagini;

  /* testi, impaginazione, filo */
  esito.testiVuoti = [...document.querySelectorAll('[data-t]')].filter((e) => !e.textContent.trim()).map((e) => e.dataset.t);
  esito.scorrimentoOrizzontale = document.documentElement.scrollWidth > innerWidth + 1 ? document.documentElement.scrollWidth - innerWidth + 'px di troppo' : 'no';
  esito.ancoreFilo = document.querySelectorAll('span[data-filo]').length;
  esito.segnaposto = [...document.querySelectorAll('.segnaposto')].map((e) => e.textContent.trim());
  esito.senzaEtichetta = [...document.querySelectorAll('button, a')].filter((e) => !e.textContent.trim() && !e.getAttribute('aria-label') && !e.querySelector('img[alt]:not([alt=""])')).length;
  esito.erroriJs = G.errori.slice();
  esito.erroriPalco = palco?.errori?.slice() ?? [];
  esito.ok = !esito.erroriJs.length && !esito.erroriPalco.length && !rotti.length && !immagini.length && !esito.testiVuoti.length && esito.scorrimentoOrizzontale === 'no';
  return esito;
}

G.vista = vista;
G.audit = audit;
console.info('[GRIP] controllo pronto:  await GRIP.audit()   ·   GRIP.vista()');

/* --------------------------------------------------------------------------
   Tempo VERO della scheda grafica su una scena.
   Disegna n fotogrammi alla risoluzione w×h; dopo ognuno legge un pixel,
   che costringe il processore ad aspettare che la scheda abbia finito.
   Così il tempo misurato è quello del disegno, non solo dei comandi.
     await GRIP.misura()                       macro dell'hero a 1440×810
     await GRIP.misura({ w: 1920, h: 1080 })
     await GRIP.misura({ nascondi: ['alette'] })   quanto pesano le alette
   -------------------------------------------------------------------------- */
async function misura({ n = 30, w = 1440, h = 810, scorri = 0, nascondi = [] } = {}) {
  const palco = G.palco;
  if (!palco?.ok) return { errore: 'niente WebGL' };
  G.vai(scorri);
  await new Promise((r) => setTimeout(r, 50));
  palco.subito = true; palco.passo(2); palco.subito = false;
  const s = palco.attiva;
  if (!s?.ogg) return { errore: 'nessuna scena attiva' };
  const o = s.ogg, renderer = palco.renderer, gl = renderer.getContext();
  const spenti = [];
  for (const nome of nascondi) o.scene.traverse((x) => { if (x.name === nome && x.visible) { x.visible = false; spenti.push(x); } });
  const prima = { pr: renderer.getPixelRatio(), size: renderer.getSize(new THREE_V()) };
  renderer.setPixelRatio(1); renderer.setSize(w, h, false);
  o.camera.aspect = w / h; o.camera.updateProjectionMatrix();
  const px = new Uint8Array(4), tempi = [];
  for (let i = 0; i < n + 3; i++) {
    const t0 = performance.now();
    o.aggiorna([{ pin: 0, vista: 0, dentro: true, vicino: true, top: 0, bottom: h, rTop: 0, rBottom: h }, { pin: 0, vista: 0, dentro: false, vicino: true, top: h * 3, bottom: h * 7, rTop: h * 3, rBottom: h * 7 }].slice(0, s.sezioni.length), palco.tempo + i / 60, 1 / 60);
    renderer.render(o.scene, o.camera);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    if (i >= 3) tempi.push(performance.now() - t0);
  }
  for (const x of spenti) x.visible = true;
  renderer.setPixelRatio(prima.pr); renderer.setSize(prima.size.x, prima.size.y, false);
  o.camera.aspect = palco.w / palco.h; o.camera.updateProjectionMatrix();
  palco.sporco = true;
  tempi.sort((a, b) => a - b);
  const med = tempi[Math.floor(tempi.length / 2)];
  return { scena: s.id, risoluzione: `${w}x${h}`, mediana: Math.round(med * 10) / 10, migliore: Math.round(tempi[0] * 10) / 10, peggiore: Math.round(tempi[tempi.length - 1] * 10) / 10, fps: Math.round(1000 / med), disegni: renderer.info.render.calls, triangoli: renderer.info.render.triangles };
}
function THREE_V() { return { x: 0, y: 0, set(a, b) { this.x = a; this.y = b; return this; } }; }
G.misura = misura;
