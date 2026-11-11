/* ==========================================================================
   GRIP — pezzi dell'ARIA (HTW e Giatsu): un pezzo 3D per ogni forma
   dell'elenco prodotti. Forme indicative, proporzioni credibili, nessuna
   targhetta o sigla. Il fronte guarda +Z, la base è a y = 0.
   ========================================================================== */
import { THREE, tr, pezzo, scatola, cilindro, anello, lastra, tornio, tubo, ventola, grigliaRaggi, feritoie, gruppo, sagomaRett } from './util.js';
import { mat, matCopia, ombra } from '../materiali.js';

const PI = Math.PI;
const bianca = 'plasticaBianca', nera = 'plasticaNera';

/* Profilo estruso lungo X (per scocche con sezione sagomata, come lo split). */
function estruso(punti, larghezza, smusso = 0.012) {
  const s = new THREE.Shape();
  s.moveTo(punti[0][0], punti[0][1]);
  for (let i = 1; i < punti.length; i++) {
    const p = punti[i];
    if (p.length === 4) s.quadraticCurveTo(p[0], p[1], p[2], p[3]); else s.lineTo(p[0], p[1]);
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: larghezza - smusso * 2, bevelEnabled: true, bevelThickness: smusso, bevelSize: smusso * 0.7, bevelSegments: 4, curveSegments: 24 });
  return tr(g, [larghezza / 2 - smusso, 0, 0], [0, -PI / 2, 0]);
}

/* ---------------------------------------------------------------- split */
export function split() {
  const W = 0.92, H = 0.3;
  const corpo = estruso([[0, 0.02], [0, H], [0.13, H], [0.2, H, 0.212, 0.2], [0.214, 0.1], [0.212, 0.04, 0.16, 0.0], [0.05, 0.0], [0, 0.0, 0, 0.02]], W);
  const g = gruppo('split', [
    pezzo([corpo], bianca),
    pezzo([
      tr(scatola(W - 0.07, 0.004, 0.11, 0.001, 1), [0, -0.0005, 0.105]),          // bocca d'uscita
      tr(feritoie(W - 0.1, 0.1, 9, 0.004, 1.2), [0, H + 0.0005, 0.07], [-PI / 2, 0, 0]), // presa d'aria in alto
      tr(scatola(W - 0.012, 0.0025, 0.004, 0.001, 1), [0, 0.085, 0.2135])           // fuga del pannello
    ], nera),
    pezzo([tr(scatola(W - 0.09, 0.006, 0.085, 0.003, 2), [0, 0.012, 0.135], [0.5, 0, 0])], bianca, 'deflettore'),
    pezzo([tr(scatola(0.075, 0.03, 0.003, 0.0012, 1), [W / 2 - 0.12, 0.155, 0.2145])], 'vetroScuro'),
    tr2(ombra(1.2, 0.5, 0.35), [0, -0.02, 0])
  ]);
  return g;
}
function tr2(obj, pos) { obj.position.set(...pos); return obj; }

/* -------------------------------------------------------------- console */
export function consolle() {
  const W = 0.72, H = 0.6, D = 0.2;
  return gruppo('console', [
    pezzo([tr(scatola(W, H, D, 0.03, 5), [0, H / 2 + 0.04, 0])], bianca),
    pezzo([
      tr(feritoie(W - 0.14, 0.05, 4, 0.006, 0.9), [0, H + 0.041, 0.02], [-PI / 2, 0, 0]),
      tr(feritoie(W - 0.12, 0.12, 8, 0.006, -0.5), [0, 0.14, D / 2 + 0.001]),
      tr(scatola(W - 0.02, 0.003, 0.003, 0.001, 1), [0, 0.47, D / 2 + 0.0005])
    ], nera),
    pezzo([tr(scatola(0.06, 0.022, 0.003, 0.001, 1), [W / 2 - 0.1, 0.53, D / 2 + 0.001])], 'vetroScuro'),
    pezzo([tr(scatola(0.05, 0.04, D - 0.04, 0.008), [-W / 2 + 0.07, 0.02, 0]), tr(scatola(0.05, 0.04, D - 0.04, 0.008), [W / 2 - 0.07, 0.02, 0])], 'plasticaGrigia'),
    ombra(1.1, 0.5, 0.5)
  ]);
}

