/* ==========================================================================
   GRIP — pezzo: POMPA DI CALORE MONOBLOCCO (unità esterna).
   È il pezzo più curato del kit: serve nell'hero (macro sulle alette, brina),
   nella vista esplosa, nella vetrina, nel montaggio e nelle miniature.
   Forma indicativa: nessuna targhetta, sigla o dato.

   dettaglio: 2 = hero (alette fitte, interno completo)
              1 = vetrina / montaggio
              0 = miniatura
   ========================================================================== */
import { THREE, tr, fondi, pezzo, scatola, cilindro, anello, lastra, tornio, tubo, percorso, ventola, grigliaRaggi, feritoie, gruppo } from './util.js';
import { mat, matCopia, ombra } from '../materiali.js';

export const MISURE = { W: 1.12, D: 0.42, H: 0.76, y0: 0.09, xVentola: -0.17 };

/* --------------------------------------------------------------------------
   MAPPE DELLA BRINA — calcolate una volta sola, all'avvio, e condivise.
   Prima lo shader ricalcolava a ogni fotogramma, per ogni punto di ogni
   aletta, tre rumori frattali da 4 ottave più un rumore fine (13 rumori):
   sulla GT 710 erano più di 200 ms per fotogramma nella macro.
   Ora il rumore frattale sta in un piccolo VOLUME 64×64×64 che si ripete
   senza giunte: lo shader lo legge tre volte, a tre scale diverse (chiazze
   grandi, chiazze medie, fronte fine), come faceva il calcolo originale.
   Essendo un volume e non un'immagine piatta, il rumore varia in tutte e
   tre le direzioni: le chiazze passano da un'aletta all'altra senza pieghe.
   Le scintille usano una mappa piatta 256×256 casuale (D).
   -------------------------------------------------------------------------- */
const fract = (x) => x - Math.floor(x);
function hash3(x, y, z) {
  x = fract(x * 0.3183099 + 0.1) * 17; y = fract(y * 0.3183099 + 0.1) * 17; z = fract(z * 0.3183099 + 0.1) * 17;
  return fract(x * y * z * (x + y + z));
}

const LATO_VOLUME = 64, CELLE = 8;      // 8 celle di rumore per lato al primo ottava → si ripete ogni 8 celle
let mappeBrina = null;
function creaMappeBrina() {
  if (mappeBrina) return mappeBrina;
  const t0 = performance.now();
  /* frattale ripetibile: 4 ottave con periodo 8, 16, 32, 64 celle; ogni ottava ha la sua tabella di valori casuali */
  const N = LATO_VOLUME, somma = new Float32Array(N * N * N);
  const fade = (t) => t * t * (3 - 2 * t);
  for (let o = 0, amp = 0.5; o < 4; o++, amp *= 0.5) {
    const P = CELLE << o, tab = new Float32Array(P * P * P);
    for (let k = 0; k < P; k++) for (let j = 0; j < P; j++) for (let i = 0; i < P; i++) tab[(k * P + j) * P + i] = hash3(i + o * 101, j + o * 57, k + o * 13);
    const v = (i, j, k) => tab[((k % P) * P + (j % P)) * P + (i % P)];
    for (let z = 0; z < N; z++) {
      const cz = ((z + 0.5) / N) * P, iz = Math.floor(cz), fz = fade(cz - iz);
      for (let y = 0; y < N; y++) {
        const cy = ((y + 0.5) / N) * P, iy = Math.floor(cy), fy = fade(cy - iy);
        for (let x = 0; x < N; x++) {
          const cx = ((x + 0.5) / N) * P, ix = Math.floor(cx), fx = fade(cx - ix);
          const a = v(ix, iy, iz) + (v(ix + 1, iy, iz) - v(ix, iy, iz)) * fx;
          const b = v(ix, iy + 1, iz) + (v(ix + 1, iy + 1, iz) - v(ix, iy + 1, iz)) * fx;
          const c = v(ix, iy, iz + 1) + (v(ix + 1, iy, iz + 1) - v(ix, iy, iz + 1)) * fx;
          const d = v(ix, iy + 1, iz + 1) + (v(ix + 1, iy + 1, iz + 1) - v(ix, iy + 1, iz + 1)) * fx;
          const ab = a + (b - a) * fy, cd = c + (d - c) * fy;
          somma[(z * N + y) * N + x] += amp * (ab + (cd - ab) * fz);
        }
      }
    }
  }
  const dati = new Uint8Array(N * N * N);
  for (let i = 0; i < dati.length; i++) dati[i] = Math.round(Math.min(1, somma[i] / 0.9375) * 255);
  const V = new THREE.Data3DTexture(dati, N, N, N);
  V.format = THREE.RedFormat; V.type = THREE.UnsignedByteType; V.unpackAlignment = 1;
  V.wrapS = V.wrapT = V.wrapR = THREE.RepeatWrapping;
  /* niente mipmap: viste di taglio verrebbero sfumate verso il grigio medio e la
     brina, che nasce dai picchi del rumore, sparirebbe. Lo shader di prima non filtrava. */
  V.magFilter = V.minFilter = THREE.LinearFilter; V.generateMipmaps = false;
  V.needsUpdate = true;

  const dw = 256, Dm = new Uint8Array(dw * dw * 4);
  for (let j = 0; j < dw; j++) for (let i = 0; i < dw; i++) { const k = (j * dw + i) * 4; Dm[k] = Math.round(hash3(i, j, 7) * 255); Dm[k + 3] = 255; }
  const D = new THREE.DataTexture(Dm, dw, dw, THREE.RGBAFormat);
  D.wrapS = D.wrapT = THREE.RepeatWrapping; D.magFilter = D.minFilter = THREE.LinearFilter; D.generateMipmaps = false; D.colorSpace = THREE.NoColorSpace;
  D.needsUpdate = true;
  mappeBrina = { V, D, ms: Math.round(performance.now() - t0) };
  return mappeBrina;
}

