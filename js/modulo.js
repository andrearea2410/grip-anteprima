/* ==========================================================================
   GRIP — modulo contatti.
   OGGI NON C'È UN SERVER: l'invio apre il programma di posta dell'utente
   con la richiesta già scritta per info@gripconsulting.it (indirizzo mailto:).
   Il sito lo dice chiaramente sotto il bottone.

   TODO (da collegare): quando ci sarà un servizio di invio, sostituire il
   contenuto di `invia()` con una chiamata fetch() a quel servizio e
   mostrare l'esito vero. Il resto (campi, controlli) resta com'è.
   ========================================================================== */
import { TESTI, AZIENDA } from '../content.js';
import { PRODOTTI, MARCHI } from '../dati/prodotti.js';

const T = TESTI.contatti.modulo;

function nomeProdotto(id) {
  const p = PRODOTTI.find((x) => x.id === id);
  return p ? `${MARCHI[p.marchio].nome} ${p.nome}` : id;
}

export function avviaModulo(scorriA) {
  const form = document.getElementById('modulo');
  if (!form) return;
  const ruolo = form.querySelector('#m-ruolo');
  ruolo.innerHTML = '<option value="">—</option>' + T.ruoli.map((r) => `<option>${r}</option>`).join('');
  const tipi = form.querySelector('#m-tipi');
  tipi.innerHTML = Object.entries(T.tipi).map(([k, v], i) => `<input type="radio" name="tipo" id="m-tipo-${k}" value="${k}"${i === 0 ? ' checked' : ''}><label for="m-tipo-${k}">${v}</label>`).join('');
  const scelto = form.querySelector('#prodotto-scelto');
  let prodotto = '';

  function prepara({ tipo, prodotto: p } = {}) {
    if (tipo && form.querySelector(`#m-tipo-${tipo}`)) form.querySelector(`#m-tipo-${tipo}`).checked = true;
    if (p) {
      prodotto = nomeProdotto(p);
      scelto.hidden = false;
      scelto.textContent = `${T.prodotto}: ${prodotto}`;
    }
  }

  /* arrivo dal catalogo: index.html?richiesta=listino&prodotto=id#contatti */
  const q = new URLSearchParams(location.search);
  if (q.get('richiesta') || q.get('prodotto')) prepara({ tipo: q.get('richiesta'), prodotto: q.get('prodotto') });

  /* i bottoni "Richiedi listino" della pagina */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-richiesta]');
    if (!a) return;
    prepara({ tipo: a.dataset.richiesta, prodotto: a.dataset.prodotto });
  });

  function controlla() {
    let ok = true;
    form.querySelectorAll('.errato').forEach((x) => x.classList.remove('errato'));
    form.querySelectorAll('[required]').forEach((c) => {
      const valido = c.type === 'checkbox' ? c.checked : c.value.trim() !== '' && c.checkValidity();
      if (!valido) { ok = false; (c.closest('.campo') || c.closest('.consenso')).classList.add('errato'); c.setAttribute('aria-invalid', 'true'); }
      else c.removeAttribute('aria-invalid');
    });
    return ok;
  }

  function invia(d) {
    const tipo = T.tipi[d.get('tipo')] || d.get('tipo');
    const righe = [
      `Richiesta: ${tipo}`,
      prodotto ? `${T.prodotto}: ${prodotto}` : null,
      '',
      `Nome: ${d.get('nome')}`,
      `Azienda: ${d.get('azienda')}`,
      `Ruolo: ${d.get('ruolo')}`,
      `Provincia: ${d.get('provincia')}`,
      `Email: ${d.get('email')}`,
      d.get('telefono') ? `Telefono: ${d.get('telefono')}` : null,
      '',
      d.get('messaggio') || '',
      '',
      'Consenso privacy: sì'
    ].filter((r) => r !== null);
    const oggetto = `${tipo} — ${d.get('azienda')}${prodotto ? ' — ' + prodotto : ''}`;
    location.href = `mailto:${AZIENDA.email}?subject=${encodeURIComponent(oggetto)}&body=${encodeURIComponent(righe.join('\n'))}`;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const esito = form.querySelector('#m-esito');
    if (!controlla()) { esito.textContent = T.errore; form.querySelector('[aria-invalid="true"]')?.focus(); return; }
    invia(new FormData(form));
    esito.textContent = T.fatto;
  });

  if (location.hash === '#contatti' && scorriA) setTimeout(() => scorriA('#contatti'), 600);
}
