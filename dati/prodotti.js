/* ==========================================================================
   GRIP — ELENCO UNICO DEI PRODOTTI
   Da qui si costruiscono: la vetrina "L'aria", il catalogo, i filtri,
   le miniature 3D e i clic sull'impianto. Per aggiungere un prodotto basta
   aggiungere una riga a PRODOTTI: non serve toccare l'HTML.

   Campi di un prodotto:
     id        indirizzo diretto (catalogo.html#id), unico
     marchio   'htw' | 'giatsu'
     tipo      una delle chiavi di TIPI (categoria commerciale)
     nome      come lo scrive GRIP  — NON CAMBIARE
     forma     il pezzo 3D che lo rappresenta (chiave di FORME)
     chips     solo fatti certi (dal nome o dalla lista di GRIP)
     foto      facoltativa: file in assets/prodotti/
     codice    vuoto: servirà quando il sito diventerà e-commerce
     prezzo    vuoto: idem (oggi i prezzi sono solo su preventivo)
   ========================================================================== */

export const MARCHI = {
  htw:    { nome: 'HTW',    gruppo: 'GIA Group', logo: 'assets/marchi/htw.png',    colore: '#004899' },
  giatsu: { nome: 'Giatsu', gruppo: 'GIA Group', logo: 'assets/marchi/giatsu.png', colore: '#CD2C27' }
};

export const TIPI = {
  casa:            'Climatizzazione casa',
  ufficio:         'Ufficio e negozi',
  industriale:     'Industriale · VRF',
  pompe:           'Pompe di calore e acqua calda',
  scaldabagni:     'Scaldabagni',
  ventilatori:     'Ventilatori',
  deumidificatori: 'Deumidificatori'
};

/* Il pezzo 3D di ogni forma: nome leggibile e gruppo della vetrina a cui appartiene. */
export const FORME = {
  'split':           { nome: 'Split da parete',        vetrina: 'split' },
  'console':         { nome: 'Console',                vetrina: 'split' },
  'cassetta':        { nome: 'Cassetta',               vetrina: 'cassetta' },
  'pavimento':       { nome: 'Pavimento / soffitto',   vetrina: 'pavimento' },
  'canalizzato':     { nome: 'Canalizzato',            vetrina: 'canalizzato' },
  'colonna':         { nome: 'Colonna',                vetrina: 'colonna' },
  'vrf':             { nome: 'VRF',                    vetrina: 'vrf' },
  'esterna':         { nome: 'Pompa di calore',        vetrina: 'esterna' },
  'accumulo':        { nome: 'Accumulatore',           vetrina: 'accumulo' },
  'boiler':          { nome: 'Scaldabagno elettrico',  vetrina: 'boiler' },
  'duo':             { nome: 'Scaldabagno doppia tanica', vetrina: 'boiler' },
  'gas':             { nome: 'Scaldabagno a gas',      vetrina: 'boiler' },
  'ventola-terra':   { nome: 'Ventilatore da terra',   vetrina: 'ventola-terra' },
  'ventola-parete':  { nome: 'Ventilatore da parete',  vetrina: 'ventola-terra' },
  'deumidificatore': { nome: 'Deumidificatore',        vetrina: 'deumidificatore' },
  'portatile':       { nome: 'Portatile',              vetrina: 'portatile' }
};

