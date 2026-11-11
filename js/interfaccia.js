/* ==========================================================================
   GRIP — interfaccia: titoli che si rivelano, fasi dei testi nelle sezioni
   bloccate, cursore, bottoni magnetici, barra in alto, menu.
   ========================================================================== */

/* Divide un titolo in parole, ognuna dentro una maschera (il corsivo resta corsivo). */
export function preparaRivelazioni() {
  document.querySelectorAll('[data-rivela]').forEach((el) => {
    let i = 0;
    const avvolgi = (nodo) => {
      [...nodo.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const fr = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((parola) => {
            if (!parola) return;
            if (/^\s+$/.test(parola)) { fr.appendChild(document.createTextNode(' ')); return; }
            const m = document.createElement('span'); m.className = 'par';
            const s = document.createElement('span'); s.textContent = parola; s.style.setProperty('--i', i++);
            m.appendChild(s); fr.appendChild(m);
          });
          n.replaceWith(fr);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') avvolgi(n);
      });
    };
    el.setAttribute('aria-label', el.textContent.trim());
    avvolgi(el);
  });
}

export function osservaRivelazioni(fuori = '.hero') {
  const ST = window.ScrollTrigger;
  document.querySelectorAll('[data-rivela]').forEach((el) => {
    if (el.closest(fuori)) return;                       // l'hero parte quando sparisce il loader
    if (ST) ST.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => el.classList.add('vista') });
    else el.classList.add('vista');
  });
}

/* Fasi: dentro una sezione bloccata, ogni testo vive tra due valori dell'avanzamento. */
export function creaFasi() {
  const sezioni = [...document.querySelectorAll('[data-pin]')].map((el) => ({
    el, p: -1,
    fasi: [...el.querySelectorAll('[data-fase]')].map((f) => { const [da, a] = f.dataset.fase.split(',').map(Number); return { el: f, da, a, o: -1 }; })
  }));
  const RAMPA = 0.045;
  return function aggiorna() {
    const vh = window.innerHeight;
    for (const s of sezioni) {
      const r = s.el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)));
      if (Math.abs(p - s.p) < 0.0004) continue;
      s.p = p;
      s.el.style.setProperty('--p', p.toFixed(4));
      for (const f of s.fasi) {
        const o = Math.min(1, Math.max(0, Math.min((p - f.da) / RAMPA, (f.a - p) / RAMPA)));
        if (Math.abs(o - f.o) < 0.004) continue;
        f.o = o;
        f.el.style.opacity = o.toFixed(3);
        f.el.style.transform = o < 1 ? `translate3d(0, ${((1 - o) * 14).toFixed(1)}px, 0)` : '';
        f.el.classList.toggle('spenta', o < 0.01);
      }
    }
  };
}

export function avviaCursore() {
  const c = document.getElementById('cursore');
  if (!c || !window.matchMedia('(hover: hover) and (pointer: fine)').matches || !window.gsap) return;
  const x = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3.out' }), y = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3.out' });
  const SEL = 'a, button, label, input, select, textarea, [data-cursore], .impianto-presa';
  window.addEventListener('pointermove', (e) => {
    x(e.clientX); y(e.clientY);
    c.classList.add('attivo');
    c.classList.toggle('grande', !!e.target.closest?.(SEL));
  }, { passive: true });
  document.addEventListener('pointerleave', () => c.classList.remove('attivo'));
}

export function avviaMagneti() {
  if (!window.gsap || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll('.magnete').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.22, y: (e.clientY - r.top - r.height / 2) * 0.32, duration: 0.6, ease: 'power3.out' });
    });
    el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'power3.out' }));
  });
}

export function avviaBarra() {
  const barra = document.getElementById('barra'), menu = document.getElementById('menu'), apri = document.getElementById('apri-menu');
  const stato = () => barra?.classList.toggle('scesa', window.scrollY > 30);
  window.addEventListener('scroll', stato, { passive: true }); stato();
  apri?.addEventListener('click', () => {
    const aperto = menu.classList.toggle('aperto');
    apri.setAttribute('aria-expanded', String(aperto));
  });
  menu?.addEventListener('click', (e) => { if (e.target.closest('a')) { menu.classList.remove('aperto'); apri?.setAttribute('aria-expanded', 'false'); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { menu?.classList.remove('aperto'); apri?.setAttribute('aria-expanded', 'false'); } });
}

/* La fascia orizzontale dell'aria: su schermi larghi scorre in orizzontale mentre la pagina scende. */
export function creaPista(scorriA) {
  const sez = document.getElementById('aria'), pista = document.getElementById('aria-pista');
  if (!sez || !pista) return () => {};
  let ultimo = '';
  const libera = () => window.innerWidth <= 820 || document.documentElement.classList.contains('fermo');
  /* da tastiera: quando il fuoco entra in un riquadro fuori schermo, la pagina scorre fino a lì */
  pista.addEventListener('focusin', (e) => {
    const tipo = e.target.closest('.tipo');
    if (!tipo || libera()) return;
    const tutti = [...pista.children], i = tutti.indexOf(tipo);
    const y = sez.getBoundingClientRect().top + window.scrollY + (i / (tutti.length - 1)) * (sez.offsetHeight - window.innerHeight);
    if (Math.abs(y - window.scrollY) > 40) scorriA(y);
  });
  return function aggiorna() {
    if (libera()) { if (ultimo) { pista.style.transform = ''; ultimo = ''; } return; }
    const r = sez.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight)));
    const corsa = Math.max(0, pista.scrollWidth - window.innerWidth);
    const tx = `translate3d(${(-p * corsa).toFixed(1)}px,0,0)`;
    if (tx !== ultimo) { pista.style.transform = tx; ultimo = tx; }
  };
}
