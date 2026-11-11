/* ==========================================================================
   GRIP — attrezzi per costruire i pezzi in codice.
   Ogni funzione restituisce una geometria già posizionata, così un pezzo è
   una lista di geometrie fuse per materiale: poche chiamate di disegno.
   Unità: metri. Asse Y verso l'alto, il fronte dei pezzi guarda +Z.
   ========================================================================== */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat } from '../materiali.js';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();

/** Sposta/ruota/scala una geometria e la restituisce. rot = [rx, ry, rz]. */
export function tr(g, pos = [0, 0, 0], rot = [0, 0, 0], sc = 1) {
  const s = Array.isArray(sc) ? sc : [sc, sc, sc];
  _q.setFromEuler(_e.set(rot[0], rot[1], rot[2]));
  _m.compose(new THREE.Vector3(...pos), _q, new THREE.Vector3(...s));
  g.applyMatrix4(_m);
  return g;
}

/** Fonde più geometrie in una sola (stesso materiale). */
export function fondi(lista) {
  const pulite = lista.filter(Boolean).map((g) => {
    const n = g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k);
    if (!n.attributes.uv) n.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2));
    if (!n.attributes.normal) n.computeVertexNormals();
    return n;
  });
  const out = mergeGeometries(pulite, false);
  out.computeBoundingSphere();
  return out;
}

/** Mesh da una lista di geometrie e dal nome di un materiale condiviso. */
export function pezzo(lista, materiale, nome = '') {
  const m = new THREE.Mesh(Array.isArray(lista) ? fondi(lista) : lista, typeof materiale === 'string' ? mat(materiale) : materiale);
  m.name = nome;
  m.castShadow = m.receiveShadow = true;
  return m;
}

export const scatola = (w, h, d, r = 0.006, seg = 3) =>
  new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4));

export const cilindro = (r, h, seg = 32, rAlto = r) => new THREE.CylinderGeometry(rAlto, r, h, seg);

export const anello = (R, r, seg = 64, tub = 10) => new THREE.TorusGeometry(R, r, tub, seg);

/** Rettangolo con angoli raccordati come THREE.Shape (o Path, per i fori). */
export function sagomaRett(w, h, r, Classe = THREE.Shape, cx = 0, cy = 0) {
  const s = new Classe();
  const x = cx - w / 2, y = cy - h / 2;
  r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

/**
 * Lastra di lamiera: rettangolo raccordato nel piano XY, spessore lungo Z,
 * con smusso sul bordo (è lo smusso a prendere la luce come una piega vera).
 * fori = [{ tipo: 'cerchio', x, y, r } | { tipo: 'rett', x, y, w, h, r }]
 */
export function lastra(w, h, sp = 0.012, r = 0.02, fori = [], smusso = 0.003) {
  const s = sagomaRett(w, h, r);
  for (const f of fori) {
    if (f.tipo === 'cerchio') { const p = new THREE.Path(); p.absarc(f.x, f.y, f.r, 0, Math.PI * 2, true); s.holes.push(p); }
    else s.holes.push(sagomaRett(f.w, f.h, f.r ?? 0.004, THREE.Path, f.x, f.y));
  }
  const g = new THREE.ExtrudeGeometry(s, {
    depth: Math.max(sp - smusso * 2, 0.0005), bevelEnabled: true, bevelThickness: smusso, bevelSize: smusso,
    bevelSegments: 3, curveSegments: 40
  });
  g.translate(0, 0, -sp / 2 + smusso);
  return g;
}

/** Solido di rivoluzione da un profilo [[r, y], ...] attorno all'asse Y. */
export function tornio(profilo, seg = 48) {
  // il profilo deve salire (dal basso verso l'alto) perché le facce guardino fuori
  const p = profilo[0][1] > profilo[profilo.length - 1][1] ? [...profilo].reverse() : profilo;
  return new THREE.LatheGeometry(p.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0001), y)), seg);
}

/** Percorso a tratti dritti con curve raccordate (per i tubi). */
export function percorso(punti, raggio = 0.05) {
  const v = punti.map((p) => (p.isVector3 ? p.clone() : new THREE.Vector3(...p)));
  const path = new THREE.CurvePath();
  const linea = (a, b) => { if (a.distanceTo(b) > 1e-4) path.add(new THREE.LineCurve3(a.clone(), b.clone())); };
  let prev = v[0];
  for (let i = 1; i < v.length - 1; i++) {
    const d1 = v[i].clone().sub(v[i - 1]), d2 = v[i + 1].clone().sub(v[i]);
    const r = Math.min(raggio, d1.length() * 0.48, d2.length() * 0.48);
    const p1 = v[i].clone().sub(d1.normalize().multiplyScalar(r));
    const p2 = v[i].clone().add(d2.normalize().multiplyScalar(r));
    linea(prev, p1);
    path.add(new THREE.QuadraticBezierCurve3(p1, v[i].clone(), p2));
    prev = p2;
  }
  linea(prev, v[v.length - 1]);
  return path;
}

