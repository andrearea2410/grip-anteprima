/* ==========================================================================
   GRIP — SCENA 5: ERCOS, IL CALORE CHE SI TOCCA.
   Cambia linguaggio (luce calda e morbida, fondo carta) ma è lo stesso film:
   tre primi piani legati allo scorrimento, con la camera che passa dall'uno
   all'altro senza stacchi.
     I   il miscelatore cromato, con la goccia che si forma e cade;
     II  la doccia: pioggia calda dal soffione sul piatto effetto pietra,
         che si scurisce dove arriva l'acqua;
     III scaldasalviette e radiatore: il calore sale tubo per tubo.
   Le finiture sono illustrative (lo dice anche la pagina).
   ========================================================================== */
import * as THREE from 'three';
import { miscelatore, lavabo, doccia, piattoDoccia, scaldasalviette, radiatore, materialeCaldo, materialePietra, applicaFinitura } from './parts/bagno.js';
import { pezzo, lastra, tr, anello, scatola } from './parts/util.js';
import { mat, matCopia, ombra, macchia } from './materiali.js';
import { coloreFilo } from './filo.js';

const lerp = THREE.MathUtils.lerp, clamp = THREE.MathUtils.clamp, ss = THREE.MathUtils.smoothstep;
const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const GRADI = Math.PI / 180;

/* Regia: posizioni della camera lungo lo scorrimento (bersaglio, distanza, angoli, spostamento laterale). */
const REGIA = [
  { p: 0.0,  b: [0, 0.1, 0.1],     d: 0.66, az: 44,  el: 15,  sx: 0.15 },
  { p: 0.29, b: [0, 0.085, 0.13],  d: 0.5,  az: 22,  el: 9,   sx: 0.15 },
  { p: 0.41, b: [4, 1.93, 0],      d: 1.3,  az: -22, el: -13, sx: -0.14 },
  { p: 0.52, b: [4, 1.05, 0],      d: 2.5,  az: -8,  el: 8,   sx: -0.14 },
  { p: 0.63, b: [4.05, 0.06, 0.05], d: 1.55, az: 12, el: 36,  sx: -0.12 },
  { p: 0.75, b: [7.78, 0.98, 0],   d: 1.3,  az: -30, el: 5,   sx: 0.16 },
  { p: 1.0,  b: [8.22, 0.74, 0],   d: 2.9,  az: 13,  el: 8,   sx: 0.17 }
];

