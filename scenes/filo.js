/* ==========================================================================
   GRIP — IL FILO (parte 3D).
   Il filo di energia è lo stesso in tutto il sito: nasce azzurro freddo e
   diventa il giallo dell'anello GRIP. Qui ci sono:
     - coloreFilo(t): il colore del filo in un punto del racconto (0 → 1);
     - tuboFilo(curva): la luce che scorre dentro un tubo o nell'aria.
   La parte disegnata sulla pagina (la curva che lega le sezioni) è in
   js/filo-pagina.js e usa lo stesso colore.
   ========================================================================== */
import * as THREE from 'three';

/* Fusione additiva che non tocca l'alfa: il canvas è trasparente sopra la pagina,
   quindi la luce del filo si somma al colore della sezione che c'è sotto. */
export const SOMMA = {
  blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
  blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor
};

const FREDDO = new THREE.Color(0x8fd3ff);
const MEZZO = new THREE.Color(0xf3efe2);
const CALDO = new THREE.Color(0xfdce06);

/** Colore del filo: 0 = aria fredda, 1 = giallo GRIP (passando da un bianco caldo, non dal verde). */
export function coloreFilo(t, out = new THREE.Color()) {
  t = Math.min(1, Math.max(0, t));
  return t < 0.5 ? out.copy(FREDDO).lerp(MEZZO, t * 2) : out.copy(MEZZO).lerp(CALDO, (t - 0.5) * 2);
}
export const coloreFiloCss = (t) => '#' + coloreFilo(t).getHexString();

const VERT = /* glsl */ `
varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main(){
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */ `
uniform float uTesta, uCoda, uTempo, uVerso, uOnde, uForza, uBase;
uniform vec3 uColA, uColB;
varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main(){
  float s = vUv.x;
  float visibile = step(s, uTesta) * step(uCoda, s);
  if (visibile < 0.5) discard;
  float onda = pow(0.5 + 0.5 * sin((s * uOnde - uTempo * uVerso) * 6.2831853), 5.0);
  float testa = smoothstep(0.06, 0.0, uTesta - s) * step(uTesta, 0.999);
  float cuore = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
  vec3 col = mix(uColA, uColB, s);
  float i = (uBase + onda * 0.9 + testa * 1.6) * uForza;
  gl_FragColor = vec4(col * i * cuore, 1.0);
}`;

/**
 * Luce che scorre lungo una curva. `raggio` un po' più grande del tubo vero
 * se deve sembrare che scorra "dentro" (si somma alla lamiera o al rame).
 * Uniformi utili: uTesta (0→1: fin dove è arrivato), uVerso (+1/-1), uColA/uColB.
 */
export function tuboFilo(curva, raggio = 0.012, { onde = 6, base = 0.35, forza = 1, passo = 0.03, radiali = 8 } = {}) {
  const seg = Math.max(12, Math.ceil(curva.getLength() / passo));
  const g = new THREE.TubeGeometry(curva, seg, raggio, radiali, false);
  const m = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG,
    uniforms: {
      uTesta: { value: 1 }, uCoda: { value: 0 }, uTempo: { value: 0 }, uVerso: { value: 1 }, uOnde: { value: onde },
      uForza: { value: forza }, uBase: { value: base },
      uColA: { value: FREDDO.clone() }, uColB: { value: CALDO.clone() }
    },
    transparent: true, depthWrite: false, ...SOMMA
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.name = 'filo';
  mesh.renderOrder = 5;
  mesh.userData.curva = curva;
  mesh.userData.u = m.uniforms;
  return mesh;
}

/* Particelle che seguono una direzione (aria tra le alette, pioggia della doccia). */
const P_VERT = /* glsl */ `
attribute vec4 aSeme;
uniform float uTempo, uScala, uVel; uniform vec3 uDa, uA, uLargo; uniform float uOndeggia; uniform float uMin;
varying float vVita; varying float vSeme;
void main(){
  float t = fract(aSeme.w + uTempo * uVel * (0.6 + aSeme.x * 0.8));
  vec3 lato = (aSeme.xyz - 0.5) * uLargo;
  vec3 p = mix(uDa, uA, t) + lato;
  p += uOndeggia * vec3(sin(t * 9.0 + aSeme.y * 40.0), cos(t * 7.0 + aSeme.x * 31.0), sin(t * 5.0 + aSeme.z * 17.0));
  vVita = t; vSeme = aSeme.x;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = max(uMin, uScala * (0.5 + aSeme.y) / max(0.05, -mv.z));
  gl_Position = projectionMatrix * mv;
}`;
const P_FRAG = /* glsl */ `
uniform vec3 uColA, uColB; uniform float uForza;
varying float vVita; varying float vSeme;
void main(){
  vec2 c = gl_PointCoord - 0.5; float d = length(c);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d) * smoothstep(0.0, 0.12, vVita) * smoothstep(1.0, 0.8, vVita);
  gl_FragColor = vec4(mix(uColA, uColB, vVita) * a * uForza, 1.0);
}`;

/** Sciame di particelle che va dal punto `da` al punto `a`, largo `largo`. */
export function sciame(n, { da = [0, 0, 0], a = [0, 0, 1], largo = [1, 1, 0.1], scala = 6, vel = 0.2, ondeggia = 0.004, forza = 1 } = {}) {
  const g = new THREE.BufferGeometry();
  const semi = new Float32Array(n * 4);
  for (let i = 0; i < semi.length; i++) semi[i] = Math.random();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('aSeme', new THREE.BufferAttribute(semi, 4));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 50);
  const m = new THREE.ShaderMaterial({
    vertexShader: P_VERT, fragmentShader: P_FRAG,
    uniforms: {
      uTempo: { value: 0 }, uMin: { value: 1.6 }, uScala: { value: scala }, uVel: { value: vel }, uOndeggia: { value: ondeggia }, uForza: { value: forza },
      uDa: { value: new THREE.Vector3(...da) }, uA: { value: new THREE.Vector3(...a) }, uLargo: { value: new THREE.Vector3(...largo) },
      uColA: { value: FREDDO.clone() }, uColB: { value: FREDDO.clone() }
    },
    transparent: true, depthWrite: false, ...SOMMA
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  pts.name = 'sciame';
  pts.userData.u = m.uniforms;
  pts.userData.n = n;
  return pts;
}
