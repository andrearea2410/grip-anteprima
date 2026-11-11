/* ==========================================================================
   GRIP — costruisce le parti della pagina che nascono dai dati:
   la vetrina dei tipi (dall'elenco unico dei prodotti), le famiglie Ercos,
   i passi dell'impianto, la linea del tempo, "per chi lavoriamo".
   ========================================================================== */
import { TESTI } from '../content.js';
import { MARCHI, VETRINA, ERCOS, prodottiPerVetrina } from '../dati/prodotti.js';
import { FINITURE } from '../scenes/parts/bagno.js';

const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const due = (n) => String(n).padStart(2, '0');

export const stato = { marchio: 'htw' };

/* ------------------------------- vetrina ------------------------------- */
export function costruisciVetrina() {
  const pista = document.getElementById('aria-pista');
  if (!pista) return;
  VETRINA.forEach((v, i) => {
    const a = el('article', 'tipo');
    a.id = 'tipo-' + v.id; a.dataset.tipo = v.id;
    a.innerHTML = `
      <div class="tipo-posto" data-posto="${v.id}" data-cursore>
        <img alt="" data-snap="mini-${v.id}.webp">
        <p class="mono">${TESTI.aria.trascina}</p>
      </div>
      <div class="tipo-scheda">
        <p class="tipo-n" aria-hidden="true">${due(i + 1)}</p>
        <div>
          <h3 class="tipo-nome">${v.titolo}</h3>
          <p class="mono tipo-nota">${v.nota}</p>
          <ul class="tipo-prodotti"></ul>
        </div>
        <div class="tipo-azioni">
          <figure class="tipo-foto" hidden><img alt="" loading="lazy"><figcaption class="mono">${TESTI.aria.foto}</figcaption></figure>
          <a class="collegamento">${TESTI.aria.catalogo}</a>
        </div>
      </div>`;
    pista.appendChild(a);
  });
  aggiornaVetrina(stato.marchio);

  const gruppo = document.getElementById('marchio-vetrina');
  gruppo?.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-marchio]');
    if (!b) return;
    gruppo.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    aggiornaVetrina(b.dataset.marchio);
    window.dispatchEvent(new CustomEvent('grip:marchio', { detail: b.dataset.marchio }));
  });
}

export function aggiornaVetrina(marchio) {
  stato.marchio = marchio;
  document.querySelectorAll('.tipo').forEach((a) => {
    const id = a.dataset.tipo;
    const lista = prodottiPerVetrina(id, marchio);
    const ul = a.querySelector('.tipo-prodotti');
    ul.innerHTML = lista.length
      ? lista.map((p) => `<li><a class="collegamento" href="catalogo.html#${p.id}">${p.nome}</a></li>`).join('')
      : `<li class="vuoto">${TESTI.aria.vuoto.replace('{marchio}', MARCHI[marchio].nome)}</li>`;
    a.querySelector('.tipo-azioni .collegamento').href = `catalogo.html?marchio=${marchio}&vetrina=${id}`;
    const conFoto = lista.find((p) => p.foto);
    const fig = a.querySelector('.tipo-foto');
    fig.hidden = !conFoto;
    if (conFoto) { const img = fig.querySelector('img'); img.src = 'assets/prodotti/' + conFoto.foto; img.alt = `${TESTI.aria.foto}: ${MARCHI[marchio].nome} ${conFoto.nome}`; }
  });
}

/* ------------------------------- bagno ------------------------------- */
export function costruisciBagno() {
  TESTI.bagno.primi.forEach((p, i) => {
    const n = document.querySelector(`[data-pp="${i}"]`), t = document.querySelector(`[data-pp-t="${i}"]`), s = document.querySelector(`[data-pp-s="${i}"]`);
    if (n) n.textContent = `${p.n} / III`; if (t) t.innerHTML = p.titolo; if (s) s.textContent = p.testo;
  });
  const fin = document.getElementById('finiture');
  if (fin) {
    Object.entries(FINITURE).forEach(([k, f], i) => {
      const b = el('button', '', `<i style="--c:#${f.color.toString(16).padStart(6, '0')}"></i>${f.nome}`);
      b.type = 'button'; b.dataset.finitura = k; b.setAttribute('aria-pressed', String(i === 0));
      fin.appendChild(b);
    });
    fin.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-finitura]');
      if (!b) return;
      fin.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      window.dispatchEvent(new CustomEvent('grip:finitura', { detail: b.dataset.finitura }));
    });
  }
  const fam = document.getElementById('famiglie');
  if (fam) {
    /* DA CONFERMARE CON GRIP: le collezioni tra parentesi sono solo esempi. */
    ERCOS.forEach((f) => {
      const d = el('div', 'famiglia');
      d.id = f.id;
      d.innerHTML = `<h4>${f.titolo}</h4><ul>${f.righe.map(([nome, es]) => `<li>${nome}${es ? `<small>${es}</small>` : ''}</li>`).join('')}</ul>`;
      fam.appendChild(d);
    });
  }
}

/* ------------------------------- impianto ------------------------------- */
export function costruisciImpianto() {
  const ol = document.getElementById('impianto-passi');
  if (!ol) return;
  TESTI.impianto.passi.forEach((p) => {
    const li = el('li', '', `<span>${p.nome}</span><small>${p.marchio}</small>`);
    li.dataset.forma = p.forma;
    ol.appendChild(li);
  });
  const g = document.getElementById('stagione');
  g?.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-modo]');
    if (!b) return;
    g.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    window.dispatchEvent(new CustomEvent('grip:stagione', { detail: b.dataset.modo }));
  });
}

/* ------------------------- linea del tempo e per chi ------------------------- */
export function costruisciLavoro() {
  const ol = document.getElementById('tempi');
  if (ol) {
    ol.appendChild(el('div', 'tempi-filo'));
    TESTI.lavoro.passi.forEach((p, i) => ol.appendChild(el('li', 'tempo', `<p class="mono">${due(i + 1)}</p><h3>${p.titolo}</h3><p>${p.testo}</p>`)));
    ol.insertAdjacentHTML('beforeend', '<span data-filo style="left:-38%;top:-22%"></span><span data-filo="fine" style="left:0;top:0.5rem"></span><span data-filo style="left:0;bottom:1.6rem;top:auto"></span>');
  }
  const ul = document.getElementById('chi');
  if (ul) TESTI.perChi.voci.forEach((v, i) => ul.appendChild(el('li', '', `<span class="mono">${due(i + 1)}</span><h3>${v.chi}</h3><p>${v.cosa}</p>`)));
}

/* Lamelle del loader (le alette che si disegnano). */
export function costruisciLoader() {
  const g = document.getElementById('la-lamelle');
  if (!g) return;
  let s = '';
  for (let i = 0; i < 38; i++) s += `<path style="--i:${i}" d="M${12 + i * 5.85} 8V112"/>`;
  g.innerHTML = s;
}