/* ------------------------------------------------------------- cassetta */
export function cassetta() {
  const P = 0.84, sp = 0.03, B = 0.58;
  const fori = [];
  for (let k = 0; k < 4; k++) {
    const a = (k * PI) / 2, r = P / 2 - 0.075;
    const oriz = k % 2 === 0;
    fori.push({ tipo: 'rett', x: Math.round(Math.sin(a)) * r, y: Math.round(Math.cos(a)) * r, w: oriz ? 0.5 : 0.055, h: oriz ? 0.055 : 0.5, r: 0.02 });
  }
  const deflettori = [];
  for (let k = 0; k < 4; k++) {
    const a = (k * PI) / 2, r = P / 2 - 0.075, oriz = k % 2 === 0;
    deflettori.push(tr(scatola(oriz ? 0.48 : 0.012, oriz ? 0.012 : 0.48, 0.05, 0.004, 2), [Math.round(Math.sin(a)) * r, Math.round(Math.cos(a)) * r, 0.0],
      [oriz ? Math.round(Math.cos(a)) * 0.6 : 0, oriz ? 0 : -Math.round(Math.sin(a)) * 0.6, 0]));
  }
  const griglia = [];
  for (let i = 0; i < 17; i++) griglia.push(tr(scatola(0.44, 0.008, 0.008, 0.002, 1), [0, -0.2 + i * 0.025, 0.006]));
  return gruppo('cassetta', [
    pezzo([tr(lastra(P, P, sp, 0.05, fori, 0.006), [0, P / 2, 0]), ...deflettori.map((d) => tr(d, [0, P / 2, 0]))], bianca),
    pezzo([tr(lastra(0.48, 0.48, 0.006, 0.03, [], 0.002), [0, P / 2, 0.012]), tr(fondiLista(griglia), [0, P / 2, 0.012])], bianca, 'griglia'),
    pezzo([tr(scatola(0.66, 0.66, 0.02, 0.004, 1), [0, P / 2, -0.02]), tr(scatola(0.47, 0.47, 0.004, 0.002, 1), [0, P / 2, 0.008])], 'interno'),
    pezzo([tr(scatola(B, B, 0.24, 0.02), [0, P / 2, -0.15]),
      tr(scatola(0.04, 0.05, 0.004, 0.001, 1), [-B / 2 - 0.02, P / 2 + 0.2, -0.2]), tr(scatola(0.04, 0.05, 0.004, 0.001, 1), [B / 2 + 0.02, P / 2 + 0.2, -0.2]),
      tr(scatola(0.04, 0.05, 0.004, 0.001, 1), [-B / 2 - 0.02, P / 2 - 0.2, -0.2]), tr(scatola(0.04, 0.05, 0.004, 0.001, 1), [B / 2 + 0.02, P / 2 - 0.2, -0.2])], 'zincato'),
    pezzo([tr(cilindro(0.006, 0.08, 12), [B / 2 + 0.03, P / 2 + 0.1, -0.12], [0, 0, PI / 2]), tr(cilindro(0.009, 0.08, 12), [B / 2 + 0.03, P / 2 + 0.06, -0.12], [0, 0, PI / 2])], 'rame'),
    pezzo([tr(scatola(0.05, 0.02, 0.003, 0.001, 1), [P / 2 - 0.09, 0.05, sp / 2 + 0.001])], 'vetroScuro')
  ]);
}
function fondiLista(l) { return pezzo(l, bianca).geometry; }

/* ---------------------------------------------------- pavimento/soffitto */
export function pavimento() {
  const W = 1.22, H = 0.66, D = 0.23;
  const corpo = estruso([[0, 0.0], [0, H], [0.1, H], [0.2, H, 0.225, H - 0.1], [0.23, 0.1], [0.23, 0.02, 0.19, 0.0]], W, 0.02);
  return gruppo('pavimento', [
    pezzo([tr(corpo, [0, 0.03, 0])], bianca),
    pezzo([
      tr(feritoie(W - 0.16, 0.26, 13, 0.006, -0.45), [0, 0.24, 0.231]),
      tr(scatola(W - 0.12, 0.004, 0.07, 0.001, 1), [0, H + 0.03, 0.12])
    ], nera),
    pezzo([tr(scatola(W - 0.13, 0.006, 0.075, 0.003, 2), [0, H + 0.04, 0.15], [-0.45, 0, 0])], bianca),
    pezzo([tr(scatola(0.09, 0.028, 0.003, 0.001, 1), [W / 2 - 0.14, H - 0.1, 0.229], [-0.1, 0, 0])], 'vetroScuro'),
    ombra(1.6, 0.6, 0.5)
  ]);
}