/* I dodici pezzi della vetrina "L'aria", nell'ordine in cui scorrono. */
export const VETRINA = [
  { id: 'split',           titolo: 'Split da parete',       nota: 'MONOSPLIT · MULTISPLIT · CONSOLE' },
  { id: 'cassetta',        titolo: 'Cassetta',              nota: 'A SOFFITTO' },
  { id: 'pavimento',       titolo: 'Pavimento / soffitto',  nota: 'DOPPIA INSTALLAZIONE' },
  { id: 'canalizzato',     titolo: 'Canalizzato',           nota: 'A SCOMPARSA' },
  { id: 'colonna',         titolo: 'Colonna',               nota: 'VERTICALE' },
  { id: 'vrf',             titolo: 'VRF',                   nota: 'UNITÀ ESTERNE · UNITÀ INTERNE' },
  { id: 'esterna',         titolo: 'Pompa di calore',       nota: 'MONOBLOCCO · R290' },
  { id: 'accumulo',        titolo: 'Accumulatore',          nota: 'AEROTERMICO · ACQUA CALDA' },
  { id: 'boiler',          titolo: 'Scaldabagno',           nota: 'ELETTRICO · A GAS' },
  { id: 'ventola-terra',   titolo: 'Ventilatore',           nota: 'DA TERRA · DA PARETE' },
  { id: 'deumidificatore', titolo: 'Deumidificatore',       nota: 'PORTATILE' },
  { id: 'portatile',       titolo: 'Portatile',             nota: 'CLIMATIZZATORE MOBILE' }
];

const p = (id, marchio, tipo, nome, forma, chips, extra = {}) =>
  ({ id, marchio, tipo, nome, forma, chips, foto: '', codice: '', prezzo: '', ...extra });

export const PRODOTTI = [
  /* ---------------- HTW ---------------- */
  p('htw-ix39-plus', 'htw', 'casa', 'IX39 Plus', 'split', ['Monosplit']),
  p('htw-ix75b', 'htw', 'casa', 'IX75B', 'split', ['Monosplit']),
  p('htw-ix21-plus', 'htw', 'casa', 'IX21 Plus', 'split', ['Monosplit']),
  p('htw-ix21-unig', 'htw', 'casa', 'IX21 Unig', 'split', ['Multisplit']),
  p('htw-p41', 'htw', 'casa', 'P41', 'portatile', ['Portatile']),

  p('htw-admira', 'htw', 'ufficio', 'Admira Plus a cassetta', 'cassetta', ['Cassetta'], { foto: 'htw-admira.webp' }),
  p('htw-admira-pavimento', 'htw', 'ufficio', 'Admira Plus pavimento/soffitto', 'pavimento', ['Pavimento/soffitto']),
  p('htw-admira-canalizzato', 'htw', 'ufficio', 'Admira Plus canalizzato', 'canalizzato', ['Canalizzato']),

  p('htw-vrf', 'htw', 'industriale', 'VRF', 'vrf', ['Unità esterne', 'Unità interne']),

  p('htw-eco-thermal', 'htw', 'pompe', 'Eco Thermal monoblocco R290', 'esterna', ['Monoblocco', 'R290'], { foto: 'htw-eco-thermal.webp' }),
  p('htw-accumulatore', 'htw', 'pompe', 'Accumulatore aerotermico', 'accumulo', ['Acqua calda']),
  p('htw-etna', 'htw', 'pompe', 'Etna', 'esterna', ['Accumulatore aerotermico', 'Esterno']),

  p('htw-koi-duo', 'htw', 'scaldabagni', 'KOI DUO', 'duo', ['Elettrico', 'Doppia tanica']),
  p('htw-evolution', 'htw', 'scaldabagni', 'Evolution', 'boiler', ['Elettrico']),
  p('htw-nox-12l', 'htw', 'scaldabagni', 'Nox 12L', 'gas', ['A gas', 'Metano e GPL']),

  p('htw-vp-60fs', 'htw', 'ventilatori', 'VP-60FS', 'ventola-terra', ['Da terra']),
  p('htw-vt-33rep1', 'htw', 'ventilatori', 'VT-33REP1', 'ventola-parete', ['Da parete']),

  p('htw-a4', 'htw', 'deumidificatori', 'A4', 'deumidificatore', ['Deumidificatore']),

  /* ---------------- Giatsu ---------------- */
  /* DA CONFERMARE CON GRIP: la foto "giatsu-multisplit" non era legata a nessun prodotto;
     l'ho assegnata ad Aroma 3 perché è l'unico split multisplit Giatsu dell'elenco. */
  p('giatsu-aroma-3', 'giatsu', 'casa', 'Aroma 3', 'split', ['Multisplit'], { foto: 'giatsu-multisplit.webp' }),
  p('giatsu-skura-b', 'giatsu', 'casa', 'Skura B', 'split', ['Monosplit']),
  p('giatsu-aroma-plus-b', 'giatsu', 'casa', 'Aroma Plus B', 'split', ['Monosplit']),
  p('giatsu-ikala', 'giatsu', 'casa', 'Ikala', 'split', ['Monosplit']),
  p('giatsu-console-admira-3', 'giatsu', 'casa', 'Console Admira 3', 'console', ['Multisplit', 'Console']),

  p('giatsu-admira-cassetta', 'giatsu', 'ufficio', 'Admira Plus a cassetta', 'cassetta', ['Cassetta']),
  p('giatsu-admira-pavimento', 'giatsu', 'ufficio', 'Admira Plus pavimento/soffitto', 'pavimento', ['Pavimento/soffitto']),
  p('giatsu-admira-canalizzato', 'giatsu', 'ufficio', 'Admira Plus canalizzato', 'canalizzato', ['Canalizzato']),
  p('giatsu-admira-colonna', 'giatsu', 'ufficio', 'Admira Plus colonna verticale', 'colonna', ['Colonna']),

  p('giatsu-vrf', 'giatsu', 'industriale', 'VRF', 'vrf', ['Unità esterne', 'Unità interne']),

  p('giatsu-monoblocco-r290', 'giatsu', 'pompe', 'Eco Thermal monoblocco R290', 'esterna', ['Monoblocco', 'R290'], { foto: 'giatsu-monoblocco-r290.webp' }),
  p('giatsu-accumulatore', 'giatsu', 'pompe', 'Accumulatore aerotermico', 'accumulo', ['Acqua calda']),
  p('giatsu-norikura', 'giatsu', 'pompe', 'Norikura', 'esterna', ['Accumulatore aerotermico', 'Esterno']),

  p('giatsu-vitaheat', 'giatsu', 'scaldabagni', 'Vitaheat', 'boiler', ['Elettrico']),
  p('giatsu-rombo', 'giatsu', 'scaldabagni', 'Rombo', 'gas', ['A gas']),

  p('giatsu-dr', 'giatsu', 'deumidificatori', 'DR', 'deumidificatore', ['Deumidificatore'])
];

