/* ==========================================================================
   GRIP — catalogo. Tutto nasce dall'elenco unico in dati/prodotti.js.
   Filtri: marchio, tipo, nome. Lo stato sta nell'indirizzo, così un filtro
   si può mandare a un collega:  catalogo.html?marchio=htw&tipo=pompe
   Ogni prodotto ha il suo indirizzo diretto:  catalogo.html#id
   Chi non ha la foto mostra la miniatura del pezzo 3D del suo tipo
   (immagine in assets/snap/, rigenerabile con ?snapshot=1).
   ========================================================================== */
import { TESTI, riempi } from '../content.js';
import { MARCHI, TIPI, FORME, PRODOTTI, ERCOS } from '../dati/prodotti.js';

const T = TESTI.catalogo;
riempi();

const q = new URLSearchParams(location.search);
const stato = { marchio: q.get('marchio') || '', tipo: q.get('tipo') || '', vetrina: q.get('vetrina') || '', testo: q.get('q') || '' };
const elenco = document.getElementById('elenco');
const due = (n) => String(n).padStart(2, '0');

/* ---------- filtri ---------- */
const fTipo = document.getElementById('f-tipo');
fTipo.innerHTML = `<button type="button" data-tipo="" aria-pressed="true">${T.tutti}</button>` +
  Object.entries(TIPI).map(([k, v]) => `<button type="button" data-tipo="${k}" aria-pressed="false">${v}</button>`).join('');
const fMarchio = document.getElementById('f-marchio'), fCerca = document.getElementById('f-cerca');
fCerca.value = stato.testo;

function scheda(p) {
  const m = MARCHI[p.marchio];
  const richiesta = `index.html?richiesta=listino&prodotto=${p.id}#contatti`;
  return `
  <article class="prodotto" id="${p.id}" data-marchio="${p.marchio}" data-tipo="${p.tipo}" data-vetrina="${FORME[p.forma].vetrina}">
    <figure class="prodotto-mini">
      <img src="assets/snap/mini-${p.forma}.webp" alt="" width="520" height="520" loading="lazy">
      <figcaption class="mono">${T.miniatura}</figcaption>
    </figure>
    ${p.foto ? `<figure class="prodotto-foto"><img src="assets/prodotti/${p.foto}" alt="${T.foto}: ${m.nome} ${p.nome}" loading="lazy"><figcaption class="mono">${T.foto}</figcaption></figure>` : ''}
    <div class="prodotto-testo">
      <span class="targhetta"><img src="${m.logo}" alt="${m.nome}"></span>
      <h3>${p.nome}</h3>
      <p class="mono prodotto-chips">${[FORME[p.forma].nome, ...p.chips].filter((c, i, a) => a.findIndex((x) => x.toLowerCase() === c.toLowerCase()) === i).join(' · ')}</p>
    </div>
    <div class="prodotto-azioni">
      <p class="mono">${T.prezzo}</p>
      <a class="bottone bottone-giallo" href="${richiesta}"><span>${T.listino}</span></a>
      <button type="button" class="collegamento copia" data-id="${p.id}">${T.link}</button>
    </div>
  </article>`;
}

/* ---------- elenco, raggruppato per tipo ---------- */
elenco.innerHTML = Object.entries(TIPI).map(([k, nome], i) => {
  const lista = PRODOTTI.filter((p) => p.tipo === k);
  return `<section class="gruppo" data-gruppo="${k}"><header><p class="numero" aria-hidden="true">${due(i + 1)}</p><h2>${nome}</h2></header>${lista.map(scheda).join('')}</section>`;
}).join('');

/* Se una miniatura manca, resta il nome della forma (mai un riquadro rotto). */
elenco.querySelectorAll('.prodotto-mini img').forEach((img) => img.addEventListener('error', () => { img.closest('figure').classList.add('senza'); img.remove(); }));

