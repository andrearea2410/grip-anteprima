/* ==========================================================================
   GRIP — avvio della pagina principale.
   Parametri di prova (da aggiungere all'indirizzo):
     ?fermo=1     movimento ridotto: niente scorrimento bloccato, scene ferme
     ?nowebgl=1   come se il browser non avesse WebGL: fotografie delle scene
     ?snapshot=1  rigenera le fotografie in assets/snap/ (solo col server di tools/)
     ?audit=1     carica tools/audit.js: poi in console  await GRIP.audit()
     ?fps=1       contatore di fotogrammi in basso a sinistra (FPS, ms medi, peggiore, livello)
   In console:  GRIP.stato()  ·  GRIP.passo(60)  fa avanzare 60 fotogrammi a mano
   ========================================================================== */
import { riempi } from '../content.js';
import { costruisciVetrina, costruisciBagno, costruisciImpianto, costruisciLavoro, costruisciLoader } from './costruisci.js';
import { preparaRivelazioni, osservaRivelazioni, creaFasi, avviaCursore, avviaMagneti, avviaBarra, creaPista } from './interfaccia.js';
import { avviaFiloPagina } from './filo-pagina.js';
import { avviaModulo } from './modulo.js';
import { creaPalco } from '../scenes/stage.js';

const q = new URLSearchParams(location.search);
const errori = [];
window.addEventListener('error', (e) => errori.push(String(e.message || e.error)));
window.addEventListener('unhandledrejection', (e) => errori.push('promessa: ' + String(e.reason?.message || e.reason)));

const html = document.documentElement;
const senzaWebgl = q.has('nowebgl');
const fermo = q.has('fermo') || senzaWebgl || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
html.classList.toggle('fermo', fermo);

/* ---------- testi e parti costruite dai dati ---------- */
costruisciLoader();
riempi();
costruisciVetrina();
costruisciBagno();
costruisciImpianto();
costruisciLavoro();
preparaRivelazioni();

/* ---------- scorrimento morbido ---------- */
const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);
gsap.defaults({ ease: 'power3.out', duration: 0.9 });
let lenis = null;
if (!fermo && Lenis) {
  lenis = new Lenis({ lerp: 0.105, smoothWheel: true, wheelMultiplier: 0.95 });
  lenis.on('scroll', ScrollTrigger.update);
}
function scorriA(dest) {
  const el = typeof dest === 'string' ? document.querySelector(dest) : dest;
  if (el == null) return;
  if (typeof el === 'number') { if (lenis) lenis.scrollTo(el, { duration: 0.9 }); else window.scrollTo(0, el); return; }
  if (lenis) lenis.scrollTo(el, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) }); else el.scrollIntoView({ behavior: 'auto' });
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute('href').length < 2) return;
  const el = document.querySelector(a.getAttribute('href'));
  if (!el) return;
  e.preventDefault();
  scorriA(el);
  history.replaceState(null, '', a.getAttribute('href'));
  if (el.id === 'contatti') setTimeout(() => document.getElementById('m-nome')?.focus({ preventScroll: true }), 1500);
});

/* ---------- il palco 3D ---------- */
const canvas = document.getElementById('palco');
const palco = creaPalco({ canvas, fermo, forzaSenzaWebgl: senzaWebgl });
if (!palco.ok) {
  html.classList.add('senza-webgl', 'fermo');
  document.querySelectorAll('img[data-snap]').forEach((img) => { img.loading = 'lazy'; img.src = 'assets/snap/' + img.dataset.snap; });
}

const SCENE = [
  { id: 'macchina', modulo: '../scenes/macchina.js', funzione: 'creaMacchina', sezioni: ['#top', '#dentro'], posa: [0.92, 0.32] },
  { id: 'vetrina', modulo: '../scenes/vetrina.js', funzione: 'creaVetrina', sezioni: ['#aria'], posa: [0] },
  { id: 'ercos', modulo: '../scenes/ercos.js', funzione: 'creaErcos', sezioni: ['.pin-bagno'], posa: [0.85] },
  { id: 'montaggio', modulo: '../scenes/montaggio.js', funzione: 'creaMontaggio', sezioni: ['#impianto'], posa: [0.97] }
];

async function caricaScene() {
  if (!palco.ok) return;
  const esiti = await Promise.allSettled(SCENE.map((s) => import(s.modulo)));
  esiti.forEach((e, i) => {
    const s = SCENE[i];
    if (e.status !== 'fulfilled') { errori.push(`scena ${s.id} non caricata: ${e.reason?.message}`); console.error('[scene]', s.id, e.reason); return; }
    palco.registra({ id: s.id, sezioni: s.sezioni.map((x) => document.querySelector(x)).filter(Boolean), posa: s.posa, crea: e.value[s.funzione] });
  });
  palco.alCambio = (id) => {
    /* cambio scena: il canvas riparte da trasparente e riappare in dissolvenza */
    canvas.style.transition = 'none'; canvas.classList.remove('acceso');
    if (id) requestAnimationFrame(() => requestAnimationFrame(() => { canvas.style.transition = ''; canvas.classList.add('acceso'); }));
  };
  /* sceglie subito il livello di qualità giusto, mentre il loader è ancora sopra */
  try { palco.calibra(); } catch (e) { errori.push('calibrazione: ' + e.message); }
  palco.avvia();
}