/* Materiale delle alette con la brina: una maschera fa avanzare i cristalli
   dal bordo esterno verso l'interno, con un fronte irregolare. */
function materialeAlette(uniformi, alt, prof) {
  const m = matCopia('alluminio', { side: THREE.DoubleSide, color: 0x858e97, roughness: 0.4, envMapIntensity: 0.32, anisotropy: 0.6 });
  const mappe = creaMappeBrina();
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uBrina = uniformi.uBrina;
    sh.uniforms.uBagnato = uniformi.uBagnato;
    sh.uniforms.uAletta = { value: new THREE.Vector2(alt, prof) };
    sh.uniforms.tBrinaV = { value: mappe.V };
    sh.uniforms.tBrinaD = { value: mappe.D };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vAlL; varying vec3 vAlI; varying vec2 vAlD;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vAlL = position;
        #ifdef USE_INSTANCING
          vAlI = (instanceMatrix * vec4(position, 1.0)).xyz;
          float alLato = step(0.5, abs(instanceMatrix[0].z));
        #else
          vAlI = position; float alLato = 0.0;
        #endif
        /* scintille: coordinate sulla faccia dell'aletta (profondità e altezza),
           spostate di aletta in aletta perché non si ripetano uguali */
        vAlD = vec2(mix(vAlI.z, vAlI.x, alLato) + mix(vAlI.x, vAlI.z, alLato) * 7.13, vAlI.y) * (1400.0 / 256.0);`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uBrina, uBagnato; uniform vec2 uAletta;
        uniform highp sampler3D tBrinaV; uniform sampler2D tBrinaD;
        varying vec3 vAlL; varying vec3 vAlI; varying vec2 vAlD;
        float gBrina = 0.0; float gScintilla = 0.0; float gFondo = 0.0;
        /* il volume si ripete ogni ${CELLE} celle: coordinate in celle diviso ${CELLE} */
        float gVol(vec3 p) { return texture(tBrinaV, p * ${(1 / CELLE).toFixed(4)}).r * 0.9375; }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        {
          float e = clamp(vAlL.z / uAletta.y + 0.5, 0.0, 1.0);
          gFondo = e;
          float bordoY = smoothstep(0.0, 0.05, 0.5 - abs(vAlL.y / uAletta.x));
          /* i cristalli nascono a chiazze e avanzano dal bordo esterno verso l'interno */
          float chiazze = gVol(vAlI * vec3(11.0, 9.0, 11.0));
          float medie = gVol(vAlI * vec3(64.0, 48.0, 64.0) + vec3(2.37, 5.11, 0.73));
          float n = gVol(vAlI * vec3(150.0, 55.0, 150.0) + vec3(4.71, 1.93, 6.29));
          float fine = texture2D(tBrinaD, vAlD).r;
          float fronte = uBrina * 0.8 - chiazze * 0.5 - medie * 0.62 - e * 0.42 - (n - 0.5) * 0.26 + (1.0 - bordoY) * 0.15;
          gBrina = smoothstep(0.0, 0.11, fronte) * (0.8 + 0.2 * fine);
          gScintilla = step(0.93, fine) * gBrina;
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.6, 0.7, 0.8), gBrina);
        }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.82, gBrina);
        roughnessFactor = mix(roughnessFactor, 0.07, uBagnato * (1.0 - gBrina));`)
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
        metalnessFactor = mix(metalnessFactor, 0.0, gBrina);`)
      /* tra un'aletta e l'altra la luce non arriva: il bordo esterno è chiaro, il fondo è in ombra */
      .replace('#include <opaque_fragment>', `outgoingLight *= mix(1.0, 0.03, smoothstep(-0.06, 0.4, gFondo));
        #include <opaque_fragment>`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += vec3(0.5, 0.72, 1.0) * gScintilla * 0.9 + vec3(0.2, 0.34, 0.5) * gBrina * 0.07;`);
  };
  m.customProgramCacheKey = () => 'alette-brina-volume';
  return m;
}

