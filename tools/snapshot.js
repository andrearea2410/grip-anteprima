/* ==========================================================================
   GRIP — fotografie fatte dalle scene stesse (niente immagini stock).
   Si avvia aprendo  http://localhost:5507/?snapshot=1  con il server di
   tools/server.js: il sito disegna ogni scena in una posa, e ogni pezzo del
   kit su fondo trasparente, e salva i file in assets/snap/ :
     hero.webp, dentro.webp, bagno.webp, impianto.webp   → pagina senza WebGL
     mini-<forma>.webp                                   → miniature del catalogo
   Da rifare ogni volta che si cambia un pezzo 3D o una scena.
   In console:  await GRIP.fotografie   dà l'elenco dei file salvati.
   ========================================================================== */
import * as THREE from 'three';
import { KIT, crea } from '../scenes/parts/indice.js';

async function salva(nome, dataUrl) {
  const blob = await (await fetch(dataUrl)).blob();
  const r = await fetch('/__salva?file=' + nome, { method: 'POST', body: blob });
  return { nome, byte: blob.size, ok: r.ok };
}

/** Un pezzo del kit da solo, in luce da studio, su fondo trasparente. */
export function scattaPezzo(palco, forma, lato = 520) {
  const renderer = palco.renderer;
  const scene = new THREE.Scene();
  scene.environment = palco.ambienti.scuro; scene.environmentIntensity = 0.62;
  const chiave = new THREE.DirectionalLight(0xffffff, 0.95); chiave.position.set(-3.5, 4.5, 3.5); scene.add(chiave);
  const contro = new THREE.DirectionalLight(0xa9d4ff, 1.1); contro.position.set(3, 2, -4); scene.add(contro);
  const luce = new THREE.PointLight(0xffffff, 2.2, 9, 1.6); luce.position.set(1.4, 1.6, 2.6); scene.add(luce);
  const pezzo = crea(forma, forma === 'esterna' ? { dettaglio: 1 } : {});
  pezzo.traverse((o) => { if (o.name === 'ombra') o.visible = false; });
  const box = new THREE.Box3().setFromObject(pezzo), dim = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  pezzo.position.sub(c);
  const perno = new THREE.Group(); perno.add(pezzo); perno.rotation.set(0.1, -0.52, 0); scene.add(perno);
  const ragg = Math.max(Math.hypot(dim.x, dim.z) * 0.5, dim.y * 0.5) * 1.12;
  const camera = new THREE.PerspectiveCamera(24, 1, 0.05, 60);
  const dist = ragg / Math.tan((camera.fov * Math.PI) / 360);
  camera.position.set(0, dist * 0.1, dist); camera.lookAt(0, 0, 0);
  const prima = { pr: renderer.getPixelRatio(), size: renderer.getSize(new THREE.Vector2()) };
  renderer.setPixelRatio(1); renderer.setSize(lato, lato, false);
  renderer.domElement.style.clipPath = 'none';
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL('image/webp', 0.86);
  renderer.setPixelRatio(prima.pr); renderer.setSize(prima.size.x, prima.size.y, false);
  scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
  return url;
}

export async function avvia(palco) {
  if (!palco?.ok) { console.warn('[fotografie] serve WebGL'); return []; }
  const lavoro = (async () => {
    await new Promise((r) => setTimeout(r, 1500));
    palco.ferma();
    const fatti = [];
    const scene = [
      ['hero.webp', 'macchina', [0.96, 0]], ['dentro.webp', 'macchina', [1, 0.33]],
      ['bagno.webp', 'ercos', [0.96]], ['impianto.webp', 'montaggio', [0.8]]
    ];
    for (const [nome, id, posa] of scene) {
      const url = palco.scatta(id, posa, 1600, 1000, 4);
      if (url) fatti.push(await salva(nome, url)); else fatti.push({ nome, ok: false });
    }
    for (const forma of Object.keys(KIT)) fatti.push(await salva(`mini-${forma}.webp`, scattaPezzo(palco, forma)));
    palco.taglio = ''; palco.sporco = true; palco.avvia();
    console.info('[fotografie] salvate', fatti);
    return fatti;
  })();
  window.GRIP.fotografie = lavoro;
  return lavoro;
}
