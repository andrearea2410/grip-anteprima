/* ==========================================================================
   GRIP — pezzi del BAGNO e del CALDO (famiglie Ercos).
   Forme indicative delle famiglie di prodotto: radiatore multicolonna,
   scaldasalviette, miscelatore, soffione e piatto doccia.
   DA CONFERMARE CON GRIP: quali linee Ercos tratta davvero.
   ========================================================================== */
import { THREE, tr, pezzo, scatola, cilindro, anello, tornio, tubo, gruppo } from './util.js';
import { matCopia, ombra, GLSL_RUMORE } from '../materiali.js';

const PI = Math.PI;

/* Finiture del configuratore illustrativo (scaldasalviette e radiatore). */
export const FINITURE = {
  bianco: { nome: 'Bianco',       color: 0xf2f1ec, metalness: 0.0, roughness: 0.32, clearcoat: 0.5 },
  nero:   { nome: 'Nero opaco',   color: 0x17181a, metalness: 0.1, roughness: 0.72, clearcoat: 0.0 },
  cromo:  { nome: 'Cromo',        color: 0xffffff, metalness: 1.0, roughness: 0.04, clearcoat: 0.0 },
  salvia: { nome: 'Verde salvia', color: 0x7d8f7c, metalness: 0.0, roughness: 0.5,  clearcoat: 0.25 }
};

/**
 * Materiale verniciato che "si scalda": un bagliore caldo sale dentro il
 * metallo. uCaldo va da 0 (freddo) a 1 (tutto caldo). Il fronte sale lungo Y
 * e parte dal lato dell'ingresso (X minore), così i tubi si accendono uno dopo l'altro.
 */