/* --------------------------------------------------------------------------
   PACCO DI ALETTE che disegna solo ciò che la camera vede, dalla più vicina
   alla più lontana. Le alette sono centinaia di lamine sottili viste quasi
   di taglio: se la scheda le disegna dalla più lontana, colora decine di
   volte lo stesso punto. Da davanti a dietro, quelle nascoste vengono
   scartate dal test di profondità prima di calcolarne la luce.
   -------------------------------------------------------------------------- */
function creaPacco(nome, geo, materiale, matrici, ordine) {
  const mesh = new THREE.InstancedMesh(geo, materiale, Math.max(1, matrici.length));
  mesh.name = nome;
  mesh.frustumCulled = false;                  // la selezione la facciamo noi, aletta per aletta
  mesh.renderOrder = ordine;
  mesh.castShadow = mesh.receiveShadow = true;
  matrici.forEach((m, i) => mesh.setMatrixAt(i, m));
  mesh.count = matrici.length;
  mesh.instanceMatrix.needsUpdate = true;
  geo.computeBoundingBox();
  mesh.userData.matrici = matrici;
  mesh.userData.scatole = matrici.map((m) => geo.boundingBox.clone().applyMatrix4(m));
  return mesh;
}
const _fr = new THREE.Frustum(), _pv = new THREE.Matrix4(), _sc = new THREE.Box3(), _cv = new THREE.Vector3(), _cc = new THREE.Vector3();
function selezionaPacco(mesh, scelte) {
  const { matrici, scatole } = mesh.userData;
  scelte.length = 0;
  for (let i = 0; i < matrici.length; i++) {
    _sc.copy(scatole[i]).applyMatrix4(mesh.matrixWorld);
    if (!_fr.intersectsBox(_sc)) continue;
    scelte.push({ i, d: _sc.getCenter(_cc).distanceToSquared(_cv) });
  }
  scelte.sort((a, b) => a.d - b.d);
  for (let k = 0; k < scelte.length; k++) mesh.setMatrixAt(k, matrici[scelte[k].i]);
  mesh.count = scelte.length;
  mesh.instanceMatrix.needsUpdate = true;
  return scelte.length;
}

