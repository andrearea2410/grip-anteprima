/* ==========================================================================
   GRIP — materiali e luce da studio, condivisi da tutte le scene.
   Tutti i materiali sono fisici (MeshPhysicalMaterial) e illuminati da una
   environment map: `studioScuro` (softbox su fondo nero, per l'aria) oppure
   la RoomEnvironment di three (più aperta, per il bagno).
   ========================================================================== */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const COLORI = {
  notte: 0x0e1620, aria: 0x8fd3ff, giallo: 0xfdce06, carta: 0xf5f3ee, metallo: 0xa7b0ba,
  rame: 0xc97b4b
};

const RICETTE = {
  lamieraScura:   { color: 0x262a30, metalness: 0.45, roughness: 0.46, clearcoat: 0.35, clearcoatRoughness: 0.45 },
  lamieraChiara:  { color: 0xe6e6e0, metalness: 0.12, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.35 },
  plasticaBianca: { color: 0xf1f1ec, metalness: 0.0, roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.25 },
  plasticaGrigia: { color: 0xb9bec3, metalness: 0.0, roughness: 0.45 },
  plasticaNera:   { color: 0x101215, metalness: 0.0, roughness: 0.42, clearcoat: 0.2 },
  gomma:          { color: 0x0a0a0b, metalness: 0.0, roughness: 0.92 },
  alluminio:      { color: 0xd3d9de, metalness: 1.0, roughness: 0.3, anisotropy: 0.75 },
  rame:           { color: COLORI.rame, metalness: 1.0, roughness: 0.2 },
  ottone:         { color: 0xbf9f52, metalness: 1.0, roughness: 0.28 },
  acciaioNero:    { color: 0x14161a, metalness: 0.75, roughness: 0.34, clearcoat: 0.6, clearcoatRoughness: 0.3 },
  zincato:        { color: 0xa4abb1, metalness: 0.95, roughness: 0.48 },
  cromo:          { color: 0xffffff, metalness: 1.0, roughness: 0.035 },
  smalto:         { color: 0xf4f3ee, metalness: 0.0, roughness: 0.22, clearcoat: 0.7, clearcoatRoughness: 0.15 },
  multistrato:    { color: 0xecebe6, metalness: 0.0, roughness: 0.5 },
  vetroScuro:     { color: 0x05070a, metalness: 0.0, roughness: 0.08, clearcoat: 1.0, clearcoatRoughness: 0.05 },
  ceramica:       { color: 0xf6f5f1, metalness: 0.0, roughness: 0.12, clearcoat: 0.9, clearcoatRoughness: 0.08 },
  interno:        { color: 0x0b0d10, metalness: 0.2, roughness: 0.8 }
};

const cache = new Map();

/** Restituisce il materiale condiviso con quel nome (creato una volta sola). */
export function mat(nome) {
  if (!cache.has(nome)) {
    const r = RICETTE[nome];
    if (!r) throw new Error('Materiale sconosciuto: ' + nome);
    const m = new THREE.MeshPhysicalMaterial(r);
    m.name = nome;
    cache.set(nome, m);
  }
  return cache.get(nome);
}

/** Copia indipendente (per finiture o effetti che cambiano solo su un pezzo). */
export function matCopia(nome, extra = {}) {
  const m = mat(nome).clone();
  m.setValues(extra);
  return m;
}

/* --------------------------------------------------------------------------
   Environment map. Lo studio scuro è una stanza nera con tre softbox:
   uno grande dall'alto, una striscia laterale fredda e un controluce caldo.
   È quello che dà i riflessi "da foto di prodotto" su lamiera, rame e cromo.
   -------------------------------------------------------------------------- */
function scenaStudioScuro() {
  const s = new THREE.Scene();
  const stanza = new THREE.Mesh(
    new THREE.BoxGeometry(20, 12, 20),
    new THREE.MeshBasicMaterial({ color: 0x06080b, side: THREE.BackSide })
  );
  s.add(stanza);
  const luce = (w, h, col, forza, pos, guarda = [0, 0, 0]) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(forza), side: THREE.DoubleSide })
    );
    m.position.set(...pos);
    m.lookAt(...guarda);
    s.add(m);
  };
  luce(9, 5, 0xffffff, 9, [0, 5.6, 1.5]);            // softbox dall'alto
  luce(2.2, 7, 0xcfe6ff, 14, [-8.5, 1.5, 2.5]);      // striscia fredda a sinistra
  luce(1.6, 6, 0xffe2b0, 10, [8.5, 1.0, -3]);        // controluce caldo a destra
  luce(6, 1.2, 0xffffff, 5, [0, 0.4, 9.5]);          // riempimento basso frontale
  luce(10, 0.5, 0x9fc6ff, 6, [0, 3.5, -9.6]);        // filo di luce dietro
  return s;
}

export function creaAmbienti(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const scuro = pmrem.fromScene(scenaStudioScuro(), 0.03).texture;
  const chiaro = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return { scuro, chiaro };
}

/* Macchia morbida usata per le ombre a contatto e per gli aloni. */
let texMacchia = null;
export function macchia() {
  if (texMacchia) return texMacchia;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  gr.addColorStop(0.7, 'rgba(255,255,255,0.12)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  texMacchia = new THREE.CanvasTexture(c);
  return texMacchia;
}

/** Ombra a contatto: un piano scuro e sfumato appoggiato sotto il pezzo. */
export function ombra(w, d, forza = 0.55, y = 0.002) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: macchia(), color: 0x000000, transparent: true, opacity: forza, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  m.renderOrder = -1;
  m.name = 'ombra';
  return m;
}

/* Rumore GLSL condiviso dagli shader (brina, pietra bagnata, calore). */
export const GLSL_RUMORE = /* glsl */ `
float gHash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float gNoise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(gHash(i), gHash(i + vec3(1,0,0)), f.x), mix(gHash(i + vec3(0,1,0)), gHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(gHash(i + vec3(0,0,1)), gHash(i + vec3(1,0,1)), f.x), mix(gHash(i + vec3(0,1,1)), gHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float gFbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * gNoise(p); p *= 2.03; a *= 0.5; } return s; }
`;
