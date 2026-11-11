/* ==========================================================================
   GRIP — SCENA 4: IL MONTAGGIO (la scena più importante).
   Su un piano da disegno tecnico l'impianto si compone pezzo per pezzo:
   unità esterna, accumulatore, split e cassetta (HTW · Giatsu), poi
   radiatore, scaldasalviette e doccia (Ercos). I tubi si disegnano da soli
   (rame per il circuito, multistrato bianco per l'acqua) e quando un tratto
   è collegato il filo ci scorre dentro e il pezzo si accende.
   Alla fine la camera fa un giro completo; si può ruotare e cliccare i pezzi.
   Schema indicativo: non è un progetto.
   ========================================================================== */
import * as THREE from 'three';
import { crea } from './parts/indice.js';
import { radiatore, scaldasalviette, materialeCaldo } from './parts/bagno.js';
import { percorso } from './parts/util.js';
import { mat, macchia } from './materiali.js';
import { tuboFilo, sciame, coloreFilo, SOMMA } from './filo.js';

const lerp = THREE.MathUtils.lerp, clamp = THREE.MathUtils.clamp, ss = THREE.MathUtils.smoothstep;
const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const fuori3 = (t) => 1 - Math.pow(1 - t, 3);
const GRADI = Math.PI / 180;

/* I pezzi: dove si posano, da dove arrivano, cosa aprono nel catalogo. */
const PEZZI = [
  { forma: 'esterna', pos: [-2.65, 0, 0.75], ry: 0.42, vista: [-2.6, 0.5, 0.7, 3.3], clic: 'catalogo.html?vetrina=esterna', orma: [1.3, 0.6] },
  { forma: 'accumulo', pos: [-1.2, 0, -0.55], ry: 0, vista: [-1.25, 0.9, -0.5, 3.7], clic: 'catalogo.html?vetrina=accumulo', orma: [0.7, 0.7] },
  { forma: 'split', pos: [0.25, 1.62, -1.3], ry: 0, vista: [0.2, 1.5, -1.1, 3.3], clic: 'catalogo.html?vetrina=split', orma: [0.95, 0.24] },
  { forma: 'cassetta', pos: [1.35, 2.38, 0.3], ry: 0, vista: [1.3, 1.9, 0.2, 4.0], clic: 'catalogo.html?vetrina=cassetta', orma: [0.84, 0.84] },
  { forma: 'radiatore', pos: [2.3, 0, -1.2], ry: 0, vista: [2.3, 0.5, -1.1, 2.9], clic: 'catalogo.html#ercos-caldo', orma: [0.75, 0.2] },
  { forma: 'scaldasalviette', pos: [3.3, 0, -1.2], ry: 0, vista: [3.3, 0.85, -1.1, 3.1], clic: 'catalogo.html#ercos-caldo', orma: [0.56, 0.14] },
  { forma: 'doccia', pos: [4.55, 0, 0.3], ry: 0, vista: [4.5, 1.15, 0.1, 4.2], clic: 'catalogo.html#ercos-bagno', orma: [1.2, 0.8] }
];
const INIZIO = 0.05, PASSO = 0.095, DURATA = 0.085;

/* I tubi: tipo, pezzo a cui arrivano, percorso (pavimento a y = 0.06, poi le salite). */
const TUBI = [
  { tipo: 'acqua', a: 1, punti: [[-2.25, 0.06, 0.3], [-2.25, 0.06, -1.0], [-0.82, 0.06, -1.0], [-0.82, 0.06, -0.55], [-0.82, 0.3, -0.55], [-0.9, 0.3, -0.55]] },
  { tipo: 'rame', a: 2, punti: [[-2.1, 0.06, 0.4], [-2.1, 0.06, -1.27], [0.25, 0.06, -1.27], [0.25, 1.6, -1.27]] },
  { tipo: 'rame', a: 3, punti: [[-1.98, 0.06, 0.45], [-1.98, 0.06, -1.17], [1.02, 0.06, -1.17], [1.02, 2.5, -1.17], [1.02, 2.5, 0.2], [1.06, 2.5, 0.3]] },
  { tipo: 'acqua', a: 4, punti: [[-0.7, 0.06, -0.72], [-0.7, 0.06, -1.07], [1.984, 0.06, -1.07], [1.984, 0.06, -1.2], [1.984, 0.1, -1.2]] },
  { tipo: 'acqua', a: 5, punti: [[2.616, 0.06, -1.2], [2.616, 0.06, -1.02], [3.067, 0.06, -1.02], [3.067, 0.06, -1.23], [3.067, 0.15, -1.23]] },
  { tipo: 'acqua', a: 6, punti: [[3.533, 0.15, -1.23], [3.533, 0.06, -1.23], [3.533, 0.06, -1.02], [4.55, 0.06, -1.02], [4.55, 0.06, -0.09], [4.55, 1.06, -0.09]] }
];