export function materialeCaldo(finitura = 'bianco') {
  const { nome, ...ricetta } = FINITURE[finitura];
  const m = matCopia('smalto', ricetta);
  m.name = 'finitura';
  const u = { uCaldo: { value: 0 }, uColCaldo: { value: new THREE.Color(0xffa63a) }, uBox: { value: new THREE.Vector4(0, 1, -0.5, 1) } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWp;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uCaldo; uniform vec3 uColCaldo; uniform vec4 uBox; varying vec3 vWp;
        ${GLSL_RUMORE}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          float h = clamp((vWp.y - uBox.x) / uBox.y, 0.0, 1.0);
          float lx = clamp((vWp.x - uBox.z) / uBox.w, 0.0, 1.0);
          float fronte = uCaldo * 1.45 - h - lx * 0.3 + (gNoise(vWp * 22.0) - 0.5) * 0.08;
          float caldo = smoothstep(0.0, 0.22, fronte);
          float orlo = smoothstep(0.0, 0.06, fronte) * smoothstep(0.3, 0.06, fronte);
          totalEmissiveRadiance += uColCaldo * (caldo * 0.3 + orlo * 0.8);
        }`);
  };
  m.customProgramCacheKey = () => 'caldo';
  m.userData.u = u;
  return m;
}

/** Cambia finitura a un materialeCaldo (con o senza transizione, se c'è gsap). */
export function applicaFinitura(m, chiave) {
  const f = FINITURE[chiave];
  if (!f) return;
  const c = new THREE.Color(f.color);
  const g = window.gsap;
  if (g && !document.documentElement.classList.contains('fermo')) {
    g.to(m.color, { r: c.r, g: c.g, b: c.b, duration: 0.8, ease: 'power3.out' });
    g.to(m, { metalness: f.metalness, roughness: f.roughness, clearcoat: f.clearcoat, duration: 0.8, ease: 'power3.out' });
  } else { m.color.copy(c); m.metalness = f.metalness; m.roughness = f.roughness; m.clearcoat = f.clearcoat; }
}

/* ----------------------------------------------------------- radiatore */
export function radiatore({ materiale = materialeCaldo(), elementi = 12 } = {}) {
  const passo = 0.046, H = 0.6, y0 = 0.14, L = elementi * passo;
  const col = [];
  for (let i = 0; i < elementi; i++) {
    const x = -L / 2 + passo * (i + 0.5);
    for (const z of [-0.042, 0, 0.042]) col.push(tr(cilindro(0.0125, H - 0.04, 16), [x, y0 + H / 2, z]));
    col.push(tr(scatola(0.04, 0.05, 0.126, 0.02, 4), [x, y0 + 0.012, 0]), tr(scatola(0.04, 0.05, 0.126, 0.02, 4), [x, y0 + H - 0.012, 0]));
  }
  col.push(tr(cilindro(0.016, L - 0.01, 20), [0, y0 + 0.012, 0], [0, 0, PI / 2]), tr(cilindro(0.016, L - 0.01, 20), [0, y0 + H - 0.012, 0], [0, 0, PI / 2]));
  const g = gruppo('radiatore', [
    pezzo(col, materiale, 'corpo'),
    pezzo([
      tr(cilindro(0.017, 0.02, 6), [-L / 2 - 0.008, y0 + 0.012, 0], [0, 0, PI / 2]), tr(cilindro(0.017, 0.02, 6), [L / 2 + 0.008, y0 + 0.012, 0], [0, 0, PI / 2]),
      tr(cilindro(0.014, 0.012, 24), [-L / 2 - 0.004, y0 + H - 0.012, 0], [0, 0, PI / 2]), tr(cilindro(0.014, 0.012, 24), [L / 2 + 0.004, y0 + H - 0.012, 0], [0, 0, PI / 2]),
      tr(cilindro(0.012, 0.05, 20), [-L / 2 - 0.035, y0 + 0.012, 0], [0, 0, PI / 2]), tr(cilindro(0.018, 0.035, 28), [-L / 2 - 0.04, y0 + 0.045, 0]),
      tr(cilindro(0.012, 0.05, 20), [L / 2 + 0.035, y0 + 0.012, 0], [0, 0, PI / 2]), tr(cilindro(0.013, 0.02, 6), [L / 2 + 0.04, y0 + 0.03, 0]),
      tr(cilindro(0.008, y0, 16), [-L / 2 - 0.04, y0 / 2, 0]), tr(cilindro(0.008, y0, 16), [L / 2 + 0.04, y0 / 2, 0]),
      tr(tornio([[0.008, 0], [0.022, 0.002], [0.02, 0.008], [0.008, 0.01]], 24), [-L / 2 - 0.04, 0, 0]), tr(tornio([[0.008, 0], [0.022, 0.002], [0.02, 0.008], [0.008, 0.01]], 24), [L / 2 + 0.04, 0, 0])
    ], 'cromo'),
    ombra(L + 0.5, 0.5, 0.4)
  ], { materiale, box: [y0, H, -L / 2, L] });
  return g;
}

/* ----------------------------------------------------- scaldasalviette */
export function scaldasalviette({ materiale = materialeCaldo() } = {}) {
  const W = 0.5, H = 1.18, y0 = 0.22, r = 0.0105;
  const lista = [];
  for (const sx of [-1, 1]) {
    lista.push(tr(cilindro(0.017, H, 20), [sx * (W / 2 - 0.017), y0 + H / 2, 0]));
    lista.push(tr(tornio([[0, 0], [0.017, 0], [0.012, 0.008], [0, 0.011]], 20), [sx * (W / 2 - 0.017), y0 + H, 0]));
  }
  let y = y0 + 0.05;
  for (const n of [6, 5, 4, 3]) {
    for (let i = 0; i < n; i++) { lista.push(tr(cilindro(r, W - 0.04, 16), [0, y, 0.014], [0, 0, PI / 2])); y += 0.043; }
    y += 0.085;
  }
  const g = gruppo('scaldasalviette', [
    pezzo(lista, materiale, 'corpo'),
    pezzo([
      ...[-1, 1].flatMap((sx) => [
        tr(cilindro(0.013, 0.05, 20), [sx * (W / 2 - 0.017), y0 - 0.025, 0]),
        tr(cilindro(0.011, 0.07, 20), [sx * (W / 2 - 0.017), y0 - 0.05, -0.03], [PI / 2, 0, 0]),
        tr(cilindro(0.018, 0.032, 28), [sx * (W / 2 - 0.017), y0 - 0.05, 0.02], [PI / 2, 0, 0]),
        tr(cilindro(0.008, 0.07, 14), [sx * (W / 2 - 0.017), y0 + 0.2, -0.035], [PI / 2, 0, 0]),
        tr(cilindro(0.008, 0.07, 14), [sx * (W / 2 - 0.017), y0 + H - 0.15, -0.035], [PI / 2, 0, 0])
      ])
    ], 'cromo')
  ], { materiale, box: [y0, H, -W / 2, W] });
  return g;
}

/* ---------------------------------------------------------- miscelatore */
export function miscelatore() {
  const corpo = tornio([[0, 0], [0.028, 0], [0.028, 0.005], [0.0238, 0.011], [0.0222, 0.1], [0.0228, 0.118], [0.0195, 0.128], [0, 0.131]], 64);
  const canna = tubo([[0, 0.072, 0.012], [0, 0.128, 0.062], [0, 0.128, 0.148], [0, 0.1, 0.148]], 0.0112, 0.03, 20, 0.004);
  const g = gruppo('miscelatore', [
    pezzo([
      corpo, canna,
      tr(cilindro(0.0125, 0.012, 32), [0, 0.097, 0.148]),
      tr(cilindro(0.0205, 0.012, 48), [0, 0.137, 0]),
      tr(scatola(0.015, 0.008, 0.1, 0.004, 4), [0, 0.15, 0.035], [-0.16, 0, 0]),
      tr(anello(0.0225, 0.0012, 64, 6), [0, 0.1, 0], [PI / 2, 0, 0])
    ], 'cromo'),
    pezzo([tr(cilindro(0.0098, 0.002, 24), [0, 0.0905, 0.148])], 'interno')
  ], { punta: [0, 0.089, 0.148] });
  return g;
}

/** Lavabo d'appoggio in ceramica, con il piano. Serve da set per il miscelatore. */
export function lavabo() {
  const catino = tornio([[0, 0.0], [0.15, 0.0], [0.2, 0.02], [0.21, 0.11], [0.202, 0.118], [0.194, 0.11], [0.182, 0.035], [0.14, 0.018], [0, 0.014]], 96);
  return gruppo('lavabo', [
    pezzo([tr(catino, [0, 0, 0.12])], 'ceramica'),
    pezzo([tr(cilindro(0.021, 0.004, 32), [0, 0.016, 0.12])], 'cromo')
  ]);
}

/* -------------------------------------------------------------- doccia */
export function doccia() {
  const yS = 2.05, zM = -0.36;
  const g = gruppo('doccia', [
    pezzo([
      tr(tornio([[0, 0], [0.142, 0], [0.15, 0.004], [0.15, 0.011], [0.03, 0.016], [0.014, 0.034], [0, 0.034]], 96), [0, yS, 0]),
      tubo([[0, yS + 0.03, 0], [0, yS + 0.09, 0], [0, yS + 0.09, zM]], 0.0115, 0.045, 16, 0.01),
      tr(cilindro(0.032, 0.008, 40), [0, yS + 0.09, zM], [PI / 2, 0, 0]),
      tr(cilindro(0.009, yS - 1.0, 16), [0, 1.1 + (yS - 1.0) / 2, zM + 0.02]),
      tr(cilindro(0.021, 0.3, 32), [0, 1.1, zM + 0.03], [0, 0, PI / 2]),
      tr(cilindro(0.024, 0.045, 32), [-0.17, 1.1, zM + 0.03], [0, 0, PI / 2]), tr(cilindro(0.024, 0.045, 32), [0.17, 1.1, zM + 0.03], [0, 0, PI / 2]),
      tr(cilindro(0.03, 0.006, 32), [-0.075, 1.1, zM], [PI / 2, 0, 0]), tr(cilindro(0.03, 0.006, 32), [0.075, 1.1, zM], [PI / 2, 0, 0])
    ], 'cromo'),
    pezzo([tr(cilindro(0.136, 0.002, 64), [0, yS - 0.001, 0])], 'gomma')
  ], { ugello: [0, yS, 0], raggio: 0.13 });
  return g;
}

/* Pietra del piatto doccia: venature di rumore, e dove arriva l'acqua la
   superficie si scurisce e diventa lucida. uBagnato 0 → 1. */
export function materialePietra() {
  const m = matCopia('ceramica', { color: 0xb9b3a8, roughness: 0.78, clearcoat: 0 });
  const u = { uBagnato: { value: 0 }, uCentro: { value: new THREE.Vector3() }, uTempo: { value: 0 } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWp;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uBagnato, uTempo; uniform vec3 uCentro; varying vec3 vWp; float gAcqua = 0.0;
        ${GLSL_RUMORE}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        {
          float vena = gFbm(vWp * vec3(9.0, 30.0, 14.0));
          float grana = gNoise(vWp * 260.0);
          diffuseColor.rgb *= 0.82 + vena * 0.3 + (grana - 0.5) * 0.08;
          float d = length((vWp - uCentro).xz);
          float macchia = gFbm(vWp * 16.0);
          gAcqua = smoothstep(0.0, 0.14, uBagnato * 0.95 - d + (macchia - 0.5) * 0.3);
          diffuseColor.rgb *= mix(1.0, 0.52, gAcqua);
        }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.06 + 0.08 * gNoise(vWp * 90.0 + uTempo), gAcqua);`);
  };
  m.customProgramCacheKey = () => 'pietra';
  m.userData.u = u;
  return m;
}

export function piattoDoccia({ materiale = materialePietra() } = {}) {
  return gruppo('piatto', [
    pezzo([tr(scatola(1.2, 0.035, 0.8, 0.006, 3), [0, 0.0175, 0])], materiale, 'pietra'),
    pezzo([tr(scatola(0.13, 0.003, 0.13, 0.0012, 1), [0.38, 0.036, 0])], 'cromo'),
    ombra(1.7, 1.2, 0.35)
  ], { materiale });
}

/** Set completo doccia (soffione + piatto) per miniature e montaggio. */
export function setDoccia() {
  const d = doccia(), p = piattoDoccia();
  return gruppo('doccia', [d, p], { ugello: d.userData.ugello, pietra: p.userData.materiale });
}