/* ---------------------------------------------------------- canalizzato */
export function canalizzato() {
  const W = 1.0, H = 0.25, D = 0.68;
  const staffe = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) staffe.push(tr(scatola(0.05, 0.004, 0.06, 0.001, 1), [sx * (W / 2 + 0.02), H + 0.06, sz * (D / 2 - 0.1)]), tr(scatola(0.004, 0.06, 0.06, 0.001, 1), [sx * (W / 2 + 0.002), H + 0.03, sz * (D / 2 - 0.1)]));
  return gruppo('canalizzato', [
    pezzo([tr(scatola(W, H, D, 0.006), [0, H / 2 + 0.06, 0]),
      tr(lastra(W - 0.16, H - 0.07, 0.03, 0.006, [{ tipo: 'rett', x: 0, y: 0, w: W - 0.22, h: H - 0.13, r: 0.004 }], 0.002), [0, H / 2 + 0.06, D / 2 + 0.014]),
      tr(scatola(0.11, H - 0.05, 0.3, 0.004), [W / 2 + 0.054, H / 2 + 0.06, -0.1]), ...staffe,
      tr(scatola(W - 0.1, 0.003, 0.003, 0.001, 1), [0, 0.18, D / 2 + 0.001])], 'zincato'),
    pezzo([tr(scatola(W - 0.22, H - 0.13, 0.004, 0.001, 1), [0, H / 2 + 0.06, D / 2 - 0.02])], 'interno'),
    pezzo([tr(feritoie(W - 0.24, H - 0.15, 5, 0.02, 0.5), [0, H / 2 + 0.06, D / 2 - 0.004])], 'alluminio'),
    pezzo([tr(cilindro(0.006, 0.07, 12), [W / 2 + 0.14, 0.2, -0.16], [0, 0, PI / 2]), tr(cilindro(0.0095, 0.07, 12), [W / 2 + 0.14, 0.15, -0.16], [0, 0, PI / 2])], 'rame'),
    pezzo([tr(cilindro(0.012, 0.04, 16), [W / 2 + 0.13, 0.25, 0.0], [0, 0, PI / 2])], nera),
    ombra(1.5, 1.1, 0.55)
  ]);
}

/* -------------------------------------------------------------- colonna */
export function colonna() {
  const W = 0.52, H = 1.82, D = 0.34;
  const lamelle = [];
  for (let i = 0; i < 9; i++) lamelle.push(tr(scatola(0.008, 0.34, 0.03, 0.002, 1), [-0.18 + i * 0.045, H - 0.27, D / 2 - 0.004], [0, 0.35, 0]));
  return gruppo('colonna', [
    pezzo([tr(scatola(W, H, D, 0.045, 5), [0, H / 2 + 0.02, 0])], bianca),
    pezzo([tr(scatola(W - 0.1, 0.36, 0.006, 0.01, 2), [0, H - 0.27, D / 2 - 0.001]), tr(feritoie(W - 0.12, 0.4, 16, 0.006, -0.5), [0, 0.3, D / 2 + 0.001]),
      tr(scatola(W - 0.03, 0.003, 0.003, 0.001, 1), [0, 0.62, D / 2 + 0.0008])], nera),
    pezzo(lamelle, 'plasticaGrigia'),
    pezzo([tr(scatola(0.16, 0.05, 0.003, 0.001, 1), [0, H - 0.52, D / 2 + 0.0012])], 'vetroScuro'),
    ombra(0.9, 0.7, 0.55)
  ]);
}

