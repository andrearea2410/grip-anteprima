/* ==========================================================================
   GRIP — TUTTI I TESTI DEL SITO, in un posto solo.
   Per cambiare una frase si cambia qui, non nell'HTML: le pagine hanno
   attributi  data-t="percorso.della.chiave"  che vengono riempiti da qui.
   Nei testi si può usare <em>…</em> per il corsivo e <br> per andare a capo.

   SEGNAPOSTO: tutto ciò che è tra [parentesi quadre] è un dato che manca.
   DA CONFERMARE CON GRIP: cercare questa scritta per trovare i punti aperti.
   ========================================================================== */

export const AZIENDA = {
  nome: 'GRIP S.R.L.',
  sedeLegale: 'Viale Piceno 19, 20129 Milano',
  piva: '10865450968',
  rea: 'MI-2562590',
  capitale: '10.000 € i.v.',
  ufficio: 'Via Pisciarelli 79, complesso Altamira, 80078 Pozzuoli (NA)',
  telefono: '334 297 5121',
  telefonoLink: '+393342975121',
  email: 'info@gripconsulting.it',
  fondazione: '2019',
  ordineMinimo: '1.200 € + IVA'
};

export const TESTI = {
  nav: {
    aria: 'L’aria', bagno: 'Il bagno', impianto: 'L’impianto', lavoro: 'Come si lavora', catalogo: 'Catalogo',
    cta: 'Richiedi listino', salta: 'Vai al contenuto', menu: 'Menu', chiudi: 'Chiudi'
  },

  hero: {
    esclusiva: 'Esclusiva per l’Italia',
    titolo: 'Il calore è già nell’aria.',
    sotto: 'GRIP lo porta fino al <em>bagno</em>.',
    riga: 'Climatizzatori e pompe di calore HTW e Giatsu, in esclusiva per l’Italia. Bagno e riscaldamento di design Ercos. Un solo fornitore per chi installa, rivende e progetta.',
    cta: 'Richiedi listino',
    cta2: 'Apri il catalogo',
    macro: 'Lo scambiatore, da vicino',
    brina: 'Questa è brina: il calore che la macchina toglie all’aria fredda. Quel calore non si perde. Finisce nell’acqua dell’impianto.',
    etichetta: 'POMPA DI CALORE · MONOBLOCCO · R290',
    scorri: 'Scorri',
    modello: 'Modello 3D indicativo'
  },

  dentro: {
    occhiello: 'Dentro la macchina',
    titolo: 'Prima di proportela, la apriamo.',
    testo: 'Una pompa di calore si giudica da quello che non si vede. La guardiamo pezzo per pezzo, come fai tu prima di installarla.',
    etichette: { mantello: 'Mantello', ventola: 'Ventola', scambiatore: 'Scambiatore', compressore: 'Compressore', quadro: 'Quadro elettrico', basamento: 'Basamento' },
    fatto: 'Compressori garantiti <em>10 anni</em>.',
    fattoSotto: 'Per tutto il resto vale la garanzia del costruttore.',
    nota: 'Vista indicativa: i componenti cambiano da modello a modello.'
  },

  aria: {
    occhiello: 'L’aria',
    titolo: 'HTW e Giatsu, tipo per tipo.',
    testo: 'Due marchi del gruppo GIA, in esclusiva per l’Italia. Dodici famiglie: trascina un pezzo per girarlo.',
    interruttore: 'Marchio',
    catalogo: 'Vedi nel catalogo',
    vuoto: 'Nessun prodotto {marchio} di questo tipo in elenco.',
    foto: 'Foto ufficiale',
    trascina: 'Trascina per ruotare'
  },

  bagno: {
    occhiello: 'Il bagno',
    marchio: 'Ercos',
    logo: '[logo Ercos]',
    titolo: 'Il calore che si <em>tocca</em>.',
    testo: 'Dopo la macchina viene quello che il cliente vede e usa ogni giorno. Ercos: bagno e riscaldamento di design, essenziali.',
    motto: '«Dove la forma incontra la funzione»',
    primi: [
      { n: 'I', titolo: 'Il <em>cromo</em> si giudica dal riflesso.', testo: 'Miscelatori, soffioni e colonne doccia.' },
      { n: 'II', titolo: 'L’acqua arriva <em>calda</em>.', testo: 'Soffioni, box e piatti doccia effetto pietra.' },
      { n: 'III', titolo: 'Il calore sale, <em>tubo per tubo</em>.', testo: 'Scaldasalviette e radiatori multicolonna.' }
    ],
    finiture: 'Finitura',
    notaFiniture: 'Finiture illustrative: quelle disponibili si chiedono a GRIP.',
    famiglie: 'Le famiglie Ercos',
    notaFamiglie: 'Le collezioni sono citate come esempio. Le linee trattate da GRIP sono da confermare.',
    cta: 'Chiedi il listino Ercos'
  },

  impianto: {
    occhiello: 'L’impianto',
    titolo: 'Pezzo per pezzo.',
    testo: 'Dall’unità esterna allo scaldasalviette. Scorri: l’impianto si compone.',
    passi: [
      { forma: 'esterna', nome: 'Unità esterna', marchio: 'HTW · Giatsu' },
      { forma: 'accumulo', nome: 'Accumulatore', marchio: 'HTW · Giatsu' },
      { forma: 'split', nome: 'Split da parete', marchio: 'HTW · Giatsu' },
      { forma: 'cassetta', nome: 'Cassetta', marchio: 'HTW · Giatsu' },
      { forma: 'radiatore', nome: 'Radiatore', marchio: 'Ercos' },
      { forma: 'scaldasalviette', nome: 'Scaldasalviette', marchio: 'Ercos' },
      { forma: 'doccia', nome: 'Doccia', marchio: 'Ercos' }
    ],
    caldo: 'Riscaldamento', freddo: 'Raffrescamento', modo: 'Stagione',
    finale: 'Un impianto intero.<br><em>Un solo fornitore.</em>',
    aiuto: 'Trascina per ruotare · clicca un pezzo per aprirlo nel catalogo',
    nota: 'Schema indicativo, non un progetto.',
    rame: 'RAME · CIRCUITO', acqua: 'MULTISTRATO · ACQUA'
  },

  lavoro: {
    occhiello: 'Come si lavora',
    titolo: 'Dalla richiesta alla prima accensione.',
    passi: [
      { titolo: 'Richiesta', testo: 'Ci scrivi o ci chiami. Ci dici cosa ti serve e per quale cantiere.' },
      { titolo: 'Listino o preventivo', testo: 'I prezzi sono solo su preventivo, fatti sulla tua richiesta.' },
      { titolo: 'Ordine', testo: 'Lavoriamo solo su ordinazione. Ordine minimo 1.200 € + IVA.' },
      { titolo: 'Consegna', testo: 'In tutta Italia.' },
      { titolo: 'Prima accensione', testo: 'Ti seguiamo fino alla messa in funzione.' },
      { titolo: 'Assistenza e ricambi', testo: 'Anche dopo. Compressori garantiti 10 anni; per il resto, garanzia del costruttore.' }
    ]
  },

  perChi: {
    occhiello: 'Per chi lavoriamo',
    titolo: 'Per chi fa questo mestiere.',
    voci: [
      { chi: 'Installatori', cosa: 'Clima, acqua calda e bagno da un fornitore solo. E qualcuno che ti segue fino alla prima accensione.' },
      { chi: 'Rivenditori', cosa: 'Due marchi in esclusiva per l’Italia, HTW e Giatsu, su ordinazione.' },
      { chi: 'Progettisti e termotecnici', cosa: 'Un riferimento unico per l’impianto intero, dall’unità esterna allo scaldasalviette.' },
      { chi: 'Imprese edili', cosa: 'Forniture per il cantiere su preventivo, con consegna in tutta Italia.' },
      { chi: 'Enti e grandi committenti', cosa: 'Preventivi su misura per forniture importanti. Riceviamo su appuntamento.' }
    ]
  },

  contatti: {
    occhiello: 'Contatti',
    titolo: 'Chiedi il <em>listino</em>.',
    testo: 'Rispondiamo con il listino o con un preventivo sulla tua richiesta.',
    telefono: 'Telefono', email: 'Email', ufficio: 'Ufficio operativo', appuntamento: 'Si riceve solo su appuntamento.', sede: 'Sede legale',
    modulo: {
      nome: 'Nome e cognome', azienda: 'Azienda', email: 'Email', telefono: 'Telefono', ruolo: 'Ruolo', provincia: 'Provincia',
      tipo: 'Tipo di richiesta', messaggio: 'Messaggio',
      ruoli: ['Installatore', 'Rivenditore', 'Progettista o termotecnico', 'Impresa edile', 'Ente o grande committente', 'Altro'],
      tipi: { listino: 'Listino', preventivo: 'Preventivo', appuntamento: 'Appuntamento', assistenza: 'Assistenza e ricambi', altro: 'Altro' },
      privacy: 'Ho letto l’<a href="privacy.html">informativa sulla privacy</a> e acconsento al trattamento dei dati per essere ricontattato.',
      invia: 'Prepara la richiesta',
      nota: 'L’invio apre il tuo programma di posta con la richiesta già scritta per info@gripconsulting.it. Poi basta premere Invia.',
      errore: 'Controlla i campi segnati.',
      fatto: 'Abbiamo aperto il tuo programma di posta. Se non si è aperto, scrivi a info@gripconsulting.it.',
      prodotto: 'Prodotto di interesse'
    }
  },

  footer: {
    dati: 'GRIP S.R.L. · Sede legale: Viale Piceno 19, 20129 Milano · P.IVA e C.F. 10865450968 · REA MI-2562590 · Capitale sociale 10.000 € i.v.',
    marchi: 'HTW, Giatsu ed Ercos: i marchi appartengono ai rispettivi proprietari.',
    dal: 'Dal 2019',
    privacy: 'Privacy', cookie: 'Cookie',
    modelli: 'I modelli 3D sono forme indicative, non riproduzioni ufficiali dei prodotti.'
  },

  catalogo: {
    titolo: 'Catalogo',
    testo: 'HTW e Giatsu, in esclusiva per l’Italia. Prezzi solo su preventivo, fornitura su ordinazione.',
    cerca: 'Cerca per nome', tutti: 'Tutti', marchio: 'Marchio', tipo: 'Tipo',
    nessuno: 'Nessun prodotto con questi filtri.',
    azzera: 'Azzera i filtri',
    listino: 'Richiedi listino',
    link: 'Copia indirizzo', copiato: 'Copiato',
    miniatura: 'Forma indicativa',
    foto: 'Foto ufficiale',
    conta: '{n} prodotti',
    ercos: 'Ercos — bagno e riscaldamento di design',
    ercosNota: 'Presentato per famiglie. Le collezioni sono esempi: le linee trattate da GRIP sono da confermare.',
    prezzo: 'Prezzo su preventivo'
  },

  legali: {
    privacyTitolo: 'Informativa sulla privacy',
    cookieTitolo: 'Informativa sui cookie',
    segnaposto: '[Testo da scrivere con il consulente di GRIP. Questa pagina è un segnaposto dichiarato: non è ancora un’informativa valida.]',
    cookieOggi: 'Oggi il sito non installa cookie di profilazione né strumenti di statistica e non carica nulla da altri siti: librerie e caratteri sono nella cartella del sito.',
    torna: 'Torna al sito'
  }
};

/* Riempie gli elementi con data-t (testo) e data-t-attr="attributo:chiave". */
export function riempi(radice = document) {
  const leggi = (k) => k.split('.').reduce((o, p) => (o == null ? o : o[p]), TESTI);
  radice.querySelectorAll('[data-t]').forEach((el) => {
    const v = leggi(el.dataset.t);
    if (typeof v === 'string') el.innerHTML = v; else console.warn('[testi] chiave mancante:', el.dataset.t);
  });
  radice.querySelectorAll('[data-t-attr]').forEach((el) => {
    el.dataset.tAttr.split(';').forEach((coppia) => {
      const [attr, k] = coppia.split(':');
      const v = leggi(k.trim());
      if (typeof v === 'string') el.setAttribute(attr.trim(), v.replace(/<[^>]+>/g, ''));
    });
  });
  radice.querySelectorAll('[data-az]').forEach((el) => { el.textContent = AZIENDA[el.dataset.az] ?? ''; });
}