function applica() {
  const testo = stato.testo.trim().toLowerCase();
  let n = 0;
  elenco.querySelectorAll('.prodotto').forEach((a) => {
    const p = PRODOTTI.find((x) => x.id === a.id);
    const ok = (!stato.marchio || p.marchio === stato.marchio) && (!stato.tipo || p.tipo === stato.tipo) &&
      (!stato.vetrina || FORME[p.forma].vetrina === stato.vetrina) &&
      (!testo || `${p.nome} ${MARCHI[p.marchio].nome} ${p.chips.join(' ')} ${FORME[p.forma].nome}`.toLowerCase().includes(testo));
    a.hidden = !ok; if (ok) n++;
  });
  elenco.querySelectorAll('.gruppo').forEach((g) => { g.hidden = !g.querySelector('.prodotto:not([hidden])'); });
  fMarchio.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.marchio === stato.marchio)));
  fTipo.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tipo === stato.tipo)));
  document.getElementById('f-conta').textContent = T.conta.replace('{n}', n) + (stato.vetrina ? ` · ${stato.vetrina.toUpperCase()}` : '');
  document.getElementById('f-vuoto').hidden = n > 0;
  const nuovi = new URLSearchParams();
  if (stato.marchio) nuovi.set('marchio', stato.marchio);
  if (stato.tipo) nuovi.set('tipo', stato.tipo);
  if (stato.vetrina) nuovi.set('vetrina', stato.vetrina);
  if (testo) nuovi.set('q', stato.testo.trim());
  history.replaceState(null, '', location.pathname + (nuovi.toString() ? '?' + nuovi : '') + location.hash);
  return n;
}

fMarchio.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { stato.marchio = b.dataset.marchio; applica(); } });
fTipo.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { stato.tipo = b.dataset.tipo; stato.vetrina = ''; applica(); } });
fCerca.addEventListener('input', () => { stato.testo = fCerca.value; applica(); });
document.getElementById('f-azzera').addEventListener('click', () => { stato.marchio = stato.tipo = stato.vetrina = stato.testo = ''; fCerca.value = ''; applica(); });

/* indirizzo diretto di un prodotto */
elenco.addEventListener('click', async (e) => {
  const b = e.target.closest('.copia');
  if (!b) return;
  const url = location.origin + location.pathname + '#' + b.dataset.id;
  try { await navigator.clipboard.writeText(url); b.textContent = T.copiato; } catch (err) { location.hash = b.dataset.id; }
  setTimeout(() => { b.textContent = T.link; }, 1800);
});
function mostraDiretto() {
  const id = location.hash.slice(1);
  const a = id && document.getElementById(id);
  if (!a || !a.classList.contains('prodotto')) return;
  if (a.hidden) { stato.marchio = stato.tipo = stato.vetrina = stato.testo = ''; fCerca.value = ''; applica(); }
  elenco.querySelectorAll('.scelto').forEach((x) => x.classList.remove('scelto'));
  a.classList.add('scelto');
  a.scrollIntoView({ block: 'center' });
}
window.addEventListener('hashchange', mostraDiretto);

/* ---------- Ercos, per famiglie ---------- */
/* DA CONFERMARE CON GRIP: linee trattate; le collezioni sono solo esempi. */
document.getElementById('ercos-famiglie').innerHTML = ERCOS.map((f) => `
  <article class="famiglia" id="${f.id}">
    <div class="famiglia-mini">${[f.forma, f.forma2].filter(Boolean).map((x) => `<img src="assets/snap/mini-${x}.webp" alt="" width="520" height="520" loading="lazy">`).join('')}</div>
    <h3>${f.titolo}</h3>
    <ul>${f.righe.map(([nome, es]) => `<li>${nome}${es ? `<small>${es}</small>` : ''}</li>`).join('')}</ul>
    <a class="collegamento" href="index.html?richiesta=listino&prodotto=${encodeURIComponent('Ercos — ' + f.titolo)}#contatti">${T.listino}</a>
  </article>`).join('');

/* menu su schermi stretti */
const menu = document.getElementById('menu'), apri = document.getElementById('apri-menu');
apri?.addEventListener('click', () => apri.setAttribute('aria-expanded', String(menu.classList.toggle('aperto'))));

applica();
mostraDiretto();
window.GRIP = { stato, applica, prodotti: PRODOTTI.length };