/* ---------- ciclo dell'interfaccia ---------- */
const fasi = creaFasi();
const pista = creaPista(scorriA);
const filo = avviaFiloPagina({ fermo });
let tempo = 0;
function battito(t) {
  tempo = t;
  if (lenis) lenis.raf(t * 1000);
  if (!fermo) fasi();
  pista();
  filo?.aggiorna(t);
}
gsap.ticker.add(battito);
gsap.ticker.lagSmoothing(0);

/* ---------- linea del tempo ---------- */
function avviaLineaDelTempo() {
  const ol = document.getElementById('tempi');
  if (!ol) return;
  if (fermo) { ol.style.setProperty('--tempo', 1); ol.querySelectorAll('.tempo').forEach((x) => x.classList.add('acceso')); return; }
  gsap.to(ol, { '--tempo': 1, ease: 'none', scrollTrigger: { trigger: ol, start: 'top 72%', end: 'bottom 62%', scrub: 0.6 } });
  ol.querySelectorAll('.tempo').forEach((li) => ScrollTrigger.create({ trigger: li, start: 'top 70%', onEnter: () => li.classList.add('acceso'), onLeaveBack: () => li.classList.remove('acceso') }));
}

/* ---------- avvio ---------- */
avviaBarra();
avviaCursore();
avviaMagneti();
avviaModulo(scorriA);
osservaRivelazioni();
avviaLineaDelTempo();

const loader = document.getElementById('loader');
const t0 = performance.now();
function togliLoader() {
  const attesa = Math.max(0, (fermo ? 200 : 1150) - (performance.now() - t0));
  setTimeout(() => {
    loader?.classList.add('via');
    document.querySelectorAll('.hero [data-rivela]').forEach((el) => el.classList.add('vista'));
    ScrollTrigger.refresh();
  }, attesa);
}
caricaScene().finally(() => { (document.fonts?.ready ?? Promise.resolve()).then(togliLoader); });
setTimeout(togliLoader, 4000);   // in ogni caso il loader non resta su

/* ---------- strumenti di prova ---------- */
window.GRIP = {
  palco, errori, lenis,
  stato: () => ({ ...(palco.ok ? palco.stato() : { webgl: false, errori: palco.errori }), erroriPagina: errori.slice(), fermo, scorrimento: Math.round(window.scrollY) }),
  /** fa avanzare n fotogrammi a mano (quando il pannello è nascosto l'animazione non gira) */
  passo: (n = 1, dt = 1 / 60) => { for (let i = 0; i < n; i++) { tempo += dt; fasi(); pista(); filo?.aggiorna(tempo); } return palco.ok ? palco.passo(n, dt) : null; },
  /** porta lo scorrimento a una frazione della pagina (0–1) o a un selettore, senza animazione */
  vai: (dove) => {
    const y = typeof dove === 'number' ? dove * (document.documentElement.scrollHeight - innerHeight) : (document.querySelector(dove)?.getBoundingClientRect().top ?? 0) + scrollY;
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y);
    return Math.round(y);
  }
};
/* ---------- contatore di fotogrammi: ?fps=1 ---------- */
if (q.has('fps')) {
  const box = document.createElement('div');
  box.setAttribute('aria-hidden', 'true');
  box.style.cssText = 'position:fixed;left:.6rem;bottom:.6rem;z-index:99;pointer-events:none;background:rgba(14,22,32,.88);color:#FDCE06;' +
    'font:500 11px/1.3 "Geist Mono",ui-monospace,monospace;letter-spacing:.06em;padding:.35rem .6rem;border-radius:4px;border:1px solid rgba(253,206,6,.35)';
  document.body.appendChild(box);
  let n = 0, somma = 0, peggiore = 0, ultimo = performance.now(), da = ultimo;
  const conta = (ora) => {
    const d = ora - ultimo; ultimo = ora; n++; somma += d; peggiore = Math.max(peggiore, d);
    if (ora - da >= 500) {
      const qualita = palco.ok ? ` · LIV ${palco.livello} · ${palco.dpr?.toFixed(2)}x` : ' · senza WebGL';
      box.textContent = `${Math.round((n * 1000) / (ora - da))} FPS · ${(somma / n).toFixed(1)} ms · max ${peggiore.toFixed(0)}${qualita}`;
      n = 0; somma = 0; peggiore = 0; da = ora;
    }
    requestAnimationFrame(conta);
  };
  requestAnimationFrame(conta);
}
if (q.has('audit')) import('../tools/audit.js').catch((e) => errori.push('audit: ' + e.message));
if (q.has('snapshot')) import('../tools/snapshot.js').then((m) => m.avvia(palco)).catch((e) => errori.push('snapshot: ' + e.message));