export function creaErcos(ctx) {
  const scene = new THREE.Scene();
  scene.environment = ctx.ambienti.chiaro;
  scene.environmentIntensity = 0.55;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.03, 60);
  const sole = new THREE.DirectionalLight(0xfff0dc, 0.95); sole.position.set(-3, 5, 4); scene.add(sole);
  const fianco = new THREE.DirectionalLight(0xffffff, 0.3); fianco.position.set(4, 2, 3); scene.add(fianco);

  /* ---------- I: miscelatore ---------- */
  const set1 = new THREE.Group(); scene.add(set1);
  const rub = miscelatore();
  const piano = pezzo([tr(lastra(1.5, 0.8, 0.03, 0.02, [{ tipo: 'cerchio', x: 0, y: -0.12, r: 0.196 }], 0.004), [0, -0.015, 0.14], [-Math.PI / 2, 0, 0])],
    matCopia('ceramica', { color: 0xcfc7b8, roughness: 0.6, clearcoat: 0.05 }));
  const catino = lavabo(); catino.position.set(0, -0.1, 0.14);
  set1.add(rub, piano, catino);
  const punta = new THREE.Vector3(...rub.userData.punta);
  const matAcqua = matCopia('cromo', { color: 0xe8f1f6, metalness: 0.0, roughness: 0.02, transparent: true, opacity: 0.78, clearcoat: 1, envMapIntensity: 1.6 });
  const goccia = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), matAcqua); set1.add(goccia);
  const cerchio = new THREE.Mesh(anello(1, 0.035, 48, 6), matCopia('cromo', { color: 0xdfe9ee, metalness: 0, roughness: 0.05, transparent: true, opacity: 0.6 }));
  cerchio.rotation.x = Math.PI / 2; cerchio.position.set(punta.x, -0.082, punta.z); set1.add(cerchio);

  /* ---------- II: doccia ---------- */
  const set2 = new THREE.Group(); set2.position.set(4, 0, 0); scene.add(set2);
  const sof = doccia(), pietra = materialePietra(), piatto = piattoDoccia({ materiale: pietra });
  /* una quinta di intonaco caldo dietro: dà stacco al cromo e ai pezzi bianchi sul fondo carta */
  const intonaco = matCopia('ceramica', { color: 0xc9bfae, roughness: 0.9, clearcoat: 0 });
  set2.add(sof, piatto, pezzo([tr(scatola(1.5, 2.45, 0.05, 0.012), [0, 1.26, -0.42])], intonaco));
  pietra.userData.u.uCentro.value.set(4, 0, 0);
  const N = 240;
  const coloreAcqua = coloreFilo(0.82).multiplyScalar(0.8);
  const pioggia = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0016, 0.0016, 1, 5), new THREE.MeshBasicMaterial({ color: coloreAcqua, transparent: true, opacity: 0.62, depthWrite: false }), N);
  pioggia.frustumCulled = false; set2.add(pioggia);
  const semi = []; for (let i = 0; i < N; i++) { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * sof.userData.raggio; semi.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, f: Math.random(), v: 0.75 + Math.random() * 0.5, l: 0.1 + Math.random() * 0.16 }); }
  const vapori = [];
  for (let i = 0; i < 7; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: macchia(), color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
    s.userData = { f: i / 7, x: (Math.random() - 0.5) * 0.7, z: (Math.random() - 0.5) * 0.4 };
    set2.add(s); vapori.push(s);
  }
  const mP = new THREE.Matrix4(), pP = new THREE.Vector3(), sP = new THREE.Vector3(), qP = new THREE.Quaternion();

  /* ---------- III: scaldasalviette e radiatore ---------- */
  const set3 = new THREE.Group(); set3.position.set(8, 0, 0); scene.add(set3);
  const matA = materialeCaldo('bianco'), matB = materialeCaldo('bianco');
  const scalda = scaldasalviette({ materiale: matA }); scalda.position.set(-0.25, 0, 0);
  const rad = radiatore({ materiale: matB, elementi: 12 }); rad.position.set(0.78, 0, 0.02);
  set3.add(pezzo([tr(scatola(2.3, 1.75, 0.05, 0.012), [0.32, 0.9, -0.1])], intonaco));
  set3.add(scalda, rad, (() => { const o = ombra(1.4, 0.5, 0.3); o.position.set(-0.25, 0.002, 0.1); return o; })());
  const bS = scalda.userData.box, bR = rad.userData.box;
  matA.userData.u.uBox.value.set(bS[0], bS[1], 8 - 0.25 + bS[2], bS[3]);
  matB.userData.u.uBox.value.set(bR[0], bR[1], 8 + 0.78 + bR[2], bR[3]);
  window.addEventListener('grip:finitura', (e) => { applicaFinitura(matA, e.detail); applicaFinitura(matB, e.detail); ctx.palco.sporco = true; const t0 = performance.now(); const tieni = () => { ctx.palco.sporco = true; if (performance.now() - t0 < 1000) requestAnimationFrame(tieni); }; tieni(); });

  /* ---------- stato ---------- */
  let ps = 0, primo = true;
  const bersaglio = new THREE.Vector3();
  const fuoco = { distanza: 0.6, apertura: 0.12 };

  function regia(p, out) {
    let i = 0;
    while (i < REGIA.length - 2 && p > REGIA[i + 1].p) i++;
    const a = REGIA[i], b = REGIA[i + 1];
    const k = inOut(clamp((p - a.p) / (b.p - a.p), 0, 1));
    out.b = [lerp(a.b[0], b.b[0], k), lerp(a.b[1], b.b[1], k), lerp(a.b[2], b.b[2], k)];
    out.d = lerp(a.d, b.d, k); out.az = lerp(a.az, b.az, k); out.el = lerp(a.el, b.el, k); out.sx = lerp(a.sx, b.sx, k);
    return out;
  }
  const R = {};

  function aggiorna(av, t, dt) {
    const p = av[0].pin;
    const k = primo || av.subito || ctx.fermo ? 1 : Math.min(1, dt * 5.5);
    primo = false;
    ps = lerp(ps, p, k);
    const mob = ctx.mobile;

    set1.visible = ps < 0.42; set2.visible = ps > 0.28 && ps < 0.76; set3.visible = ps > 0.6;

    /* I — la goccia si forma sul bordo, si allunga, cade, e fa un cerchio nell'acqua */
    if (set1.visible) {
      const c = ctx.fermo ? 0.5 : (t % 2.8) / 2.8;
      const forma = clamp(c / 0.62, 0, 1), cade = clamp((c - 0.62) / 0.14, 0, 1), onda = clamp((c - 0.76) / 0.24, 0, 1);
      const r = 0.0046 * Math.sqrt(forma);
      const y = punta.y - r * 0.9 - (cade * cade) * (punta.y + 0.078);
      goccia.visible = cade < 1;
      goccia.position.set(punta.x, y, punta.z);
      goccia.scale.set(r * (1 - cade * 0.25), r * (1 + forma * 0.35 + cade * 0.9), r * (1 - cade * 0.25));
      cerchio.visible = onda > 0 && onda < 1;
      cerchio.scale.setScalar(0.004 + onda * 0.07);
      cerchio.material.opacity = 0.55 * (1 - onda);
    }

    /* II — pioggia calda, pietra che si bagna, un po' di vapore */
    if (set2.visible) {
      const apri = ss(ps, 0.4, 0.47);
      const n = Math.round(N * ctx.q.particelle * apri);
      pioggia.count = n; pioggia.visible = n > 0;
      const alt = sof.userData.ugello[1] - 0.035;
      for (let i = 0; i < n; i++) {
        const s = semi[i];
        const c = ctx.fermo ? s.f : (s.f + t * s.v * 1.5) % 1;
        const y = alt - c * c * alt * 0.98 - c * 0.02;
        pP.set(s.x * (1 + c * 0.25), 0.035 + y, s.z * (1 + c * 0.25));
        sP.set(1, s.l * (0.4 + c), 1);
        pioggia.setMatrixAt(i, mP.compose(pP, qP, sP));
      }
      pioggia.instanceMatrix.needsUpdate = true;
      pietra.userData.u.uBagnato.value = ss(ps, 0.44, 0.64) * 0.62;
      pietra.userData.u.uTempo.value = t * 0.5;
      const vap = ss(ps, 0.5, 0.6);
      for (const v of vapori) {
        const c = ctx.fermo ? v.userData.f : (v.userData.f + t * 0.07) % 1;
        v.position.set(v.userData.x + Math.sin(c * 5 + v.userData.f * 9) * 0.08, 0.1 + c * 0.9, v.userData.z);
        v.scale.setScalar(0.35 + c * 0.7);
        v.material.opacity = vap * 0.2 * Math.sin(c * Math.PI);
      }
    }

    /* III — il calore sale */
    if (set3.visible) {
      const caldo = ctx.fermo ? 0.85 : ss(ps, 0.72, 0.97);
      matA.userData.u.uCaldo.value = caldo;
      matB.userData.u.uCaldo.value = clamp(caldo * 1.15 - 0.15, 0, 1);
    }

    /* camera */
    regia(ps, R);
    bersaglio.set(R.b[0], R.b[1], R.b[2]);
    const d = R.d * (mob ? 1.45 : 1), az = R.az * GRADI + (ctx.fermo ? 0 : Math.sin(t * 0.3) * 0.015), el = R.el * GRADI;
    camera.position.set(bersaglio.x + d * Math.sin(az) * Math.cos(el), bersaglio.y + d * Math.sin(el), bersaglio.z + d * Math.cos(az) * Math.cos(el));
    camera.lookAt(bersaglio);
    ctx.sposta(camera, mob ? 0 : R.sx, mob ? -0.12 : 0);
    fuoco.distanza = d; fuoco.apertura = clamp(0.1 / d, 0.02, 0.16);
  }

  return { scene, camera, fuoco, aggiorna, oggetti: { rub, sof, scalda, rad } };
}