/* ------------------------------------------------------------------ vrf */
export function vrf() {
  const W = 0.98, H = 1.62, D = 0.76, hb = 0.72;
  const alette = [];
  const na = 60;
  for (let i = 0; i < na; i++) {
    alette.push(tr(new THREE.BoxGeometry(0.0012, H - hb - 0.1, 0.03), [-W / 2 + 0.03 + (i / (na - 1)) * (W - 0.06), hb + (H - hb) / 2 - 0.02, -D / 2 + 0.03]));
    alette.push(tr(new THREE.BoxGeometry(0.03, H - hb - 0.1, 0.0012), [-W / 2 + 0.03, hb + (H - hb) / 2 - 0.02, -D / 2 + 0.03 + (i / (na - 1)) * (D - 0.06)]));
    alette.push(tr(new THREE.BoxGeometry(0.03, H - hb - 0.1, 0.0012), [W / 2 - 0.03, hb + (H - hb) / 2 - 0.02, -D / 2 + 0.03 + (i / (na - 1)) * (D - 0.06)]));
  }
  const montanti = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) montanti.push(tr(scatola(0.05, H, 0.05, 0.008), [sx * (W / 2 - 0.025), H / 2 + 0.06, sz * (D / 2 - 0.025)]));
  const xs = [-0.245, 0.245];
  const pale = xs.map((x) => { const p = pezzo(ventola({ r0: 0.05, r1: 0.19, pale: 4 }), matCopia('plasticaNera', { side: THREE.DoubleSide, roughness: 0.3 }), 'pale'); p.rotation.x = -PI / 2; p.position.set(x, H + 0.0, 0); return p; });
  const g = gruppo('vrf', [
    pezzo([
      tr(lastra(W - 0.1, hb, 0.012, 0.01), [0, hb / 2 + 0.06, D / 2 - 0.006]),
      tr(lastra(D - 0.1, hb, 0.012, 0.01), [W / 2 - 0.006, hb / 2 + 0.06, 0], [0, PI / 2, 0]),
      tr(lastra(D - 0.1, hb, 0.012, 0.01), [-W / 2 + 0.006, hb / 2 + 0.06, 0], [0, PI / 2, 0]),
      tr(lastra(W - 0.1, hb, 0.012, 0.01), [0, hb / 2 + 0.06, -D / 2 + 0.006]),
      tr(lastra(W - 0.1, H - hb - 0.02, 0.012, 0.01), [0, hb + (H - hb) / 2 + 0.055, D / 2 - 0.006]),
      ...montanti,
      tr(lastra(W, D, 0.03, 0.02, xs.map((x) => ({ tipo: 'cerchio', x, y: 0, r: 0.215 })), 0.006), [0, H + 0.075, 0], [-PI / 2, 0, 0]),
      tr(scatola(W, 0.06, D, 0.01), [0, 0.03, 0])
    ], 'lamieraChiara'),
    pezzo(alette, 'alluminio'),
    pezzo([
      ...xs.map((x) => tr(grigliaRaggi({ R: 0.22, rMozzo: 0.04, raggi: 36, bombatura: 0.03 }), [x, H + 0.088, 0], [-PI / 2, 0, 0])),
      tr(scatola(0.003, hb - 0.06, 0.003, 0.001, 1), [0, hb / 2 + 0.06, D / 2 + 0.001]),
      tr(scatola(0.03, 0.09, 0.006, 0.003, 2), [-0.07, hb / 2 + 0.1, D / 2 + 0.002]), tr(scatola(0.03, 0.09, 0.006, 0.003, 2), [0.07, hb / 2 + 0.1, D / 2 + 0.002])
    ], nera),
    pezzo([tr(scatola(W - 0.08, 0.3, D - 0.08, 0.005, 1), [0, H - 0.12, 0])], 'interno'),
    ...pale,
    ombra(1.7, 1.4, 0.6)
  ], { pale });
  return g;
}

