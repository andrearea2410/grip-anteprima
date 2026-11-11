/* ==========================================================================
   GRIP — SCENA 1 e 2: LA MACCHINA.
   Una sola scena per due sezioni, così tra l'hero e "Dentro la macchina"
   non c'è stacco:
     hero    → macro sulle alette con la brina, poi la camera arretra e
               rivela la pompa di calore monoblocco;
     dentro  → la macchina si apre in vista esplosa, il filo corre nel rame
               e si ferma sul compressore, poi tutto si richiude.
   ========================================================================== */
import * as THREE from 'three';
import { esterna } from './parts/esterna.js';
import { tuboFilo, sciame, coloreFilo } from './filo.js';
import { matCopia } from './materiali.js';

const lerp = THREE.MathUtils.lerp, clamp = THREE.MathUtils.clamp, ss = THREE.MathUtils.smoothstep;
const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const GRADI = Math.PI / 180;

export function creaMacchina(ctx) {
  const scene = new THREE.Scene();
  scene.environment = ctx.ambienti.scuro;
  const camera = new THREE.PerspectiveCamera(34, 1, 0.012, 40);

  const chiave = new THREE.DirectionalLight(0xffffff, 1.6); chiave.position.set(-3, 4, 3.5); scene.add(chiave);
  const contro = new THREE.DirectionalLight(0x9fd0ff, 2.2); contro.position.set(2.5, 2.2, -4); scene.add(contro);
  const caldo = new THREE.PointLight(0xffb347, 0, 1.6, 2); scene.add(caldo);

  const rig = new THREE.Group(); scene.add(rig);
  const unita = esterna({ dettaglio: ctx.mobile ? 1 : 2 });
  rig.add(unita);
  const U = unita.userData;
  const M = new THREE.Vector3(...U.macro.punto);      // punto della macro sulle alette
  const C = new THREE.Vector3(...U.centro);           // centro della macchina

  /* --- aria fredda tra le alette --- */
  const ariaLato = sciame(900, { da: [M.x - 0.42, C.y, 0], a: [M.x + 0.12, C.y, 0], largo: [0.02, 0.66, 0.34], scala: 0.55, vel: 0.16, ondeggia: 0.006, forza: 0.9 });
  const ariaRetro = sciame(500, { da: [-0.15, C.y, -0.75], a: [-0.15, C.y, -0.12], largo: [0.7, 0.66, 0.02], scala: 0.5, vel: 0.14, ondeggia: 0.006, forza: 0.7 });
  for (const a of [ariaLato, ariaRetro]) { a.userData.u.uColA.value.set(0x8fd3ff); a.userData.u.uColB.value.set(0xd6eeff); unita.add(a); }

  /* --- gocce quando la brina si scioglie --- */
  const N_GOCCE = 110;
  const gocce = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8),
    matCopia('cromo', { color: 0xdcecff, metalness: 0.0, roughness: 0.02, transparent: true, opacity: 0.72, envMapIntensity: 2.2, clearcoat: 1 }), N_GOCCE);
  const semiGocce = [];
  for (let i = 0; i < N_GOCCE; i++) semiGocce.push({ z: (Math.random() - 0.5) * 0.24, y: (Math.random() - 0.5) * 0.2, r: 0.0009 + Math.random() * 0.0016, v: 0.4 + Math.random(), f: Math.random() });
  gocce.frustumCulled = false;
  unita.add(gocce);
  const mG = new THREE.Matrix4(), pG = new THREE.Vector3(), sG = new THREE.Vector3(), qG = new THREE.Quaternion();

  /* --- il filo: nel circuito di rame, e fuori dal lato dell'acqua (caldo) --- */
  const filoCircuito = U.curvaCircuito ? tuboFilo(U.curvaCircuito, 0.0085, { onde: 5, base: 0.5, forza: 1.6, passo: 0.012 }) : null;
  if (filoCircuito) { U.parti.circuito.add(filoCircuito); filoCircuito.userData.u.uTesta.value = 0; coloreFilo(0.25, filoCircuito.userData.u.uColA.value); coloreFilo(0.75, filoCircuito.userData.u.uColB.value); }
  const u0 = new THREE.Vector3(...U.uscitaAcqua);
  const curvaCalda = new THREE.CatmullRomCurve3([u0, u0.clone().add(new THREE.Vector3(0, 0, -0.3)), new THREE.Vector3(1.05, 0.3, -0.62), new THREE.Vector3(1.6, 0.12, 0.1), new THREE.Vector3(2.3, -0.5, 1.0), new THREE.Vector3(3.2, -1.4, 1.6)]);
  const filoCaldo = tuboFilo(curvaCalda, 0.009, { onde: 7, base: 0.45, forza: 1.5 });
  coloreFilo(0.55, filoCaldo.userData.u.uColA.value); coloreFilo(1, filoCaldo.userData.u.uColB.value);
  filoCaldo.userData.u.uTesta.value = 0;
  unita.add(filoCaldo);

  /* --- etichette della vista esplosa (elementi HTML che seguono i pezzi) --- */
  const etichette = [...document.querySelectorAll('[data-ancora]')].map((el) => ({ el, v: new THREE.Vector3(...(U.ancore[el.dataset.ancora] || [0, 0, 0])), parte: el.dataset.ancora === 'mantello' ? 'frontale' : el.dataset.ancora }));
  const pS = { x: 0, y: 0, davanti: true }, vTmp = new THREE.Vector3();

  /* --- stato --- */
  let hs = 0, ds = 0, es = 0, mx = 0, my = 0, primo = true;
  const bersaglio = new THREE.Vector3(), posCam = new THREE.Vector3();
  const fuoco = { distanza: 0.13, apertura: 0.3 };
  const dentroTgt = new THREE.Vector3(0.4, 0.31, -0.02);   // la cupola del compressore

  function sferica(out, centro, r, az, el) {
    return out.set(centro.x + r * Math.sin(az) * Math.cos(el), centro.y + r * Math.sin(el), centro.z + r * Math.cos(az) * Math.cos(el));
  }

  function aggiorna(av, t, dt) {
    const h = av[0].pin, d = av[1] ? av[1].pin : 0;
    const arrivo = av[1] ? clamp((ctx.h - av[1].top) / ctx.h, 0, 1) : 0;   // la sezione "dentro" sta salendo
    const k = primo || av.subito || ctx.fermo ? 1 : Math.min(1, dt * 5.5);
    primo = false;
    hs = lerp(hs, h, k); ds = lerp(ds, d, k); es = lerp(es, arrivo, k);

    /* ---------- brina: cresce, resta, si scioglie, asciuga ---------- */
    const ciclo = ctx.fermo ? 5.2 : (t + 2.2) % 15;
    let brina, bagnato, fusione = 0;
    if (ciclo < 6.5) { brina = Math.pow(ciclo / 6.5, 0.8); bagnato = 0; }
    else if (ciclo < 8) { brina = 1; bagnato = 0; }
    else if (ciclo < 11.5) { fusione = (ciclo - 8) / 3.5; brina = 1 - inOut(fusione); bagnato = ss(fusione, 0, 0.5); }
    else { brina = 0; bagnato = 1 - ss(ciclo, 11.5, 15); fusione = 1; }
    U.uniformi.uBrina.value = brina;
    U.uniformi.uBagnato.value = bagnato;
    const mostraGocce = hs < 0.6 && (fusione > 0 || bagnato > 0);
    gocce.visible = mostraGocce;
    if (mostraGocce) {
      const n = Math.round(N_GOCCE * ctx.q.particelle);
      gocce.count = n;
      for (let i = 0; i < n; i++) {
        const g = semiGocce[i];
        const nasce = clamp((fusione - g.f * 0.6) / 0.4, 0, 1);
        const cade = Math.max(0, fusione - g.f * 0.6 - 0.25) * g.v * 0.05 + (1 - bagnato) * (ciclo > 11.5 ? 0.03 * g.v : 0);
        const s = g.r * nasce * (ciclo > 11.5 ? bagnato : 1);
        pG.set(M.x - 0.0006, M.y + g.y - cade, M.z + g.z);
        sG.set(s, s * (1 + cade * 12), s);
        gocce.setMatrixAt(i, mG.compose(pG, qG, sG));
      }
      gocce.instanceMatrix.needsUpdate = true;
    }

    /* ---------- aria e ventola ---------- */
    ariaLato.userData.u.uTempo.value = t; ariaRetro.userData.u.uTempo.value = t;
    ariaLato.geometry.setDrawRange(0, Math.round(900 * ctx.q.particelle));
    ariaRetro.geometry.setDrawRange(0, Math.round(500 * ctx.q.particelle));
    if (!ctx.fermo) U.pale.rotation.z -= dt * 7.5;

    /* ---------- camera dell'hero: dalla macro alla macchina intera ---------- */
    const a = inOut(clamp((hs - 0.1) / 0.78, 0, 1));
    const mob = ctx.mobile;
    const r = 0.13 * Math.pow((mob ? 3.5 : 2.75) / 0.13, a);
    /* nella macro la camera guarda le alette quasi di taglio (si vedono le lamelle una per una), poi gira verso il fronte */
    const az = lerp(-81, -36, a) * GRADI - 14 * GRADI * Math.sin(Math.PI * a) + Math.sin(t * 0.25) * 0.012 * (1 - a);
    const el = 9 * GRADI + 7 * GRADI * Math.sin(Math.PI * a) + Math.cos(t * 0.2) * 0.008 * (1 - a);
    bersaglio.copy(M).lerp(C, ss(a, 0.02, 0.75));
    sferica(posCam, bersaglio, r, az, el);
    let sx = lerp(0, mob ? 0 : 0.17, ss(a, 0.25, 1)), sy = lerp(0, mob ? -0.1 : 0.02, ss(a, 0.25, 1));
    fuoco.distanza = r; fuoco.apertura = lerp(0.3, 0.035, ss(a, 0.0, 0.6));

    /* ---------- "dentro la macchina" ---------- */
    const entra = inOut(es);
    const esplosa = inOut(clamp((ds - 0.04) / 0.24, 0, 1)) * (1 - inOut(clamp((ds - 0.84) / 0.14, 0, 1)));
    const vicino = inOut(clamp((ds - 0.4) / 0.2, 0, 1)) * (1 - inOut(clamp((ds - 0.82) / 0.14, 0, 1)));
    U.esplodi(ctx.fermo && av[1]?.dentro ? 1 : esplosa);
    if (entra > 0) {
      const azD = lerp(-30, -18, ss(ds, 0.05, 0.4)) * GRADI, rD = mob ? 4.3 : 3.5;
      const p2 = sferica(vTmp, C, rD, azD, 15 * GRADI);
      posCam.lerp(p2, entra); bersaglio.lerp(C, entra);
      sx = lerp(sx, 0, entra); sy = lerp(sy, mob ? -0.06 : 0, entra);
      fuoco.distanza = lerp(fuoco.distanza, rD, entra); fuoco.apertura = lerp(fuoco.apertura, 0.02, entra);
    }
    if (vicino > 0) {
      const azV = lerp(24, 44, ss(ds, 0.5, 0.84)) * GRADI, rV = mob ? 0.9 : 0.66;
      const p3 = sferica(vTmp, dentroTgt, rV, azV, 13 * GRADI);
      posCam.lerp(p3, vicino); bersaglio.lerp(dentroTgt, vicino);
      sx = lerp(sx, mob ? 0 : 0.16, vicino); sy = lerp(sy, mob ? -0.14 : 0, vicino);
      fuoco.distanza = lerp(fuoco.distanza, rV, vicino); fuoco.apertura = lerp(fuoco.apertura, 0.14, vicino);
    }
    if (ds > 0.9) { const fine = inOut(clamp((ds - 0.9) / 0.1, 0, 1)); sx = lerp(sx, 0, fine); }
    camera.position.copy(posCam);
    camera.lookAt(bersaglio);
    ctx.sposta(camera, sx, sy);

    /* inclinazione morbida col mouse (non nella macro, dove sposterebbe l'inquadratura) */
    const quanto = ss(a, 0.4, 1) * (1 - vicino) * (ctx.fermo ? 0 : 1);
    mx = lerp(mx, ctx.mouse.x * quanto, Math.min(1, dt * 3)); my = lerp(my, ctx.mouse.y * quanto, Math.min(1, dt * 3));
    rig.rotation.y = mx * 0.16; rig.rotation.x = my * 0.05;
    rig.updateMatrixWorld();
    /* solo le alette inquadrate, dalla più vicina (le prove di confronto possono spegnerlo) */
    if (!ctx.palco.prova?.senzaSelezione) U.selezionaAlette(camera);

    /* ---------- il filo ---------- */
    filoCaldo.userData.u.uTempo.value = t * 0.35;
    filoCaldo.userData.u.uTesta.value = ss(hs, 0.5, 0.95) * (1 - ss(ds, 0.02, 0.12));
    filoCaldo.visible = filoCaldo.userData.u.uTesta.value > 0.001;
    if (filoCircuito) {
      const corsa = ss(ds, 0.3, 0.56);
      filoCircuito.userData.u.uTesta.value = corsa * (1 - ss(ds, 0.86, 0.94));
      filoCircuito.userData.u.uTempo.value = t * 0.5;
      filoCircuito.visible = filoCircuito.userData.u.uTesta.value > 0.001;
      caldo.intensity = ss(ds, 0.52, 0.6) * (1 - ss(ds, 0.84, 0.92)) * 0.35;
      caldo.position.set(0.42, 0.52, 0.16);
    }

    /* ---------- etichette ---------- */
    const visEt = (ctx.fermo && av[1]?.dentro ? 1 : ss(esplosa, 0.75, 1)) * (1 - ss(vicino, 0.0, 0.35));
    for (let i = 0; i < etichette.length; i++) {
      const e = etichette[i];
      if (visEt < 0.01) { if (e.vis !== 0) { e.el.style.opacity = '0'; e.vis = 0; } continue; }
      const parte = U.parti[e.parte];
      vTmp.copy(e.v); if (parte) vTmp.add(parte.position);
      vTmp.applyMatrix4(unita.matrixWorld);
      ctx.proietta(vTmp, camera, pS);
      e.el.style.transform = `translate3d(${pS.x.toFixed(1)}px, ${pS.y.toFixed(1)}px, 0)`;
      const o = clamp(visEt * 1.6 - i * 0.1, 0, 1);
      e.el.style.opacity = o.toFixed(2); e.vis = o;
    }
  }

  return {
    scene, camera, fuoco, aggiorna,
    oggetti: { unita },
    esci() { for (const e of etichette) { e.el.style.opacity = '0'; e.vis = 0; } }
  };
}
