/* ==========================================================================
   GRIP — IL PALCO: un solo renderer WebGL per tutto il sito.
   Il canvas è fisso dietro ai contenuti ed è trasparente: il colore di fondo
   è quello della pagina. Il palco decide quale scena è attiva in base alla
   sezione che sta al centro dello schermo, la crea solo quando serve e
   ferma il disegno quando nessuna scena è visibile.

   Qualità adattiva: misura i tempi di fotogramma e scende o sale a gradini
   (risoluzione, particelle, profondità di campo). I materiali restano.
   ========================================================================== */
import * as THREE from 'three';
import { creaAmbienti } from './materiali.js';

const LIVELLI = [
  { dpr: 0.55, particelle: 0.2, dof: false },
  { dpr: 0.75, particelle: 0.4, dof: false },
  { dpr: 1.0,  particelle: 0.7, dof: false },
  { dpr: 1.5,  particelle: 1.0, dof: true },
  { dpr: 2.0,  particelle: 1.0, dof: true }
];

const POST_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const POST_FRAG = /* glsl */ `
uniform sampler2D tCol, tProf; uniform vec2 uPx; uniform float uFuoco, uApertura, uVicino, uLontano;
varying vec2 vUv;
float prof(vec2 uv){ float z = texture2D(tProf, uv).x * 2.0 - 1.0; return 2.0 * uVicino * uLontano / (uLontano + uVicino - z * (uLontano - uVicino)); }
void main(){
  float d = prof(vUv);
  float coc = clamp(abs(d - uFuoco) / max(uFuoco, 0.001) * uApertura, 0.0, 1.0) * 9.0;
  vec4 c = texture2D(tCol, vUv); float tot = 1.0;
  if (coc > 0.6) {
    for (int i = 0; i < 14; i++) {
      float fi = float(i) + 0.5;
      float r = sqrt(fi / 14.0) * coc; float a = fi * 2.39996323;
      c += texture2D(tCol, vUv + vec2(cos(a), sin(a)) * r * uPx); tot += 1.0;
    }
  }
  gl_FragColor = c / tot;
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function creaPalco({ canvas, fermo = false, forzaSenzaWebgl = false }) {
  const palco = {
    ok: false, fermo, scene: [], attiva: null, tempo: 0, sporco: true, fotogrammi: 0,
    mouse: { x: 0, y: 0 }, w: 1, h: 1, mobile: false, livello: 2, tetto: 4, q: LIVELLI[2],
    tempi: [], ultimoMs: 0, alCambio: null, errori: []
  };

  let renderer = null;
  if (!forzaSenzaWebgl) {
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
    } catch (e) { palco.errori.push('WebGL non disponibile: ' + e.message); }
  }
  if (!renderer) return palco;

  palco.ok = true;
  palco.renderer = renderer;
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.info.autoReset = true;
  palco.ambienti = creaAmbienti(renderer);

  /* scheda grafica: se è debole si parte più in basso */
  try {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    palco.gpu = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : 'sconosciuta';
    if (/GT 7[0-3]0|GT 6[0-4]0|Intel\(R\) HD|SwiftShader|llvmpipe|Mali-4|Adreno \(TM\) [3-5]/i.test(palco.gpu)) { palco.livello = 1; palco.tetto = 2; }
  } catch (e) { palco.gpu = 'sconosciuta'; }

  /* --- profondità di campo (solo ai livelli alti) --- */
  let rt = null;
  const postMat = new THREE.ShaderMaterial({
    vertexShader: POST_VERT, fragmentShader: POST_FRAG, depthTest: false, depthWrite: false, transparent: true,
    blending: THREE.NoBlending,
    uniforms: { tCol: { value: null }, tProf: { value: null }, uPx: { value: new THREE.Vector2() }, uFuoco: { value: 2 }, uApertura: { value: 0 }, uVicino: { value: 0.05 }, uLontano: { value: 60 } }
  });
  const postScena = new THREE.Scene();
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat);
  quad.frustumCulled = false;
  postScena.add(quad);

  function creaRT() {
    if (rt) { rt.depthTexture.dispose(); rt.dispose(); }
    const s = renderer.getDrawingBufferSize(new THREE.Vector2());
    rt = new THREE.WebGLRenderTarget(s.x, s.y, { type: THREE.HalfFloatType, samples: 4, depthBuffer: true });
    rt.depthTexture = new THREE.DepthTexture(s.x, s.y);
    postMat.uniforms.tCol.value = rt.texture;
    postMat.uniforms.tProf.value = rt.depthTexture;
    postMat.uniforms.uPx.value.set(1 / s.x, 1 / s.y);
  }

  function misura() {
    palco.w = window.innerWidth; palco.h = window.innerHeight;
    palco.mobile = palco.w < 820;
    const massimo = palco.mobile ? 1.5 : 2;
    const dev = window.devicePixelRatio || 1;
    const dpr = Math.min(massimo, palco.q.dpr < 1 ? dev * palco.q.dpr : Math.min(dev, palco.q.dpr));
    renderer.setPixelRatio(Math.max(0.5, dpr));
    renderer.setSize(palco.w, palco.h, false);
    palco.dpr = renderer.getPixelRatio();
    if (palco.q.dof) creaRT();
    for (const s of palco.scene) if (s.ogg) { s.ogg.camera.aspect = palco.w / palco.h; s.ogg.camera.updateProjectionMatrix(); }
    palco.sporco = true;
  }

  function impostaLivello(n) {
    n = Math.max(0, Math.min(palco.tetto, n));
    if (n === palco.livello && palco.q === LIVELLI[n]) return;
    palco.livello = n; palco.q = LIVELLI[n];
    misura();
    for (const s of palco.scene) s.ogg?.qualita?.(palco.q);
  }
  palco.impostaLivello = impostaLivello;
  palco.q = LIVELLI[palco.livello];

  /* --- registro delle scene --- */
  palco.registra = (def) => { palco.scene.push({ ...def, ogg: null, inCreazione: false }); };

  const ctx = {
    palco, THREE,
    get w() { return palco.w; }, get h() { return palco.h; }, get mobile() { return palco.mobile; }, get q() { return palco.q; },
    get fermo() { return palco.fermo; }, ambienti: palco.ambienti, mouse: palco.mouse,
    /** punto 3D → pixel sullo schermo */
    proietta(v, camera, out = { x: 0, y: 0, davanti: true }) {
      const p = _v.copy(v).project(camera);
      out.x = (p.x * 0.5 + 0.5) * palco.w; out.y = (-p.y * 0.5 + 0.5) * palco.h; out.davanti = p.z < 1;
      return out;
    },
    /** pixel sullo schermo → punto 3D sul piano z = zPiano (camera che guarda lungo -Z) */
    mondoDaSchermo(camera, x, y, zPiano = 0, out = new THREE.Vector3()) {
      _v.set((x / palco.w) * 2 - 1, -(y / palco.h) * 2 + 1, 0.5).unproject(camera);
      const dir = _v.sub(camera.position).normalize();
      const t = (zPiano - camera.position.z) / dir.z;
      return out.copy(camera.position).addScaledVector(dir, t);
    },
    /** sposta il centro dell'inquadratura (frazioni di schermo): l'oggetto lascia posto al testo */
    sposta(camera, sx, sy) { camera.setViewOffset(palco.w, palco.h, -sx * palco.w, -sy * palco.h, palco.w, palco.h); }
  };
  const _v = new THREE.Vector3();
  palco.ctx = ctx;

  function crea(s) {
    if (s.ogg || s.inCreazione) return;
    s.inCreazione = true;
    try {
      const t0 = performance.now();
      s.ogg = s.crea(ctx);
      s.ogg.camera.aspect = palco.w / palco.h; s.ogg.camera.updateProjectionMatrix();
      s.ogg.qualita?.(palco.q);
      s.msCreazione = Math.round(performance.now() - t0);
    } catch (e) {
      palco.errori.push(`scena ${s.id}: ${e.message}`);
      console.error('[palco] scena ' + s.id, e);
      s.rotta = true;
    }
    s.inCreazione = false;
  }
  palco.crea = (id) => { const s = palco.scene.find((x) => x.id === id); if (s) crea(s); return s; };

  /* avanzamento di una sezione: pin = quanto si è scorso dentro (0→1), vista = quanto è passata nello schermo */
  function avanzamenti(s) {
    const out = [];
    let centro = false;
    for (let i = 0; i < s.sezioni.length; i++) {
      const el = s.sezioni[i];
      const r = el.getBoundingClientRect();
      if (palco.fermo) {
        /* movimento ridotto: niente scorrimento bloccato, ogni sezione mostra la sua posa */
        const dentro = r.top < palco.h * 0.5 && r.bottom > palco.h * 0.5;
        const vicino = r.top < palco.h * 1.6 && r.bottom > -palco.h * 0.6;
        if (dentro) centro = true;
        const sopra = r.bottom <= palco.h * 0.5;
        out.push({ pin: dentro ? (s.posa?.[i] ?? 0.5) : sopra ? 1 : 0, vista: 0.5, dentro, vicino, top: dentro || sopra ? 0 : palco.h, bottom: r.bottom, rTop: r.top, rBottom: r.bottom });
        continue;
      }
      const pin = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - palco.h)));
      const vista = Math.min(1, Math.max(0, (palco.h - r.top) / (palco.h + r.height)));
      const dentro = r.top < palco.h * 0.5 && r.bottom > palco.h * 0.5;
      const vicino = r.top < palco.h * 1.6 && r.bottom > -palco.h * 0.6;
      if (dentro) centro = true;
      out.push({ pin, vista, dentro, vicino, top: r.top, bottom: r.bottom, rTop: r.top, rBottom: r.bottom });
    }
    out.centro = centro;
    out.vicino = out.some((a) => a.vicino);
    return out;
  }

  function disegna(s, av, dt) {
    const o = s.ogg;
    if (palco.subito) av.subito = true;      // salta le transizioni morbide (prove e fotografie)
    o.aggiorna(av, palco.tempo, dt);
    const fuoco = o.fuoco;
    if (palco.q.dof && fuoco && fuoco.apertura > 0.001 && rt) {
      renderer.setRenderTarget(rt);
      renderer.clear();
      renderer.render(o.scene, o.camera);
      renderer.setRenderTarget(null);
      const u = postMat.uniforms;
      u.uFuoco.value = fuoco.distanza; u.uApertura.value = fuoco.apertura;
      u.uVicino.value = o.camera.near; u.uLontano.value = o.camera.far;
      renderer.render(postScena, postCam);
    } else {
      renderer.render(o.scene, o.camera);
    }
    palco.fotogrammi++;
  }

  let ultimo = performance.now(), finestra = 0, sommaMs = 0, buoni = 0;
  function fotogramma(ora, dtForzato) {
    const dtVero = Math.min(0.25, (ora - ultimo) / 1000);
    ultimo = ora;
    const dt = dtForzato ?? Math.min(0.05, dtVero);
    palco.tempo += dt;

    let scelta = null, avScelta = null;
    for (const s of palco.scene) {
      if (s.rotta) continue;
      const av = avanzamenti(s);
      if (av.vicino && !s.ogg) crea(s);           // si prepara poco prima di entrare
      if (av.centro && !scelta) { scelta = s; avScelta = av; }
      s.av = av;
    }
    if (scelta !== palco.attiva) {
      palco.attiva?.ogg?.esci?.();
      palco.attiva = scelta;
      scelta?.ogg?.entra?.();
      palco.sporco = true;
      palco.alCambio?.(scelta ? scelta.id : null);
    }
    if (!scelta || !scelta.ogg) return;
    /* il 3D si vede solo dentro le sue sezioni: la sezione dopo lo copre come un sipario */
    const su = Math.max(0, Math.round(Math.min(...avScelta.map((a) => a.rTop))));
    const giu = Math.max(0, Math.round(palco.h - Math.max(...avScelta.map((a) => a.rBottom))));
    const taglio = su + '|' + giu;
    if (taglio !== palco.taglio) { palco.taglio = taglio; canvas.style.clipPath = su || giu ? `inset(${su}px 0 ${giu}px 0)` : 'none'; }
    if (palco.fermo && !palco.sporco && dtForzato === undefined) return;   // movimento ridotto: si ridisegna solo se serve

    const t0 = performance.now();
    disegna(scelta, avScelta, dt);
    palco.sporco = false;
    palco.ultimoMs = performance.now() - t0;

    /* qualità adattiva (solo con animazione vera, non a passi manuali) */
    if (dtForzato === undefined && !palco.fermo && dtVero < 0.2) {
      sommaMs += dtVero * 1000; finestra++;
      if (finestra >= 50) {
        const media = sommaMs / finestra;
        palco.tempi.push(Math.round(media * 10) / 10); if (palco.tempi.length > 12) palco.tempi.shift();
        if (media > 30 && palco.livello > 0) { palco.tetto = palco.livello - 1; impostaLivello(palco.livello - 1); buoni = 0; }
        else if (media < 17.5) { if (++buoni >= 4 && palco.livello < palco.tetto) { impostaLivello(palco.livello + 1); buoni = 0; } }
        else buoni = 0;
        finestra = 0; sommaMs = 0;
      }
    }
  }

  let giro = 0;
  function ciclo(ora) { giro = requestAnimationFrame(ciclo); try { fotogramma(ora); } catch (e) { if (palco.errori.length < 20) { palco.errori.push(e.message); console.error(e); } } }
  palco.avvia = () => { if (!giro) { ultimo = performance.now(); giro = requestAnimationFrame(ciclo); } };
  palco.ferma = () => { cancelAnimationFrame(giro); giro = 0; };

  /** Avanza a mano di n fotogrammi (serve quando il pannello è nascosto e l'animazione non gira). */
  palco.passo = (n = 1, dt = 1 / 60) => { palco.sporco = true; for (let i = 0; i < n; i++) fotogramma(performance.now(), dt); return palco.stato(); };

  /**
   * Misura rapida all'avvio, mentre c'è ancora il loader: disegna qualche
   * fotogramma vero della scena che si vede e, dopo ognuno, legge un pixel
   * (così aspetta che la scheda grafica abbia finito davvero). Se il tempo
   * supera i 33 ms scende di un livello e rimisura; se sta sotto i 12 ms e
   * c'è margine, sale di uno. Al massimo 4 giri e circa un secondo.
   * Prima la qualità si accorgeva della fatica solo dopo un secondo di scatti.
   */
  palco.calibra = (n = 5) => {
    const gl = renderer.getContext(), px = new Uint8Array(4);
    palco.passo(2);                                   // crea e attiva la scena della posizione attuale
    if (!palco.attiva?.ogg) return null;
    const misura = () => {
      const t = [];
      for (let i = 0; i <= n; i++) {
        const t0 = performance.now();
        palco.passo(1);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        if (i) t.push(performance.now() - t0);         // il primo scalda la scheda, non conta
      }
      t.sort((a, b) => a - b);
      return t[Math.floor(t.length / 2)];
    };
    const inizio = performance.now(), giri = [];
    for (let k = 0; k < 4 && performance.now() - inizio < 1200; k++) {
      const ms = misura();
      giri.push({ livello: palco.livello, ms: Math.round(ms * 10) / 10 });
      if (ms > 33 && palco.livello > 0) { palco.tetto = palco.livello - 1; impostaLivello(palco.livello - 1); }
      else if (ms < 12 && palco.livello < palco.tetto) impostaLivello(palco.livello + 1);
      else break;
    }
    palco.calibrazione = { scena: palco.attiva.id, giri, livello: palco.livello, ms: Math.round(performance.now() - inizio) };
    return palco.calibrazione;
  };

  palco.stato = () => ({
    webgl: true, gpu: palco.gpu, livello: palco.livello, tetto: palco.tetto, dpr: palco.dpr, attiva: palco.attiva?.id ?? null,
    calibrazione: palco.calibrazione ?? null, fotogrammi: palco.fotogrammi, ultimoMs: Math.round(palco.ultimoMs * 10) / 10, medie: palco.tempi.slice(),
    scene: palco.scene.map((s) => ({ id: s.id, creata: !!s.ogg, rotta: !!s.rotta, ms: s.msCreazione ?? null })),
    disegni: renderer.info.render.calls, triangoli: renderer.info.render.triangles, errori: palco.errori.slice()
  });

  /**
   * Fotografia di una scena in una posa: restituisce un data URL (WebP trasparente).
   * `posa` è l'elenco degli avanzamenti (uno per sezione), da 0 a 1.
   */
  palco.scatta = (id, posa = [0.5], larg = 1600, alt = 1000, tempo = 3) => {
    const s = palco.crea(id);
    if (!s?.ogg) return null;
    const vecchi = { w: palco.w, h: palco.h, t: palco.tempo };
    renderer.setPixelRatio(1); renderer.setSize(larg, alt, false);
    palco.w = larg; palco.h = alt; palco.mobile = false; palco.tempo = tempo;
    s.ogg.camera.aspect = larg / alt; s.ogg.camera.updateProjectionMatrix();
    const av = posa.map((p, i) => ({ pin: p, vista: p, dentro: true, vicino: true, top: p > 0 || i === 0 ? 0 : alt * 2, bottom: alt })); av.centro = true; av.subito = true;
    s.ogg.entra?.();
    for (let i = 0; i < 3; i++) s.ogg.aggiorna(av, palco.tempo, 1 / 60);
    canvas.style.clipPath = 'none'; palco.taglio = '';
    renderer.render(s.ogg.scene, s.ogg.camera);
    const url = canvas.toDataURL('image/webp', 0.86);
    palco.tempo = vecchi.t;
    misura();
    return url;
  };

  window.addEventListener('pointermove', (e) => { palco.mouse.x = (e.clientX / palco.w) * 2 - 1; palco.mouse.y = (e.clientY / palco.h) * 2 - 1; }, { passive: true });
  window.addEventListener('resize', misura);
  window.addEventListener('scroll', () => { palco.sporco = true; }, { passive: true });
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); palco.errori.push('contesto WebGL perso'); });
  misura();
  return palco;
}