/* --------------------------------------------------------------------------
   ERCOS — famiglie di prodotto (dal sito ercos.it).
   DA CONFERMARE CON GRIP: quali linee tratta davvero. I nomi delle
   collezioni sono solo esempi e nel sito compaiono come tali.
   -------------------------------------------------------------------------- */
export const ERCOS = [
  { id: 'ercos-caldo', titolo: 'Caldo', forma: 'radiatore', forma2: 'scaldasalviette',
    righe: [
      ['Radiatori multicolonna in acciaio', 'es. Comby'],
      ['Radiatori in ghisa', 'es. Liberty, Colonnine, E-100'],
      ['Scaldasalviette elettrici', 'es. Elettra Digitale'],
      ['Scaldasalviette idraulici', 'es. Monica, Tekno, Opera, Square']
    ] },
  { id: 'ercos-bagno', titolo: 'Bagno', forma: 'doccia', forma2: 'miscelatore',
    righe: [
      ['Piatti doccia', 'es. Runa, RocQ, Stone'],
      ['Box doccia, soffioni e colonne doccia', ''],
      ['Miscelatori', 'es. Stilox, Viktor, Versilia'],
      ['Sanitari', 'es. Kite, Surf, Wave'],
      ['Lavabi, mobili, specchi, vasche', '']
    ] },
  { id: 'ercos-sedili', titolo: 'Sedili WC', forma: null,
    righe: [['Sedili WC', '']] }
];

export const prodottiPerVetrina = (idVetrina, marchio) =>
  PRODOTTI.filter((x) => FORME[x.forma].vetrina === idVetrina && (!marchio || x.marchio === marchio));