/* ------------------------------------------------------------- accumulo */
export function accumulo() {
  const R = 0.28, H = 1.72, hs = 1.22;
  const serbatoio = tornio([[0, 0.05], [R - 0.03, 0.05], [R, 0.085], [R, hs], [R - 0.004, hs + 0.006]], 72);
  const testa = tornio([[R - 0.004, hs + 0.012], [R, hs + 0.02], [R, H - 0.06], [R - 0.02, H - 0.012], [R - 0.07, H], [0, H]], 72);
  return gruppo('accumulo', [
    pezzo([serbatoio], 'smalto'),
    pezzo([testa, tr(cilindro(0.085, 0.07, 40), [-0.11, H + 0.03, 0]), tr(cilindro(0.085, 0.07, 40), [0.11, H + 0.03, 0])], 'plasticaGrigia'),
    pezzo([tr(cilindro(0.07, 0.072, 40), [-0.11, H + 0.031, 0]), tr(cilindro(0.07, 0.072, 40), [0.11, H + 0.031, 0]),
      tr(anello(R + 0.0005, 0.004, 96, 6), [0, hs + 0.009, 0], [PI / 2, 0, 0]),
      tr(cilindro(0.03, 0.05, 20), [-0.19, 0.025, 0.15]), tr(cilindro(0.03, 0.05, 20), [0.19, 0.025, 0.15]), tr(cilindro(0.03, 0.05, 20), [0, 0.025, -0.22])], nera),
    pezzo([tr(new THREE.CylinderGeometry(R + 0.002, R + 0.002, 0.11, 40, 1, true, -0.28, 0.56), [0, hs + 0.25, 0])], 'vetroScuro'),
    pezzo([tr(cilindro(0.016, 0.07, 6), [R + 0.02, 0.3, 0], [0, 0, PI / 2]), tr(cilindro(0.016, 0.07, 6), [R + 0.02, 1.05, 0], [0, 0, PI / 2]), tr(cilindro(0.012, 0.06, 16), [R + 0.02, 0.68, 0], [0, 0, PI / 2])], 'ottone'),
    ombra(1.0, 1.0, 0.6)
  ]);
}

/* --------------------------------------------------------------- boiler */
export function boiler() {
  const R = 0.225, H = 0.86;
  const corpo = tornio([[0, 0.1], [R - 0.07, 0.105], [R - 0.012, 0.14], [R, 0.19], [R, H - 0.08], [R - 0.012, H - 0.03], [R - 0.07, H - 0.004], [0, H]], 72);
  return gruppo('boiler', [
    pezzo([corpo], 'smalto'),
    pezzo([tornio([[0, 0.06], [0.12, 0.06], [0.135, 0.08], [0.135, 0.125], [0, 0.125]], 48)], 'plasticaGrigia'),
    pezzo([tr(cilindro(0.028, 0.012, 32), [0, 0.105, 0.133], [PI / 2, 0, 0]), tr(scatola(0.004, 0.022, 0.006, 0.001, 1), [0, 0.112, 0.141])], nera),
    pezzo([tr(cilindro(0.012, 0.09, 16), [-0.06, 0.03, 0]), tr(cilindro(0.012, 0.09, 16), [0.06, 0.03, 0]), tr(cilindro(0.017, 0.02, 6), [-0.06, 0.055, 0]), tr(cilindro(0.017, 0.02, 6), [0.06, 0.055, 0])], 'ottone'),
    pezzo([tr(scatola(0.3, 0.035, 0.006, 0.002, 1), [0, H - 0.2, -R - 0.002]), tr(scatola(0.3, 0.035, 0.006, 0.002, 1), [0, 0.35, -R - 0.002])], 'zincato'),
    tr2(ombra(0.8, 0.5, 0.3), [0, -0.02, 0])
  ]);
}

/* ------------------------------------------------- duo (doppia tanica) */
export function duo() {
  const W = 0.5, H = 1.02, D = 0.27;
  return gruppo('duo', [
    pezzo([tr(scatola(W, H, D, 0.11, 8), [0, H / 2 + 0.08, 0])], 'smalto'),
    pezzo([tr(cilindro(0.062, 0.006, 48), [0, H * 0.62, D / 2 + 0.001], [PI / 2, 0, 0])], 'vetroScuro'),
    pezzo([tr(anello(0.064, 0.003, 64, 8), [0, H * 0.62, D / 2 + 0.003])], 'cromo'),
    pezzo([tr(scatola(W - 0.25, 0.03, D - 0.1, 0.01), [0, 0.085, 0])], 'plasticaGrigia'),
    pezzo([tr(cilindro(0.012, 0.09, 16), [-0.08, 0.04, 0]), tr(cilindro(0.012, 0.09, 16), [0.08, 0.04, 0]), tr(cilindro(0.017, 0.02, 6), [-0.08, 0.06, 0]), tr(cilindro(0.017, 0.02, 6), [0.08, 0.06, 0])], 'ottone'),
    tr2(ombra(0.9, 0.5, 0.3), [0, -0.02, 0])
  ]);
}

