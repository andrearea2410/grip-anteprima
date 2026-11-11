/* ==========================================================================
   GRIP — IL FILO sulla pagina.
   Una curva sola che lega le sezioni: passa per le ancore <span data-filo>
   messe nell'HTML, nell'ordine in cui compaiono. Un'ancora con
   data-filo="fine" chiude un tratto (lì il filo "entra" in una scena 3D e
   prosegue dentro i tubi); l'ancora dopo ne apre uno nuovo.
   Il colore dipende da quanto si è scesi: azzurro in alto, giallo GRIP in
   fondo, dove il filo si avvolge attorno all'emblema nel footer.
   ========================================================================== */
import { coloreFiloCss } from '../scenes/filo.js';

export function avviaFiloPagina({ fermo = false } = {}) {
  const svg = document.getElementById('filo');
  if (!svg) return null;
  const linea = svg.querySelector('#filo-linea'), alone = svg.querySelector('#filo-alone'), gPunti = svg.querySelector('#filo-punti');
  const c0 = svg.querySelector('#filo-c0'), c1 = svg.querySelector('#filo-c1');
  const gradColore = svg.querySelector('#filo-colore'), gradSfuma = svg.querySelector('#filo-sfuma');
  const ancore = [...document.querySelectorAll('span[data-filo]')];
  const anello = document.querySelector('[data-filo-anello]');
  const punti = [];
  if (!fermo) for (let i = 0; i < 5; i++) { const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.setAttribute('r', i % 2 ? 2.2 : 3); gPunti.appendChild(c); punti.push(c); }
  let ultimoD = '', ultimoCol = '';

  /* Catmull-Rom → curve di Bézier */
  function curva(p) {
    if (p.length < 2) return '';
    let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[Math.max(0, i - 1)], b = p[i], c = p[i + 1], e = p[Math.min(p.length - 1, i + 2)];
      d += `C${(b[0] + (c[0] - a[0]) / 6).toFixed(1)} ${(b[1] + (c[1] - a[1]) / 6).toFixed(1)} ${(c[0] - (e[0] - b[0]) / 6).toFixed(1)} ${(c[1] - (e[1] - b[1]) / 6).toFixed(1)} ${c[0].toFixed(1)} ${c[1].toFixed(1)}`;
    }
    return d;
  }

  function aggiorna(tempo = 0) {
    const vw = window.innerWidth, vh = window.innerHeight;
    const tratti = [];
    let tratto = [];
    for (const a of ancore) {
      const r = a.getBoundingClientRect();
      tratto.push([r.left, r.top]);
      if (a.dataset.filo === 'fine') { tratti.push(tratto); tratto = []; }
    }
    /* l'ultimo tratto finisce avvolgendosi attorno all'emblema GRIP */
    if (anello) {
      const r = anello.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2, inc = -0.32;
      for (let k = 0; k <= 22; k++) {
        const t = k / 22, ang = Math.PI * 0.9 + t * Math.PI * 3.3, s = 1.32 - 0.3 * t;
        const x = Math.cos(ang) * r.width * 0.53 * s, y = Math.sin(ang) * r.height * 0.4 * s;
        tratto.push([cx + x * Math.cos(inc) - y * Math.sin(inc), cy + x * Math.sin(inc) + y * Math.cos(inc)]);
      }
    }
    if (tratto.length) tratti.push(tratto);

    let d = '';
    for (const t of tratti) {
      let minY = Infinity, maxY = -Infinity;
      for (const p of t) { if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; }
      if (maxY < -vh * 0.5 || minY > vh * 1.5) continue;       // fuori schermo: non si disegna
      d += curva(t);
    }
    if (d !== ultimoD) { linea.setAttribute('d', d); alone.setAttribute('d', d); ultimoD = d; }

    const alt = document.documentElement.scrollHeight - vh;
    const giu = alt > 0 ? Math.min(1, Math.max(0, window.scrollY / alt)) : 0;
    const col = coloreFiloCss(giu * 1.02 - 0.04) + coloreFiloCss(giu * 1.02 + 0.07);
    if (col !== ultimoCol) {
      c0.setAttribute('stop-color', col.slice(0, 7)); c1.setAttribute('stop-color', col.slice(7));
      gPunti.setAttribute('fill', col.slice(7));
      ultimoCol = col;
    }
    gradColore.setAttribute('y2', vh);
    /* il filo "si disegna" verso il basso: sfuma poco sotto i tre quarti dello schermo;
       in fondo alla pagina la sfumatura esce dallo schermo e l'anello si vede intero */
    const fondo = Math.min(1, Math.max(0, (giu - 0.965) / 0.035));
    gradSfuma.setAttribute('y2', (vh * (1.12 + fondo * 0.8)).toFixed(0));

    if (punti.length) {
      const lung = d ? linea.getTotalLength() : 0;
      punti.forEach((c, i) => {
        if (lung < 40) { c.setAttribute('opacity', 0); return; }
        const p = linea.getPointAtLength(((tempo * 0.045 + i / punti.length) % 1) * lung);
        c.setAttribute('cx', p.x.toFixed(1)); c.setAttribute('cy', p.y.toFixed(1)); c.setAttribute('opacity', 0.9);
      });
    }
    return { tratti: tratti.length, lunghezza: d.length, larghezza: vw };
  }

  return { aggiorna, ancore: ancore.length };
}