export function esterna({ dettaglio = 1 } = {}) {
  const { W, D, H, y0, xVentola: xf } = MISURE;
  const cy = y0 + H / 2;
  const uniformi = { uBrina: { value: 0 }, uBagnato: { value: 0 } };
  const scura = 'lamieraScura';

  /* ---------- basamento ---------- */
  const basamento = gruppo('basamento', [
    pezzo([
      tr(scatola(W, 0.03, D, 0.008), [0, y0 - 0.015, 0]),
      tr(scatola(0.07, 0.06, D + 0.08, 0.012), [-0.36, 0.03, 0]),
      tr(scatola(0.07, 0.06, D + 0.08, 0.012), [0.36, 0.03, 0])
    ], scura),
    pezzo([tr(scatola(0.004, H - 0.02, D - 0.04, 0.001, 1), [0.225, cy, 0])], 'interno'),
    pezzo([
      tr(cilindro(0.012, 0.012, 6), [-0.36, 0.064, D / 2 + 0.02]), tr(cilindro(0.012, 0.012, 6), [0.36, 0.064, D / 2 + 0.02]),
      tr(cilindro(0.012, 0.012, 6), [-0.36, 0.064, -D / 2 - 0.02]), tr(cilindro(0.012, 0.012, 6), [0.36, 0.064, -D / 2 - 0.02])
    ], 'zincato')
  ]);

  /* ---------- mantello: frontale, coperchio, fianco ---------- */
  const R = 0.3;
  const frontale = gruppo('frontale', [
    pezzo([
      tr(lastra(W, H, 0.012, 0.014, [{ tipo: 'cerchio', x: xf, y: 0, r: R }]), [0, cy, D / 2 - 0.006]),
      tr(anello(R + 0.012, 0.007, 96, 10), [xf, cy, D / 2 + 0.001]),
      tr(scatola(0.03, H, 0.03, 0.008), [-W / 2 + 0.015, cy, -D / 2 + 0.015])
    ], scura),
    pezzo([
      tr(grigliaRaggi({ R: R + 0.004, rMozzo: 0.055, raggi: dettaglio ? 48 : 28, bombatura: 0.028 }), [xf, cy, D / 2 + 0.002]),
      tr(scatola(0.004, H - 0.07, 0.004, 0.001, 1), [0.205, cy, D / 2 + 0.001]),
      tr(scatola(0.11, 0.012, 0.004, 0.002, 1), [0.39, y0 + 0.1, D / 2 + 0.001])
    ], 'plasticaNera')
  ]);
  /* imbocco della ventola dietro il foro */
  const imbocco = pezzo([tr(tornio([[R, 0], [R - 0.018, -0.02], [R - 0.022, -0.07]], 72), [xf, cy, D / 2 - 0.006], [Math.PI / 2, 0, 0])],
    matCopia('lamieraScura', { side: THREE.DoubleSide }));
  frontale.add(imbocco);

  const coperchio = gruppo('coperchio', [pezzo([tr(scatola(W + 0.016, 0.024, D + 0.016, 0.01), [0, y0 + H + 0.012, 0])], scura)]);

  const fianco = gruppo('fianco', [
    pezzo([
      tr(lastra(D - 0.004, H, 0.01, 0.012), [W / 2 - 0.005, cy, 0], [0, Math.PI / 2, 0]),
      tr(lastra(0.345, H, 0.01, 0.012), [0.3875, cy, -D / 2 + 0.005]),
      tr(feritoie(0.22, 0.2, 9, 0.008, 0.55), [W / 2 + 0.001, cy + 0.16, 0], [0, Math.PI / 2, 0])
    ], scura),
    pezzo([tr(scatola(0.006, 0.034, 0.11, 0.003, 2), [W / 2 + 0.001, y0 + 0.2, 0])], 'plasticaNera')
  ]);

  /* ---------- ventola ---------- */
  const pale = pezzo(ventola({ r0: 0.06, r1: R - 0.03, pale: 3 }), matCopia('plasticaNera', { side: THREE.DoubleSide, color: 0x1a1d21, roughness: 0.32 }), 'pale');
  pale.position.set(xf, cy, D / 2 - 0.085);
  const gVentola = gruppo('ventola', [
    pale,
    pezzo([
      tr(cilindro(0.062, 0.11, 40), [xf, cy, D / 2 - 0.17], [Math.PI / 2, 0, 0]),
      tr(scatola(0.026, H - 0.03, 0.008, 0.002, 1), [xf - 0.1, cy, D / 2 - 0.215]),
      tr(scatola(0.026, H - 0.03, 0.008, 0.002, 1), [xf + 0.1, cy, D / 2 - 0.215]),
      tr(scatola(0.24, 0.03, 0.008, 0.002, 1), [xf, cy, D / 2 - 0.222])
    ], 'zincato')
  ]);

  /* ---------- scambiatore: alette + tubi di rame ---------- */
  const altA = 0.7, profA = 0.044, spA = 0.00028;
  const passoA = dettaglio === 2 ? 0.0026 : dettaglio === 1 ? 0.0045 : 0.008;
  const zc = -D / 2 + 0.034, xc = -W / 2 + 0.034;
  const retro = { da: -0.5, a: 0.2 }, lato = { da: -0.165, a: 0.168 };
  const nR = Math.floor((retro.a - retro.da) / passoA), nL = Math.floor((lato.a - lato.da) / passoA);
  const geoAletta = new THREE.BoxGeometry(spA, altA, profA);
  const ruotaY = new THREE.Matrix4().makeRotationY(Math.PI / 2);
  const tutte = [];
  for (let i = 0; i < nR; i++) tutte.push(new THREE.Matrix4().makeTranslation(retro.da + i * passoA, cy, zc));
  for (let i = 0; i < nL; i++) tutte.push(new THREE.Matrix4().makeTranslation(xc, cy, lato.da + i * passoA).multiply(ruotaY));
  /* Tutte le alette tengono il materiale fisico con i riflessi anisotropi.
     Provato l'11/11 sulla GT 710: metterne solo 36 col materiale completo e le
     altre col materiale standard faceva risparmiare circa 1 ms per fotogramma,
     ma scuriva la macro in modo visibile (luminosità 0,47 invece di 0,56).
     Il peso vero era la brina calcolata a ogni fotogramma, non i riflessi. */
  const pacchi = [creaPacco('alette', geoAletta, materialeAlette(uniformi, altA, profA), tutte, dettaglio === 2 ? -3 : 0)];
  const sceltePacchi = pacchi.map(() => []);
  /** Da chiamare dopo aver mosso la camera: tiene solo le alette inquadrate, dalla più vicina. */
  function selezionaAlette(camera) {
    camera.updateMatrixWorld();
    _pv.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    _fr.setFromProjectionMatrix(_pv);
    _cv.setFromMatrixPosition(camera.matrixWorld);
    let n = 0;
    pacchi.forEach((p, k) => { p.updateMatrixWorld(); n += selezionaPacco(p, sceltePacchi[k]); });
    return n;
  }
  /** Rimette tutte le alette nell'ordine di partenza (serve solo alle prove di confronto). */
  function tutteAlette() {
    pacchi.forEach((p) => { p.userData.matrici.forEach((m, i) => p.setMatrixAt(i, m)); p.count = p.userData.matrici.length; p.instanceMatrix.needsUpdate = true; });
  }

  const rame = [];
  const file = dettaglio === 2 ? 27 : dettaglio === 1 ? 14 : 8;
  const passoT = (altA - 0.05) / (file - 1);
  const ranghi = dettaglio === 2 ? [-0.011, 0.011] : [0];
  ranghi.forEach((o, k) => {
    for (let j = 0; j < file; j++) {
      const y = cy - altA / 2 + 0.025 + j * passoT + (k ? passoT / 2 : 0);
      if (y > cy + altA / 2 - 0.012) continue;
      rame.push(tubo([[0.212, y, zc + o], [xc + o, y, zc + o], [xc + o, y, 0.176]], 0.0046, 0.05, 6, 0.035));
      if (j % 2 === 0 && j + 1 < file) rame.push(tr(new THREE.TorusGeometry(passoT / 2, 0.0046, 6, 10, Math.PI), [0.212, y + passoT / 2, zc + o], [0, 0, -Math.PI / 2]));
      if (j % 2 === 1 && j + 1 < file) rame.push(tr(new THREE.TorusGeometry(passoT / 2, 0.0046, 6, 10, Math.PI), [xc + o, y + passoT / 2, 0.176], [0, -Math.PI / 2, -Math.PI / 2]));
    }
  });
  const scambiatore = gruppo('scambiatore', [
    ...pacchi,
    pezzo(rame, 'rame', 'tubi'),
    pezzo([
      tr(scatola(0.003, altA + 0.03, profA + 0.014, 0.001, 1), [0.206, cy, zc]),
      tr(scatola(profA + 0.014, altA + 0.03, 0.003, 0.001, 1), [xc, cy, 0.171])
    ], 'zincato')
  ]);

  /* ---------- compressore, circuito, quadro (solo se servono) ---------- */
  const cx = 0.4, cz = -0.02, yb = y0 + 0.022;
  let compressore = gruppo('compressore', []), circuito = gruppo('circuito', []), quadro = gruppo('quadro', []);
  let curvaCircuito = null;
  if (dettaglio >= 1) {
    const corpo = tornio([[0, 0], [0.06, 0], [0.075, 0.012], [0.078, 0.032], [0.078, 0.24], [0.0745, 0.268], [0.058, 0.294], [0.03, 0.309], [0, 0.313]], 56);
    const bottiglia = tornio([[0, 0], [0.02, 0], [0.031, 0.012], [0.031, 0.17], [0.022, 0.186], [0, 0.19]], 32);
    compressore = gruppo('compressore', [
      pezzo([
        tr(corpo, [cx, yb, cz]),
        tr(anello(0.0786, 0.0042, 72, 8), [cx, yb + 0.238, cz], [Math.PI / 2, 0, 0]),
        tr(anello(0.0784, 0.0026, 72, 8), [cx, yb + 0.036, cz], [Math.PI / 2, 0, 0]),
        tr(bottiglia, [cx - 0.118, yb + 0.05, cz + 0.03]),
        tr(scatola(0.052, 0.01, 0.045, 0.002, 1), [cx + 0.086, yb + 0.004, cz]),
        tr(scatola(0.045, 0.01, 0.052, 0.002, 1), [cx - 0.045, yb + 0.004, cz + 0.075]),
        tr(scatola(0.045, 0.01, 0.052, 0.002, 1), [cx - 0.045, yb + 0.004, cz - 0.075]),
        tr(scatola(0.012, 0.05, 0.03, 0.003, 1), [cx - 0.085, yb + 0.14, cz + 0.022])
      ], 'acciaioNero', 'cupola'),
      pezzo([
        tr(cilindro(0.016, 0.022, 20), [cx + 0.092, yb - 0.008, cz]),
        tr(cilindro(0.016, 0.022, 20), [cx - 0.048, yb - 0.008, cz + 0.082]),
        tr(cilindro(0.016, 0.022, 20), [cx - 0.048, yb - 0.008, cz - 0.082]),
        tr(scatola(0.056, 0.04, 0.05, 0.008), [cx + 0.03, yb + 0.2, cz + 0.078])
      ], 'gomma'),
      pezzo([
        tr(cilindro(0.006, 0.014, 6), [cx + 0.092, yb + 0.012, cz]),
        tr(cilindro(0.006, 0.014, 6), [cx - 0.048, yb + 0.012, cz + 0.082]),
        tr(cilindro(0.006, 0.014, 6), [cx - 0.048, yb + 0.012, cz - 0.082])
      ], 'zincato'),
      pezzo([
        tubo([[cx - 0.118, yb + 0.235, cz + 0.03], [cx - 0.118, yb + 0.285, cz + 0.03], [cx - 0.06, yb + 0.285, cz + 0.03], [cx - 0.06, yb + 0.2, cz + 0.03]], 0.0058, 0.022, 8, 0.012),
        tr(cilindro(0.0075, 0.012, 16), [cx, yb + 0.317, cz]),
        tr(anello(0.0062, 0.0022, 16, 6), [cx - 0.06, yb + 0.2, cz + 0.03], [Math.PI / 2, 0, 0])
      ], 'rame')
    ]);

    const yv = yb + 0.42;
    const pMandata = [[cx, yb + 0.318, cz], [cx, yv, cz], [cx - 0.07, yv, cz]];
    const pBatteria = [[cx - 0.1, yv + 0.03, cz], [cx - 0.14, yv + 0.03, cz], [cx - 0.14, yb + 0.6, cz], [cx - 0.14, yb + 0.6, zc], [0.214, yb + 0.6, zc]];
    const pPiastre = [[cx - 0.07, yv - 0.02, cz], [cx - 0.07, yb + 0.33, cz], [cx - 0.07, yb + 0.33, -0.15], [cx + 0.02, yb + 0.33, -0.15]];
    const pRitorno = [[cx - 0.1, yv - 0.03, cz + 0.004], [cx - 0.118, yv - 0.03, cz + 0.03], [cx - 0.118, yb + 0.3, cz + 0.03]];
    circuito = gruppo('circuito', [
      pezzo([tubo(pMandata, 0.0052, 0.03, 8, 0.012), tubo(pBatteria, 0.0052, 0.035, 8, 0.012), tubo(pPiastre, 0.0052, 0.03, 8, 0.012), tubo(pRitorno, 0.0052, 0.02, 8, 0.012),
        tr(anello(0.0058, 0.002, 16, 6), [cx, yb + 0.33, cz], [Math.PI / 2, 0, 0]),
        tr(anello(0.0058, 0.002, 16, 6), [cx - 0.14, yb + 0.5, cz], [Math.PI / 2, 0, 0])
      ], 'rame'),
      pezzo([
        tr(cilindro(0.015, 0.1, 24), [cx - 0.085, yv, cz], [0, 0, Math.PI / 2]),
        tr(cilindro(0.019, 0.07, 6), [cx + 0.01, yb + 0.1, -D / 2 - 0.012], [Math.PI / 2, 0, 0]),
        tr(cilindro(0.019, 0.07, 6), [cx + 0.1, yb + 0.3, -D / 2 - 0.012], [Math.PI / 2, 0, 0]),
        tr(cilindro(0.014, 0.1, 24), [cx + 0.01, yb + 0.1, -D / 2 - 0.02], [Math.PI / 2, 0, 0]),
        tr(cilindro(0.014, 0.1, 24), [cx + 0.1, yb + 0.3, -D / 2 - 0.02], [Math.PI / 2, 0, 0])
      ], 'ottone'),
      pezzo([tr(scatola(0.085, 0.32, 0.075, 0.004), [cx + 0.055, yb + 0.2, -0.15])], 'zincato')
    ]);
    curvaCircuito = percorso([[0.214, yb + 0.6, zc], [cx - 0.14, yb + 0.6, zc], [cx - 0.14, yb + 0.6, cz], [cx - 0.14, yv + 0.03, cz], [cx - 0.07, yv, cz], [cx, yv, cz], [cx, yb + 0.318, cz]], 0.03);

    const dissipatore = [];
    for (let i = 0; i < 9; i++) dissipatore.push(tr(scatola(0.0025, 0.1, 0.035, 0.0005, 1), [0.33 + i * 0.015, y0 + 0.655, 0.02]));
    quadro = gruppo('quadro', [
      pezzo([tr(scatola(0.29, 0.16, 0.13, 0.004), [0.39, y0 + 0.655, 0.1]), tr(scatola(0.27, 0.14, 0.004, 0.002, 1), [0.39, y0 + 0.655, 0.167])], 'zincato'),
      pezzo(dissipatore, 'alluminio'),
      pezzo([tr(cilindro(0.008, 0.02, 12), [0.3, y0 + 0.57, 0.1]), tr(cilindro(0.008, 0.02, 12), [0.34, y0 + 0.57, 0.1]), tr(cilindro(0.008, 0.02, 12), [0.38, y0 + 0.57, 0.1])], 'plasticaNera')
    ]);
  }

  const parti = { frontale, coperchio, fianco, ventola: gVentola, scambiatore, compressore, circuito, quadro, basamento };
  const direzioni = {
    frontale: [0, 0, 0.62], coperchio: [0, 0.42, 0], fianco: [0.5, 0, -0.12], ventola: [0, 0, 0.3],
    scambiatore: [-0.34, 0, -0.3], compressore: [0, 0, 0], circuito: [0, 0, 0], quadro: [0.08, 0.36, 0.05], basamento: [0, -0.14, 0]
  };
  const g = gruppo('esterna', [...Object.values(parti), ombra(1.9, 1.1, 0.6)], {
    ingombro: [W, y0 + H + 0.03, D], centro: [0, cy, 0], parti, pale, uniformi, curvaCircuito,
    selezionaAlette, tutteAlette, alette: { totali: tutte.length, mappeMs: creaMappeBrina().ms },
    ancore: {
      mantello: [0.36, y0 + 0.52, D / 2], ventola: [xf + 0.12, cy + 0.1, D / 2 - 0.085], scambiatore: [-W / 2 + 0.034, y0 + 0.6, 0.05],
      compressore: [cx, yb + 0.27, cz + 0.05], quadro: [0.39, y0 + 0.66, 0.16], basamento: [-0.2, y0 - 0.02, D / 2]
    },
    macro: { punto: [xc - 0.022, cy + 0.06, 0.02], normale: [-1, 0, 0] },
    uscitaAcqua: [cx + 0.1, yb + 0.3, -D / 2 - 0.07],
    /** e = 0 chiusa, 1 esplosa */
    esplodi(e) { for (const k in parti) parti[k].position.set(direzioni[k][0] * e, direzioni[k][1] * e, direzioni[k][2] * e); }
  });
  return g;
}