/* ------------------------------------------------------------------ gas */
export function gas() {
  const W = 0.35, H = 0.6, D = 0.19;
  return gruppo('gas', [
    pezzo([tr(scatola(W, H, D, 0.018, 4), [0, H / 2 + 0.1, 0]), tr(cilindro(0.055, 0.09, 40), [0, H + 0.14, -0.01])], 'lamieraChiara'),
    pezzo([tr(scatola(W - 0.07, 0.1, 0.003, 0.012, 2), [0, 0.3, D / 2 + 0.001])], 'vetroScuro'),
    pezzo([tr(cilindro(0.024, 0.018, 32), [-0.08, 0.19, D / 2 + 0.008], [PI / 2, 0, 0]), tr(cilindro(0.024, 0.018, 32), [0.08, 0.19, D / 2 + 0.008], [PI / 2, 0, 0]),
      tr(scatola(W - 0.02, 0.003, 0.003, 0.001, 1), [0, 0.39, D / 2 + 0.0008])], nera),
    pezzo([tr(scatola(0.05, 0.018, 0.004, 0.004, 2), [0, H + 0.0, D / 2 + 0.0012])], 'interno'),
    pezzo([-0.1, 0, 0.1].flatMap((x) => [tr(cilindro(0.011, 0.08, 16), [x, 0.06, 0]), tr(cilindro(0.016, 0.018, 6), [x, 0.085, 0])]), 'ottone'),
    tr2(ombra(0.7, 0.4, 0.3), [0, -0.02, 0])
  ]);
}

/* -------------------------------------------------------- ventilatori */
function testaVentilatore(R = 0.2) {
  const pale = pezzo(ventola({ r0: 0.035, r1: R - 0.025, pale: 5, apertura: 0.8, falce: 0.3, spessoreMozzo: 0.04 }), matCopia('plasticaGrigia', { side: THREE.DoubleSide, color: 0xdfe2e4, roughness: 0.28 }), 'pale');
  const testa = gruppo('testa', [
    pale,
    pezzo([tr(grigliaRaggi({ R, rMozzo: 0.035, raggi: 56, bombatura: 0.07, anelli: 2 }), [0, 0, 0.0]),
      tr(grigliaRaggi({ R, rMozzo: 0.05, raggi: 56, bombatura: 0.05, anelli: 2 }), [0, 0, 0.0], [0, PI, 0]),
      tr(anello(R, 0.006, 96, 8), [0, 0, 0])], 'cromo'),
    pezzo([tr(tornio([[0, -0.19], [0.04, -0.185], [0.062, -0.14], [0.066, -0.06], [0.05, -0.045], [0, -0.045]], 40), [0, 0, 0], [PI / 2, 0, 0])], bianca)
  ], { pale });
  return testa;
}
export function ventolaTerra() {
  const testa = testaVentilatore(0.21);
  testa.position.set(0, 1.12, 0.05);
  testa.rotation.x = -0.12;
  return gruppo('ventola-terra', [
    testa,
    pezzo([tornio([[0, 0], [0.2, 0], [0.21, 0.012], [0.19, 0.026], [0.05, 0.04], [0.03, 0.06], [0, 0.06]], 64), tr(scatola(0.06, 0.1, 0.05, 0.015), [0, 1.0, -0.06])], bianca),
    pezzo([tr(cilindro(0.013, 0.56, 24), [0, 0.33, -0.06]), tr(cilindro(0.0105, 0.5, 24), [0, 0.76, -0.06]), tr(cilindro(0.018, 0.04, 24), [0, 0.6, -0.06])], 'cromo'),
    ombra(0.7, 0.7, 0.55)
  ], { pale: [testa.userData.pale] });
}
export function ventolaParete() {
  const testa = testaVentilatore(0.2);
  testa.position.set(0, 0.42, 0.22);
  testa.rotation.x = 0.18;
  return gruppo('ventola-parete', [
    testa,
    pezzo([tr(scatola(0.13, 0.2, 0.03, 0.012), [0, 0.3, -0.02]), tr(scatola(0.06, 0.07, 0.2, 0.02), [0, 0.38, 0.06], [0.35, 0, 0]), tr(scatola(0.07, 0.09, 0.06, 0.02), [0, 0.42, 0.13])], bianca),
    pezzo([tr(scatola(0.05, 0.02, 0.003, 0.001, 1), [0, 0.24, -0.004])], 'vetroScuro')
  ], { pale: [testa.userData.pale] });
}

