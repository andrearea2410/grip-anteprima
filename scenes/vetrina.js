/* ==========================================================================
   GRIP — SCENA 3: LA VETRINA DELL'ARIA.
   Un pezzo 3D per ogni tipo dell'elenco prodotti. Ogni pezzo sta esattamente
   sopra il suo riquadro nella pagina (.tipo-posto): quando la fascia scorre
   in orizzontale (o si sfoglia col dito) i pezzi scorrono con lei.
   Ogni pezzo si può ruotare trascinandolo.
   ========================================================================== */
import * as THREE from 'three';
import { crea } from './parts/indice.js';
import { coloreFilo } from './filo.js';
import { VETRINA } from '../dati/prodotti.js';

const lerp = THREE.MathUtils.lerp;

export function creaVetrina(ctx) {
  const scene = new THREE.Scene();
  scene.environment = ctx.ambienti.scuro;
  scene.environmentIntensity = 0.62;
  const DIST = 9;
  const camera = new THREE.PerspectiveCamera(26, 1, 0.5, 40);
  camera.position.set(0, 0, DIST);

  const chiave = new THREE.DirectionalLight(0xffffff, 0.95); chiave.position.set(-3.5, 4.5, 3.5); scene.add(chiave);
  const contro = new THREE.DirectionalLight(0xa9d4ff, 1.1); contro.position.set(3, 2, -4); scene.add(contro);
  const sua = new THREE.PointLight(0xffffff, 2.2, 7, 1.6); scene.add(sua);   // la luce che segue il pezzo al centro

  const box = new THREE.Box3(), dim = new THREE.Vector3(), centro = new THREE.Vector3(), p3 = new THREE.Vector3(), colore = new THREE.Color();
  const voci = VETRINA.map((v, i) => {
    const pezzo = crea(v.id, v.id === 'esterna' ? { dettaglio: 1 } : {});
    pezzo.traverse((o) => { if (o.name === 'ombra') o.visible = false; });
    box.setFromObject(pezzo); box.getSize(dim); box.getCenter(centro);
    pezzo.position.sub(centro);                       // il perno è al centro del pezzo
    const perno = new THREE.Group(); perno.add(pezzo);
    const tieni = new THREE.Group(); tieni.add(perno);
    tieni.visible = false;
    scene.add(tieni);
    const pale = pezzo.userData.pale ? [].concat(pezzo.userData.pale) : [];
    return {
      id: v.id, i, tieni, perno, pale, dim: dim.clone(), ingombro: Math.max(dim.x, dim.z * 0.8),
      posto: document.querySelector(`.tipo-posto[data-posto="${v.id}"]`),
      giro: 0, giroV: 0, extra: 0, scala: 1
    };
  });

  /* trascinare per ruotare; passare su un prodotto fa fare un giro al suo pezzo */
  let preso = null, ultimoX = 0;
  for (const v of voci) {
    if (!v.posto) continue;
    v.posto.addEventListener('pointerdown', (e) => { preso = v; ultimoX = e.clientX; v.giroV = 0; v.posto.setPointerCapture?.(e.pointerId); });
    v.posto.addEventListener('pointermove', (e) => {
      if (preso !== v) return;
      const dx = e.clientX - ultimoX; ultimoX = e.clientX;
      v.giro += dx * 0.011; v.giroV = dx * 0.011 * 60; ctx.palco.sporco = true;
    });
    const molla = () => { if (preso === v) preso = null; };
    v.posto.addEventListener('pointerup', molla); v.posto.addEventListener('pointercancel', molla);
    v.posto.closest('.tipo')?.addEventListener('pointerover', (e) => {
      if (e.target.closest('.tipo-prodotti li:not(.vuoto)') && !v.inGiro && window.gsap && !ctx.fermo) {
        v.inGiro = true;
        window.gsap.to(v, { extra: v.extra + Math.PI * 2, duration: 1.4, ease: 'power3.out', onComplete: () => { v.inGiro = false; } });
      }
    });
  }

  function aggiorna(av, t, dt) {
    const mondoPerPx = (2 * DIST * Math.tan((camera.fov * Math.PI) / 360)) / ctx.h;
    let piuVicino = null, distMin = Infinity;
    for (const v of voci) {
      if (!v.posto) continue;
      const r = v.posto.getBoundingClientRect();
      const vis = r.right > -80 && r.left < ctx.w + 80 && r.width > 10;
      v.tieni.visible = vis;
      if (!vis) continue;
      const cx = r.left + r.width / 2, cy = r.top + r.height * 0.52;
      ctx.mondoDaSchermo(camera, cx, cy, 0, p3);
      v.tieni.position.copy(p3);
      const diag = Math.hypot(v.dim.x, v.dim.z) * 0.92;      // ingombro quando ruota
      v.scala = Math.min((r.width * 0.8 * mondoPerPx) / diag, (r.height * 0.9 * mondoPerPx) / v.dim.y);
      v.tieni.scale.setScalar(v.scala);
      if (preso !== v && !ctx.fermo) { v.giro += v.giroV * dt; v.giroV *= Math.pow(0.02, dt); }
      const riposo = -0.52 + (ctx.fermo ? 0 : Math.sin(t * 0.35 + v.i) * 0.06);
      v.perno.rotation.set(0.1, riposo + v.giro + v.extra, 0);
      v.tieni.rotation.x = 0.06;
      if (!ctx.fermo) for (const p of v.pale) p.rotation.z -= dt * 5;
      const d = Math.abs(cx - ctx.w / 2);
      if (d < distMin) { distMin = d; piuVicino = v; }
    }
    if (piuVicino) {
      /* la luce del pezzo al centro: dal freddo al caldo lungo la fascia, come il filo */
      const k = Math.min(1, dt * 4) || 1;
      sua.position.lerp(p3.copy(piuVicino.tieni.position).add(new THREE.Vector3(1.4, 1.6, 2.6)), av.subito ? 1 : k);
      coloreFilo(0.15 + (piuVicino.i / (voci.length - 1)) * 0.7, colore);
      sua.color.lerp(colore, av.subito ? 1 : k);
    }
  }

  return { scene, camera, aggiorna, oggetti: { voci } };
}