/** Tubo lungo un percorso. Restituisce la geometria; la curva resta in userData. */
export function tubo(punti, r = 0.008, raggioCurva = 0.05, radiali = 8, passo = 0.02) {
  const curva = punti.isCurve || punti.getPoint ? punti : percorso(punti, raggioCurva);
  const seg = Math.max(8, Math.ceil(curva.getLength() / passo));
  const g = new THREE.TubeGeometry(curva, seg, r, radiali, false);
  g.userData.curva = curva;
  g.userData.seg = seg;
  g.userData.radiali = radiali;
  return g;
}

/**
 * Ventola assiale: mozzo + pale sagomate e svergolate (passo più ripido al
 * mozzo, più piatto in punta, bordo d'attacco a falce). Asse di rotazione Z.
 */
export function ventola({ r0 = 0.05, r1 = 0.2, pale = 3, apertura = 0.95, falce = 0.45, spessoreMozzo = 0.06 } = {}) {
  const lista = [];
  for (let k = 0; k < pale; k++) {
    const g = new THREE.PlaneGeometry(1, 1, 14, 8);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) + 0.5, v = p.getY(i);
      const r = r0 * 0.9 + (r1 - r0 * 0.9) * u;
      let w = apertura * (0.5 + 0.6 * u);
      if (u > 0.82) w *= Math.cos(((u - 0.82) / 0.18) * Math.PI * 0.42);
      const th = v * w + falce * u * u + (k / pale) * Math.PI * 2;
      const passo = THREE.MathUtils.lerp(0.78, 0.3, u);
      const z = v * w * r * Math.tan(passo) + (1 - 4 * v * v) * 0.012 * (r1 / 0.2);
      p.setXYZ(i, r * Math.cos(th), r * Math.sin(th), z);
    }
    g.computeVertexNormals();
    lista.push(g);
  }
  const mozzo = tornio([[0, spessoreMozzo * 0.62], [r0 * 0.55, spessoreMozzo * 0.58], [r0 * 0.95, spessoreMozzo * 0.36], [r0, 0], [r0, -spessoreMozzo * 0.5], [0, -spessoreMozzo * 0.5]], 40);
  lista.push(tr(mozzo, [0, 0, 0], [Math.PI / 2, 0, 0]));
  return fondi(lista);
}

/** Griglia di protezione a raggi sottili e curvi, con anelli di tenuta. Nel piano XY. */
export function grigliaRaggi({ R = 0.3, rMozzo = 0.05, raggi = 44, filo = 0.0016, bombatura = 0.03, anelli = 3 } = {}) {
  const lista = [];
  const cupola = (r) => bombatura * (1 - (r / R) * (r / R));
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10, r = rMozzo + (R - rMozzo) * t, a = t * 0.55;
    pts.push(new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), cupola(r)));
  }
  const base = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, filo, 5, false);
  for (let k = 0; k < raggi; k++) lista.push(tr(base.clone(), [0, 0, 0], [0, 0, (k / raggi) * Math.PI * 2]));
  for (let j = 1; j <= anelli; j++) {
    const r = rMozzo + ((R - rMozzo) * j) / anelli;
    lista.push(tr(anello(r, filo * 1.5, 72, 6), [0, 0, cupola(r)]));
  }
  lista.push(tr(cilindro(rMozzo * 1.05, 0.008, 36), [0, 0, cupola(0) + 0.002], [Math.PI / 2, 0, 0]));
  return fondi(lista);
}

/** Feritoie: n lamelle inclinate dentro un riquadro w×h (nel piano XY). */
export function feritoie(w, h, n, prof = 0.01, inclinazione = 0.5) {
  const lista = [];
  const passo = h / n;
  for (let i = 0; i < n; i++) lista.push(tr(scatola(w, passo * 0.55, prof, 0.0015, 1), [0, -h / 2 + passo * (i + 0.5), 0], [inclinazione, 0, 0]));
  return fondi(lista);
}

/** Gruppo con dati utili al resto del sito (ingombro e punto da guardare). */
export function gruppo(nome, figli, info = {}) {
  const g = new THREE.Group();
  g.name = nome;
  for (const f of figli) if (f) g.add(f);
  g.userData = { forma: nome, ...info };
  return g;
}

export { THREE };