/* ------------------------------------------------------ deumidificatore */
export function deumidificatore() {
  const W = 0.35, H = 0.58, D = 0.25;
  return gruppo('deumidificatore', [
    pezzo([tr(scatola(W, H, D, 0.035, 5), [0, H / 2 + 0.035, 0])], bianca),
    pezzo([tr(scatola(W - 0.07, 0.004, D - 0.1, 0.01, 2), [0, H + 0.0345, -0.01]),
      tr(feritoie(W - 0.09, 0.12, 9, 0.006, 0.5), [0, H - 0.1, D / 2 + 0.001]),
      tr(scatola(W - 0.03, 0.003, 0.003, 0.001, 1), [0, 0.3, D / 2 + 0.0008]),
      tr(feritoie(W - 0.1, 0.2, 14, 0.006, -0.5), [0, 0.38, -D / 2 - 0.001], [0, PI, 0])], nera),
    pezzo([tr(scatola(W - 0.06, 0.2, 0.004, 0.02, 2), [0, 0.165, D / 2 + 0.001])], matCopia('plasticaGrigia', { color: 0x9eb0bd, roughness: 0.12, clearcoat: 1 })),
    pezzo([tr(scatola(0.012, 0.11, 0.002, 0.004, 1), [W / 2 - 0.07, 0.165, D / 2 + 0.0035])], 'vetroScuro'),
    pezzo([[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => tr(cilindro(0.02, 0.018, 20), [a * (W / 2 - 0.05), 0.02, b * (D / 2 - 0.04)], [0, 0, PI / 2])), 'gomma'),
    ombra(0.7, 0.55, 0.55)
  ]);
}

/* ------------------------------------------------------------ portatile */
export function portatile() {
  const W = 0.45, H = 0.72, D = 0.37;
  return gruppo('portatile', [
    pezzo([tr(scatola(W, H, D, 0.05, 6), [0, H / 2 + 0.04, 0])], bianca),
    pezzo([tr(scatola(W - 0.1, 0.004, 0.12, 0.01, 2), [0, H + 0.0395, 0.06]),
      tr(scatola(W - 0.03, 0.003, 0.003, 0.001, 1), [0, 0.52, D / 2 + 0.0008]),
      tr(feritoie(D - 0.14, 0.34, 20, 0.006, -0.5), [W / 2 + 0.001, 0.4, 0], [0, PI / 2, 0]),
      tr(feritoie(D - 0.14, 0.34, 20, 0.006, -0.5), [-W / 2 - 0.001, 0.4, 0], [0, -PI / 2, 0])], nera),
    pezzo([tr(scatola(W - 0.11, 0.006, 0.11, 0.004, 2), [0, H + 0.062, 0.03], [-0.4, 0, 0])], bianca),
    pezzo([tr(scatola(0.13, 0.035, 0.003, 0.004, 2), [0, H - 0.08, D / 2 + 0.001])], 'vetroScuro'),
    pezzo([tr(cilindro(0.075, 0.07, 40), [0, 0.52, -D / 2 - 0.03], [PI / 2, 0, 0])], 'plasticaGrigia'),
    pezzo([[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => tr(cilindro(0.024, 0.02, 20), [a * (W / 2 - 0.07), 0.024, b * (D / 2 - 0.06)], [0, 0, PI / 2])), 'gomma'),
    ombra(0.85, 0.75, 0.55)
  ]);
}