const LINEE_VERT = /* glsl */ `
attribute float aT; uniform float uProg; varying float vVis;
void main(){ vVis = smoothstep(0.0, 0.012, uProg - aT); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const LINEE_FRAG = /* glsl */ `
uniform vec3 uCol; uniform float uForza; varying float vVis;
void main(){ if (vVis < 0.01) discard; gl_FragColor = vec4(uCol * uForza * vVis, 1.0); }`;

const GRIGLIA_VERT = /* glsl */ `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const GRIGLIA_FRAG = /* glsl */ `
uniform vec3 uCol, uCentro; uniform float uApri;
varying vec3 vW;
float linea(vec2 p, float passo, float sp){ vec2 g = abs(fract(p / passo - 0.5) - 0.5) / fwidth(p / passo); return 1.0 - min(min(g.x, g.y) / sp, 1.0); }
void main(){
  float d = length(vW.xz - uCentro.xz);
  float sfuma = smoothstep(uApri * 9.5, uApri * 9.5 - 3.2, d);
  float l = linea(vW.xz, 0.25, 1.0) * 0.16 + linea(vW.xz, 1.0, 1.3) * 0.42;
  gl_FragColor = vec4(uCol * l * sfuma, 1.0);
}`;

export function creaMontaggio(ctx) {
  const scene = new THREE.Scene();
  scene.environment = ctx.ambienti.scuro;
  scene.environmentIntensity = 0.75;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
  const chiave = new THREE.DirectionalLight(0xffffff, 1.15); chiave.position.set(-3, 6, 5); scene.add(chiave);
  const contro = new THREE.DirectionalLight(0x9fd0ff, 0.9); contro.position.set(5, 3, -5); scene.add(contro);
  const mondo = new THREE.Group(); scene.add(mondo);            // tutto l'impianto: si può ruotare
  const PERNO = new THREE.Vector3(1.0, 0, -0.3);

  /* ---------- piano da disegno ---------- */
  const griglia = new THREE.Mesh(new THREE.PlaneGeometry(26, 18), new THREE.ShaderMaterial({
    vertexShader: GRIGLIA_VERT, fragmentShader: GRIGLIA_FRAG, transparent: true, depthWrite: false, ...SOMMA,
    uniforms: { uCol: { value: new THREE.Color(0x8fd3ff) }, uCentro: { value: PERNO.clone() }, uApri: { value: 0 } }
  }));
  griglia.rotation.x = -Math.PI / 2; griglia.position.set(1, 0, 0); griglia.renderOrder = -2;
  mondo.add(griglia);

  /* ---------- linee da tavola tecnica: sedi dei pezzi, parete, quote ---------- */
  const pos = [], tempi = [];
  const segmento = (a, b, t0, t1 = t0 + 0.02) => { pos.push(...a, ...b); tempi.push(t0, t1); };
  const rett = (cx, cz, w, d, y, t) => {
    const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
    segmento([x0, y, z0], [x1, y, z0], t); segmento([x1, y, z0], [x1, y, z1], t + 0.008); segmento([x1, y, z1], [x0, y, z1], t + 0.016); segmento([x0, y, z1], [x0, y, z0], t + 0.024);
    for (const [sx, sz] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) {       // crocini agli angoli
      segmento([sx - 0.07, y, sz], [sx + 0.07, y, sz], t + 0.03); segmento([sx, y, sz - 0.07], [sx, y, sz + 0.07], t + 0.03);
    }
  };
  PEZZI.forEach((p, i) => {
    const t = INIZIO + i * PASSO - 0.035;
    rett(p.pos[0], p.pos[2] + (p.pos[1] > 0.5 && i !== 3 ? 0.1 : 0), p.orma[0], p.orma[1], 0.012, t);
    if (p.pos[1] > 0.5) segmento([p.pos[0], 0.012, p.pos[2] + (i === 3 ? 0 : 0.1)], [p.pos[0], p.pos[1] - 0.02, p.pos[2] + (i === 3 ? 0 : 0.1)], t + 0.02, t + 0.05);
  });
  /* la parete a cui si appendono split, radiatore e scaldasalviette */
  const tP = INIZIO + 2 * PASSO - 0.06;
  segmento([-0.5, 0.012, -1.33], [4.0, 0.012, -1.33], tP, tP + 0.04); segmento([-0.5, 0.012, -1.33], [-0.5, 2.6, -1.33], tP + 0.01, tP + 0.04);
  segmento([-0.5, 2.6, -1.33], [4.0, 2.6, -1.33], tP + 0.03, tP + 0.07); segmento([4.0, 2.6, -1.33], [4.0, 0.012, -1.33], tP + 0.06, tP + 0.09);
  /* linea di quota davanti, con una tacca per ogni pezzo */
  segmento([-3.4, 0.012, 1.9], [5.3, 0.012, 1.9], 0.02, 0.7);
  PEZZI.forEach((p, i) => segmento([p.pos[0], 0.012, 1.8], [p.pos[0], 0.012, 2.0], INIZIO + i * PASSO + DURATA));
  const gLinee = new THREE.BufferGeometry();
  gLinee.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  gLinee.setAttribute('aT', new THREE.Float32BufferAttribute(tempi, 1));
  const linee = new THREE.LineSegments(gLinee, new THREE.ShaderMaterial({
    vertexShader: LINEE_VERT, fragmentShader: LINEE_FRAG, transparent: true, depthWrite: false, ...SOMMA,
    uniforms: { uProg: { value: 0 }, uCol: { value: new THREE.Color(0x8fd3ff) }, uForza: { value: 0.75 } }
  }));
  linee.frustumCulled = false;
  mondo.add(linee);

  /* ---------- i pezzi ---------- */
  const matRad = materialeCaldo('bianco'), matScalda = materialeCaldo('bianco');
  const pezzi = PEZZI.map((p, i) => {
    let ogg;
    if (p.forma === 'radiatore') ogg = radiatore({ materiale: matRad });
    else if (p.forma === 'scaldasalviette') ogg = scaldasalviette({ materiale: matScalda });
    else ogg = crea(p.forma, p.forma === 'esterna' ? { dettaglio: ctx.mobile ? 0 : 1 } : {});
    const g = new THREE.Group();
    if (p.forma === 'cassetta') { ogg.rotation.x = Math.PI / 2; ogg.position.set(0, 0, -0.42); }
    g.add(ogg);
    g.position.set(...p.pos); g.rotation.y = p.ry;
    g.visible = false;
    g.userData.clic = p.clic; g.userData.indice = i;
    const alone = new THREE.Sprite(new THREE.SpriteMaterial({ map: macchia(), color: 0xfdce06, transparent: true, opacity: 0, depthWrite: false, depthTest: false, ...SOMMA, blendSrc: THREE.SrcAlphaFactor }));
    alone.scale.setScalar(1.7); alone.position.set(0, p.forma === 'cassetta' || p.forma === 'split' ? 0.1 : 0.6, 0.1); alone.renderOrder = 4;
    g.add(alone);
    mondo.add(g);
    return { ...p, i, g, ogg, alone, casa: new THREE.Vector3(...p.pos), posato: false, acceso: 0 };
  });
  const boxR = pezzi[4].ogg.userData.box, boxS = pezzi[5].ogg.userData.box;
  matRad.userData.u.uBox.value.set(boxR[0], boxR[1], PEZZI[4].pos[0] + boxR[2], boxR[3]);
  matScalda.userData.u.uBox.value.set(boxS[0], boxS[1], PEZZI[5].pos[0] + boxS[2], boxS[3]);
  const pietra = pezzi[6].ogg.userData.pietra;
  pietra.userData.u.uCentro.value.set(PEZZI[6].pos[0], 0, PEZZI[6].pos[2]);
  const pioggia = sciame(260, { da: [4.55, 2.04, 0.3], a: [4.55, 0.05, 0.3], largo: [0.24, 0.02, 0.24], scala: 2.4, vel: 0.9, ondeggia: 0.002, forza: 0.55 });
  pioggia.visible = false; mondo.add(pioggia);

  /* ---------- i tubi ---------- */
  const tubi = TUBI.map((t) => {
    const curva = percorso(t.punti, 0.07);
    const r = t.tipo === 'rame' ? 0.011 : 0.014;
    const seg = Math.ceil(curva.getLength() / 0.035), rad = 8;
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curva, seg, r, rad, false), mat(t.tipo === 'rame' ? 'rame' : 'multistrato'));
    mesh.geometry.setDrawRange(0, 0);
    const filo = tuboFilo(curva, r + 0.007, { onde: curva.getLength() * 1.6, base: 0.3, forza: 1.25, passo: 0.05 });
    filo.userData.u.uTesta.value = 0; filo.visible = false;
    /* raccordi alle estremità e staffe lungo il percorso */
    const ferri = new THREE.Group();
    const racc = new THREE.CylinderGeometry(r * 1.55, r * 1.55, 0.04, 6);
    for (const u of [0.004, 0.996]) {
      const m = new THREE.Mesh(racc, mat('ottone')); const tan = curva.getTangentAt(u);
      m.position.copy(curva.getPointAt(u)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan); m.userData.u = u; ferri.add(m);
    }
    const nStaffe = Math.floor(curva.getLength() / 0.7);
    const staffa = new THREE.BoxGeometry(0.012, r * 2.6, r * 3.4);
    for (let k = 1; k <= nStaffe; k++) {
      const u = k / (nStaffe + 1), m = new THREE.Mesh(staffa, mat('zincato')); const tan = curva.getTangentAt(u);
      m.position.copy(curva.getPointAt(u)); m.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), tan); m.userData.u = u; m.visible = false; ferri.add(m);
    }
    ferri.children.forEach((m) => { m.visible = false; });
    mondo.add(mesh, filo, ferri);
    return { ...t, curva, mesh, filo, ferri, tot: seg * rad * 6, inizio: INIZIO + t.a * PASSO + 0.062, flusso: 0 };
  });

  /* ---------- stagione: riscaldamento / raffrescamento ---------- */
  const stagione = { modo: 'caldo', k: 1 };          // k: 1 = caldo, 0 = freddo
  window.addEventListener('grip:stagione', (e) => {
    stagione.modo = e.detail;
    const a = e.detail === 'caldo' ? 1 : 0;
    if (window.gsap && !ctx.fermo) window.gsap.to(stagione, { k: a, duration: 1.1, ease: 'expo.inOut', onUpdate: () => { ctx.palco.sporco = true; } });
    else { stagione.k = a; ctx.palco.sporco = true; }
  });

  /* ---------- trascinare per ruotare, cliccare un pezzo ---------- */
  const presa = document.getElementById('impianto-presa');
  const passi = [...document.querySelectorAll('#impianto-passi li')];
  const raggio = new THREE.Raycaster(), punta = new THREE.Vector2();
  let giroUtente = 0, giroV = 0, giu = false, mosso = 0, ultimoX = 0;
  function colpito(e) {
    const r = presa.getBoundingClientRect();
    if (e.clientY < r.top || e.clientY > r.bottom) return null;
    punta.set((e.clientX / ctx.w) * 2 - 1, -(e.clientY / ctx.h) * 2 + 1);
    raggio.setFromCamera(punta, camera);
    const hit = raggio.intersectObjects(pezzi.filter((p) => p.posato).map((p) => p.g), true)[0];
    if (!hit) return null;
    let o = hit.object; while (o && !o.userData.clic) o = o.parent;
    return o;
  }
  if (presa) {
    presa.addEventListener('pointerdown', (e) => { giu = true; mosso = 0; ultimoX = e.clientX; giroV = 0; presa.setPointerCapture?.(e.pointerId); });
    presa.addEventListener('pointermove', (e) => {
      if (giu) { const dx = e.clientX - ultimoX; ultimoX = e.clientX; mosso += Math.abs(dx); giroUtente += dx * 0.006; giroV = dx * 0.006 * 60; ctx.palco.sporco = true; }
      else presa.classList.toggle('mano', !!colpito(e));
    });
    presa.addEventListener('pointerup', (e) => {
      giu = false;
      if (mosso < 6) { const o = colpito(e); if (o) window.location.href = o.userData.clic; }
    });
    presa.addEventListener('pointercancel', () => { giu = false; });
  }

  /* ---------- stato ---------- */
  let ps = 0, primo = true, ultimoPasso = -2;
  const bersaglio = new THREE.Vector3(), posCam = new THREE.Vector3(), tmp = new THREE.Vector3(), colA = new THREE.Color(), colB = new THREE.Color();
  const fuoco = { distanza: 3.5, apertura: 0.05 };

  function aggiorna(av, t, dt) {
    const p = av[0].pin;
    const k = primo || av.subito || ctx.fermo ? 1 : Math.min(1, dt * 5.5);
    primo = false;
    ps = lerp(ps, p, k);

    griglia.material.uniforms.uApri.value = fuori3(clamp(ps / 0.07 + 0.25, 0, 1)) * (1 + ss(ps, 0.74, 0.84) * 0.5);
    linee.material.uniforms.uProg.value = ps;

    /* ---------- i pezzi arrivano e si assestano ---------- */
    let corrente = -1;
    for (const pz of pezzi) {
      const a = INIZIO + pz.i * PASSO;
      const tt = clamp((ps - a) / DURATA, 0, 1);
      pz.g.visible = tt > 0;
      pz.posato = tt >= 1;
      if (tt > 0 && tt < 1) corrente = pz.i; else if (tt >= 1) corrente = Math.max(corrente, pz.i);
      /* discesa precisa, poi l'assestamento netto degli ultimi centimetri: nessun rimbalzo */
      const kk = tt < 0.84 ? 0.965 * fuori3(tt / 0.84) : 0.965 + 0.035 * (1 - Math.pow(2, -12 * ((tt - 0.84) / 0.16)));
      const resto = 1 - Math.min(1, kk);
      pz.g.position.set(pz.casa.x + resto * resto * 0.5, pz.casa.y + resto * 2.7, pz.casa.z + resto * resto * 0.6);
      pz.g.rotation.y = pz.ry + resto * 0.5;
    }
    if (corrente !== ultimoPasso) {
      ultimoPasso = corrente;
      passi.forEach((li, i) => { li.classList.toggle('posato', i <= corrente); li.classList.toggle('ultimo', i === corrente); });
    }

    /* ---------- i tubi si disegnano, poi il filo ci scorre dentro ---------- */
    coloreFilo(lerp(0.0, 0.55, stagione.k), colA); coloreFilo(lerp(0.12, 1.0, stagione.k), colB);
    const verso = stagione.k > 0.5 ? 1 : -1;
    const accesi = new Array(pezzi.length).fill(0);
    accesi[0] = ss(ps, INIZIO + PASSO + 0.06, INIZIO + PASSO + 0.1);
    for (const tb of tubi) {
      const disegno = clamp((ps - tb.inizio) / 0.06, 0, 1);
      const flusso = clamp((ps - tb.inizio - 0.06) / 0.035, 0, 1);
      tb.mesh.visible = disegno > 0;
      tb.mesh.geometry.setDrawRange(0, Math.floor((disegno * tb.tot) / 48) * 48);
      for (const f of tb.ferri.children) f.visible = disegno >= f.userData.u;
      const u = tb.filo.userData.u;
      tb.filo.visible = flusso > 0;
      u.uTesta.value = flusso; u.uTempo.value = t * 0.55; u.uVerso.value = verso;
      u.uColA.value.copy(colA); u.uColB.value.copy(colB);
      accesi[tb.a] = Math.max(accesi[tb.a], flusso);
    }
    for (const pz of pezzi) {
      const a = accesi[pz.i];
      const lampo = a > 0 && a < 1 ? Math.sin(a * Math.PI) : 0;
      pz.alone.material.opacity = lampo * 0.5 + a * 0.07;
      pz.alone.visible = pz.alone.material.opacity > 0.004;
      pz.alone.material.color.copy(colB);
    }
    /* il calore sale nel radiatore e nello scaldasalviette (solo in riscaldamento); la doccia piove */
    const cRad = ss(ps, tubi[3].inizio + 0.09, tubi[3].inizio + 0.2) * stagione.k;
    const cSca = ss(ps, tubi[4].inizio + 0.09, tubi[4].inizio + 0.2) * stagione.k;
    matRad.userData.u.uCaldo.value = cRad; matScalda.userData.u.uCaldo.value = cSca;
    const acqua = accesi[6];
    pioggia.visible = acqua > 0.99;
    if (pioggia.visible) {
      pioggia.userData.u.uTempo.value = t; pioggia.userData.u.uColA.value.copy(colB); pioggia.userData.u.uColB.value.copy(colB);
      pioggia.geometry.setDrawRange(0, Math.round(260 * ctx.q.particelle));
    }
    pietra.userData.u.uBagnato.value = ss(ps, tubi[5].inizio + 0.1, tubi[5].inizio + 0.22) * 0.75;
    if (!ctx.fermo) { const pale = pezzi[0].ogg.userData.pale; if (pale && accesi[0] > 0) pale.rotation.z -= dt * 7 * accesi[0]; }

    /* ---------- la camera: vicina al pezzo che arriva, poi il giro completo ---------- */
    const mob = ctx.mobile;
    /* la camera resta sul pezzo che sta arrivando e passa al successivo solo quando si è posato */
    const f = clamp((ps - INIZIO) / PASSO, 0, pezzi.length - 1);
    const i0 = Math.floor(f), i1 = Math.min(pezzi.length - 1, i0 + 1), ff = inOut(clamp((f - i0 - 0.72) / 0.28, 0, 1));
    const v0 = pezzi[i0].vista, v1 = pezzi[i1].vista;
    bersaglio.set(lerp(v0[0], v1[0], ff), lerp(v0[1], v1[1], ff), lerp(v0[2], v1[2], ff));
    let dist = lerp(v0[3], v1[3], ff) * (mob ? 1.55 : 1);
    let az = lerp(-24, 22, clamp(f / (pezzi.length - 1), 0, 1)) * GRADI, el = 19 * GRADI;
    const largo = inOut(clamp((ps - 0.745) / 0.085, 0, 1));
    if (largo > 0) {
      bersaglio.lerp(tmp.set(PERNO.x, 0.95, PERNO.z), largo);
      dist = lerp(dist, 11 * Math.max(1, 1.7 / (ctx.w / ctx.h)), largo);
      el = lerp(el, 21 * GRADI, largo);
      az += inOut(clamp((ps - 0.8) / 0.2, 0, 1)) * Math.PI * 2;      // il giro completo
    }
    if (!giu && !ctx.fermo) { giroUtente += giroV * dt; giroV *= Math.pow(0.03, dt); }
    mondo.rotation.y = giroUtente;
    mondo.position.set(0, 0, 0);
    /* si ruota attorno al centro dell'impianto */
    tmp.copy(PERNO).applyAxisAngle(new THREE.Vector3(0, 1, 0), giroUtente);
    mondo.position.set(PERNO.x - tmp.x, 0, PERNO.z - tmp.z);
    posCam.set(bersaglio.x + dist * Math.sin(az) * Math.cos(el), bersaglio.y + dist * Math.sin(el), bersaglio.z + dist * Math.cos(az) * Math.cos(el));
    camera.position.copy(posCam);
    camera.lookAt(bersaglio);
    ctx.sposta(camera, mob ? 0 : lerp(0.08, 0, largo), mob ? -0.04 : lerp(0.02, -0.03, largo));
    fuoco.distanza = dist; fuoco.apertura = lerp(0.05, 0.012, largo);
    griglia.material.uniforms.uCentro.value.copy(bersaglio).lerp(PERNO, largo);
  }

  return { scene, camera, fuoco, aggiorna, oggetti: { pezzi, tubi } };
}
