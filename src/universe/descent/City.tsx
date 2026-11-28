import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { hash, noise3 } from '../glsl'
import { J, smooth } from '../journey'
import type { Quality } from '../quality'
import { U, mulberry } from '../shared'

// La ciudad de noche, en metros y en manzanas de 120 m como las de acá: calles con faroles, casas bajas, algunas torres,
// autos con estela, una laguna y un puente colgante. Todo procedural. El monitor está en el origen, en un octavo piso: el suelo queda abajo.

const G = -24.3
/** Calles: centros en x = 60 + 120 i, z = 14 + 120 j. */
const CELL = 120, SX = 60, SZ = 14
/** Fachada de nuestro edificio. */
const FZ = 3.535
const shore = (x: number) => -760 + Math.sin(x * 0.0042) * 70 + Math.sin(x * 0.0013 + 2) * 90
const SHORE = /* glsl */ `float shore(float x){ return -760. + sin(x * .0042) * 70. + sin(x * .0013 + 2.) * 90.; }
float water(vec2 p){ float s = shore(p.x); return smoothstep(0., -4., p.y - s) * smoothstep(-404., -400., p.y - s); }`

const fog = /* glsl */ `
vec3 haze(vec3 dir){
  float h = max(dir.y, 0.);
  // el alumbrado tiñe el cielo: naranja sodio pegado al horizonte, violeta más arriba y negro en el cenit
  return mix(mix(vec3(.115, .056, .03), vec3(.032, .026, .052), smoothstep(0., .08, h)), vec3(.004, .007, .022), smoothstep(.04, .36, h));
}
vec3 applyFog(vec3 c, vec3 w){
  vec3 d = w - cameraPosition; float l = length(d);
  // la niebla baja está iluminada por la ciudad
  vec3 hz = haze(d / l) + vec3(.034, .016, .007) * exp(-max(w.y - (${G.toFixed(1)}), 0.) / 70.);
  return mix(c, hz, 1. - exp(-pow(l * .00027, 1.5)));
}`

const groundVertex = /* glsl */ `varying vec3 vW; void main(){ vec4 p = vec4(position, 1.);
#ifdef USE_INSTANCING
  p = instanceMatrix * p;
#endif
  vec4 w = modelMatrix * p; vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`
const groundFragment = /* glsl */ `
varying vec3 vW;
${hash}
${noise3}
${SHORE}
${fog}
// un farol cada 30 m a lo largo de la calle
float pools(vec2 q){ q.x = mod(q.x + 15., 30.) - 15.; q.y = abs(q.y) - 5.; return exp(-dot(q, q) / 80.) + .9 * exp(-dot(q, q) / 14.); }
void main(){
  vec2 p = vW.xz;
  if(water(p) > .5) discard;
  float far = length(vW - cameraPosition), aa = smoothstep(260., 900., far);
  vec2 s = vec2(mod(p.x, 120.) - 60., mod(p.y - 14. + 60., 120.) - 60.);
  vec2 id = floor(vec2(p.x / 120., (p.y - 14. + 60.) / 120.));
  vec2 b = floor(vec2((p.x + 60.) / 120., (p.y - 14.) / 120.));
  vec2 d = abs(s);
  float av = step(.8, hash11(id.x * 3.7 + 1.)), ah = step(.8, hash11(id.y * 5.1 + 9.));
  float city = smoothstep(3600., 2200., length(p - vec2(0., 500.))) * step(shore(p.x), p.y);
  float road = 1. - smoothstep(6.5, 7.2, min(d.x - av * 3., d.y - ah * 3.));
  vec3 asphalt = vec3(.030, .031, .034) * (.8 + .4 * hash21(floor(p * 1.3)) * (1. - aa));
  float h = hash21(floor(p / 9.) + b * 17.);
  // manzana: techos, patios y baldíos
  vec3 roof = mix(vec3(.020, .018, .018), vec3(.055, .038, .030), h) * (.6 + .8 * hash21(floor(p / 4.5)));
  float green = smoothstep(.62, .7, hash21(b + 3.));
  bool plaza = abs(b.x) < .5 && abs(b.y) < .5;
  if(plaza) green = 1.;
  vec3 grass = vec3(.012, .022, .012) * (.8 + .5 * vnoise(vec3(p * .2, 1.)));
  vec3 alb = mix(mix(roof, grass, green), vec3(.085, .08, .075), step(min(d.x, d.y), 10.));
  // senderos de la plaza
  if(plaza){ vec2 pc = p - vec2(0., 74.); float dg = min(abs(abs(pc.x) - abs(pc.y)), min(abs(length(pc) - 16.), min(abs(pc.x), abs(pc.y)))); alb = mix(vec3(.12, .10, .08), alb, smoothstep(1.4, 2., dg)); }
  alb = mix(alb, asphalt, road);
  // líneas
  if(aa < .9){ float line = (1. - smoothstep(.1, .25, min(d.x, d.y))) * step(.5, fract((d.x < d.y ? p.y : p.x) / 6.)) * road; alb = mix(alb, vec3(.22), line * .6 * (1. - aa)); }
  float lv = pools(vec2(p.y, s.x)), lh = pools(vec2(p.x, s.y));
  lv = mix(lv, exp(-d.x * d.x / 150.) * .5, aa); lh = mix(lh, exp(-d.y * d.y / 150.) * .5, aa);
  vec3 warm = vec3(1., .56, .22), led = vec3(.85, .92, 1.);
  vec3 cv = mix(warm, led, step(.74, hash11(id.x * 7.3)) * .8) * (1. + av * 1.3), ch = mix(warm, led, step(.74, hash11(id.y * 4.9 + 2.)) * .8) * (1. + ah * 1.3);
  // barrios más y menos iluminados
  float hood = .35 + 1.1 * smoothstep(.25, .75, vnoise(vec3(p * .0031, 7.))) , hs = mix(1., hood * (.55 + .7 * vnoise(vec3(p * .02, 3.))), aa);
  cv *= hs; ch *= hs;
  vec3 light = (cv * lv + ch * lh) * city;
  vec3 col = alb * (light * 8. + vec3(.16, .26, .56) + warm * .30 * city);
  // resplandor que se ve desde lejos: el asfalto iluminado
  col += (cv * exp(-d.x * d.x / 26.) + ch * exp(-d.y * d.y / 26.)) * .30 * aa * city;
  // patios con luz
  float spark = step(.90, hash21(floor(p / 7.))) * (1. - road) * city * (1. - green);
  vec2 f = fract(p / 7.) - .5;
  col += mix(warm, led, hash21(floor(p / 7.) + 9.) * .6) * spark * exp(-dot(f, f) * 22.) * 1.1;
  // costanera
  col += warm * exp(-pow(abs((p.y - shore(p.x) - 8.) / 9.), 2.)) * .09;
  gl_FragColor = vec4(applyFog(col, vW), 1.);
}`

const waterFragment = /* glsl */ `
varying vec3 vW; uniform float uTime;
${hash}
${noise3}
${SHORE}
${fog}
void main(){
  vec2 p = vW.xz;
  if(water(p) < .5) discard;
  vec3 V = normalize(cameraPosition - vW);
  float wl = smoothstep(2200., 300., length(vW - cameraPosition));
  float n = (vnoise(vec3(p * .05, uTime * .25)) + .5 * vnoise(vec3(p * .13, uTime * .4))) * (.25 + .75 * wl);
  vec3 N = normalize(vec3(n * .10, 1., n * .07));
  vec3 H = normalize(V + normalize(vec3(-.3, .35, -.8)));
  float moon = pow(max(dot(N, H), 0.), 90.) * .22;
  vec3 col = vec3(.004, .009, .022) + vec3(.45, .62, 1.) * moon;
  // reflejo de la ciudad cerca de la orilla
  float sd = shore(p.x) - p.y;
  col += vec3(1., .55, .22) * .05 * exp(-sd / 60.) * (.6 + .8 * vnoise(vec3(p.x * .12, p.y * .012, uTime * .3)));
  gl_FragColor = vec4(applyFog(col, vW), .72);
}`

const boxVertex = /* glsl */ `
attribute vec4 aS; // semilla, piso de planta baja, tono, altura
// flat: la semilla entra en un hash, y la interpolación le cambia el último bit de un píxel a otro (ventanas con ruido)
varying vec3 vW; varying vec3 vNw; flat varying vec4 vS; varying vec2 vF;
void main(){
  vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.);
  vW = w.xyz; vNw = normalize(mat3(instanceMatrix) * (normal / vec3(dot(instanceMatrix[0].xyz, instanceMatrix[0].xyz), dot(instanceMatrix[1].xyz, instanceMatrix[1].xyz), dot(instanceMatrix[2].xyz, instanceMatrix[2].xyz))));
  vS = aS;
  vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
  vF = abs(normal.x) > .5 ? vec2((position.z + .5) * sc.z, (position.y + .5) * sc.y) : vec2((position.x + .5) * sc.x, (position.y + .5) * sc.y);
  gl_Position = projectionMatrix * viewMatrix * w;
}`
/** Ventanas: pocas con luz. `cell` es el tamaño de cada vano y `lit` qué fracción está encendida. */
const facade = /* glsl */ `
float pane(vec2 f, vec2 lo, vec2 hi, float w){ vec2 a = smoothstep(lo - w, lo + w, f) * smoothstep(hi + w, hi - w, f); return a.x * a.y; }
vec3 street(float y){ return vec3(1., .56, .24) * (exp(-max(y - ${G.toFixed(1)}, 0.) / 7.) * .95 + .10); }`
const boxFragment = /* glsl */ `
varying vec3 vW; varying vec3 vNw; flat varying vec4 vS; varying vec2 vF;
uniform float uTime;
${hash}
${fog}
${facade}
void main(){
  vec3 n = normalize(vNw), col;
  vec3 plaster = mix(vec3(.16, .14, .12), vec3(.30, .27, .24), vS.z);
  float far = length(vW - cameraPosition);
  if(n.y > .5){
    vec2 q = floor(vW.xz / 2.2);
    col = plaster * vec3(.055, .085, .17) * (.5 + .55 * hash21(q));
    // algunas terrazas con claraboya o luz de escalera
    col += vec3(1., .62, .3) * step(.985, hash21(floor(vW.xz / 3.) + vS.x * 7.)) * .5;
  } else {
    // la normal interpolada no es exacta: se redondea antes de que entre en el hash
    float side = floor(n.x + .5) * 3. + floor(n.z + .5);
    vec2 cell = vec2(3.4, 3.1), id = floor(vF / cell), f = fract(vF / cell);
    float w = clamp(fwidth(vF.y) * .35, .02, .5);
    float win = pane(f, vec2(.24, .3), vec2(.76, .74), w) * step(1.2, vF.y) * step(vF.y, vS.w - .9) * (1. - smoothstep(380., 900., far) * .5);
    float r = hash21(id + vS.x * 91. + side * 7.);
    // vS.y = cuánta gente hay despierta en este edificio; en algunas torres quedan pisos de oficina enteros encendidos
    float office = step(20., vS.w) * step(.6, hash11(vS.x * 53.)) * step(.66, hash21(vec2(id.y, vS.x * 37. + side)));
    float on = max(step(1. - vS.y, r), office * step(.1, r));
    float kind = hash21(id + vS.x * 13.);
    vec3 lamp = kind < .5 ? vec3(1., .6, .26) : kind < .78 ? vec3(1., .8, .55) : kind < .93 ? vec3(.78, .86, 1.) : vec3(.38, .52, 1.) * (.6 + .4 * sin(uTime * 7. + r * 40.) * sin(uTime * 1.9 + r * 9.));
    lamp = mix(lamp, vec3(.86, .92, 1.), office);
    float curtain = step(.55, hash21(id + 3.1 + vS.x)) * (1. - office);
    col = plaster * (street(vW.y) * (.55 + .45 * abs(n.z)) * .8 + vec3(.040, .056, .105) * (1. + max(dot(n, normalize(vec3(-.3, .35, -.8))), 0.) * 1.6));
    // el resplandor naranja del cielo también pega en las paredes
    col += plaster * vec3(.05, .025, .012);
    // losas, pilares entre vanos, base más oscura y remate de la terraza
    col *= 1. - .3 * step(.97, fract(vF.y / 3.1));
    col *= 1. - .22 * (1. - smoothstep(0., .07, min(f.x, 1. - f.x))) * (1. - smoothstep(300., 700., far));
    col *= .5 + .5 * smoothstep(0., 4.5, vF.y);
    col = mix(col, col * 1.6 + vec3(.012, .009, .007), smoothstep(vS.w - .7, vS.w - .5, vF.y));
    col = mix(col, vec3(.010, .014, .022), win);
    vec3 light = lamp * on * mix(1., .4, curtain) * (.3 + .7 * hash21(id + 4.)) * 1.35;
    col += light * win;
    // la luz de la ventana se derrama un poco sobre el revoque
    vec2 g = (f - vec2(.5, .52)) * vec2(1., 1.15);
    col += light * plaster * exp(-dot(g, g) * 9.) * .5 * (1. - win) * step(1.2, vF.y);
  }
  gl_FragColor = vec4(applyFog(col, vW), 1.);
}`

// nuestro edificio: el mismo vano que la habitación (4,3 m de ancho, 2,9 de alto); el hueco de la ventana abierta se recorta
const homeVertex = /* glsl */ `varying vec3 vW; varying vec3 vNw; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vNw = normal; gl_Position = projectionMatrix * viewMatrix * w; }`
const homeFragment = /* glsl */ `
varying vec3 vW; varying vec3 vNw;
${hash}
${noise3}
${fog}
${facade}
void main(){
  vec3 n = normalize(vNw);
  vec3 plaster = vec3(.30, .26, .22) * (.85 + .25 * vnoise(vec3(vW.xy * .7, vW.z)));
  vec3 col;
  if(n.y > .5) col = plaster * vec3(.10, .12, .17);
  else {
    float front = step(.5, n.z);
    float u = front > .5 ? vW.x : vW.z + 4.;
    float fl = floor((vW.y + 1.12) / 2.9), y = mod(vW.y + 1.12, 2.9);
    float bay = floor((u + 2.15) / 4.3), x = u - bay * 4.3;
    float w = clamp(fwidth(vW.y), .004, .3);
    bool ours = front > .5 && bay == 0. && fl == 0.;
    vec2 q = vec2(x, y);
    float win = pane(q, vec2(-.95, .84), vec2(.95, 2.28), w);
    if(ours && win > .5) discard;
    float lip = pane(q, vec2(-1.08, .70), vec2(1.08, .84), w) + pane(q, vec2(-1.08, 2.28), vec2(1.08, 2.36), w);
    float slab = smoothstep(.16, .1, y);
    vec3 moon = vec3(.040, .055, .10) * (1. + max(dot(n, normalize(vec3(-.3, .35, -.8))), 0.));
    col = plaster * (street(vW.y) * .42 + moon);
    // la luz de la ventana baña el revoque
    vec2 g = vec2(vW.x, vW.y - .45);
    if(front > .5) col += plaster * vec3(1., .58, .26) * (.9 * exp(-dot(g, g) * .55) + .22 * exp(-dot(g, g) * .07));
    col = mix(col, col * 1.5, slab * .7 + lip * .5);
    float r = hash21(vec2(bay, fl) + 7.7 + n.x * 3.);
    vec3 glass = vec3(.010, .014, .022) + vec3(.10, .055, .022) * exp(-(vW.y - ${G.toFixed(1)}) / 8.);
    float blind = step(.5, r) * step(2.28 - 1.2 * fract(r * 17.), y);
    glass = mix(glass, plaster * .16 * (.7 + .3 * step(.5, fract(y * 14.))), blind);
    // apenas dos vecinos despiertos, con la cortina cerrada
    float on = step(.94, r) * (1. - blind);
    glass += mix(vec3(.30, .16, .07), vec3(.05, .10, .22), step(.97, r)) * on * .45;
    float fr = pane(q, vec2(-.03, .84), vec2(.03, 2.28), w);
    glass = mix(glass, vec3(.02), fr);
    col = mix(col, glass, win);
  }
  gl_FragColor = vec4(applyFog(col, vW), 1.);
}`

const lampVertex = /* glsl */ `
attribute vec4 aC; // color, tamaño
uniform float uPx, uMirror, uTime; varying vec4 vC; varying float vK;
void main(){
  vec3 q = position;
  if(uMirror > .5) q.y = ${(2 * G).toFixed(1)} - q.y;
  vec4 mv = viewMatrix * vec4(q, 1.);
  gl_Position = projectionMatrix * mv;
  float z = length(mv.xyz), s = aC.w * uPx / z;
  gl_PointSize = clamp(s * (uMirror > .5 ? 2.4 : 1.35), 2., 34.);
  float e = min(s * s / 3., 1.);
  vK = uMirror > .5 ? 0. : smoothstep(6., 2.2, s * 1.35); // muy chico: un punto parejo
  float f = exp(-pow(z * .00026, 1.35));
  float red = step(.9, aC.r) * step(aC.g, .2);
  float blink = mix(1., .08 + .92 * step(.55, fract(uTime * .55 + position.x * .0137 + position.z * .0071)), red);
  vC = vec4(aC.rgb, (.85 + .15 * e) * f * smoothstep(1.5, 7., z) * (.92 + .08 * sin(uTime * 3. + position.x)) * blink);
}`
const lampFragment = /* glsl */ `
varying vec4 vC; varying float vK; uniform float uMirror;
void main(){ vec2 q = gl_PointCoord * 2. - 1.; if(uMirror > .5) q.x *= 2.6; float d = dot(q, q); float a = (exp(-d * 12.) * 1.6 + exp(-d * 3.) * .22) * smoothstep(1., .6, d); a = mix(a, .44, vK); gl_FragColor = vec4(vC.rgb * a * vC.a * (uMirror > .5 ? .5 : 4.2), 1.); }`

// Autos: cada uno deja la estela de lo que recorrió en el último segundo y medio, como en una foto de larga exposición.
// Blancas las que vienen hacia la cámara, rojas las que se alejan.
const carVertex = /* glsl */ `
attribute vec4 aCar; // calle, sentido/eje, fase, velocidad
uniform float uPx, uTime; varying vec4 vC; varying vec2 vQ;
void main(){
  float axis = step(.5, fract(aCar.y * .5 + .01)), dir = aCar.y > 1.5 ? 1. : -1.;
  // el tránsito se concentra en el centro, que es lo que se ve de cerca
  float run = mod(aCar.z * 1300. + uTime * aCar.w * dir, 1300.) - 650.;
  float lane = aCar.x + dir * 2.6;
  vec3 head = axis > .5 ? vec3(run, ${(G + 0.8).toFixed(1)}, lane) : vec3(lane, ${(G + 0.8).toFixed(1)}, run);
  head.z = max(head.z, -680.);
  vec3 fwd = (axis > .5 ? vec3(1., 0., 0.) : vec3(0., 0., 1.)) * dir;
  vec3 toCam = cameraPosition - head; float z = length(toCam); toCam /= z;
  vec3 sd = cross(fwd, toCam); sd = length(sd) > 1e-4 ? normalize(sd) : vec3(0., 1., 0.);
  // nunca más finas que un par de píxeles
  float wid = max(1., z * 2.2 / uPx), len = aCar.w * 1.5;
  vec3 p = head - fwd * (position.x + .5) * len + sd * position.y * wid;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
  float face = dot(toCam, fwd);
  vC = vec4(mix(vec3(1., .09, .04), vec3(1., .92, .78) * 1.5, step(0., face)), exp(-pow(z * .0003, 1.35)));
  vQ = vec2(position.x + .5, position.y * 2.);
}`
const carFragment = /* glsl */ `
varying vec4 vC; varying vec2 vQ;
void main(){ float a = pow(max(1. - vQ.x, 0.), 1.4) * exp(-vQ.y * vQ.y * 3.) * (1. + 2.5 * exp(-vQ.x * 40.)); gl_FragColor = vec4(vC.rgb * a * vC.a * 2.4, 1.); }`

const treeFragment = /* glsl */ `
varying vec3 vW; varying vec3 vNw; flat varying vec4 vS; varying vec2 vF;
${hash}
${noise3}
${fog}
void main(){
  vec3 n = normalize(vNw + (hash33(floor(vW * 3.4)) - .5) * 1.5);
  float leaf = .45 + .9 * hash21(floor(vW.xy * 3.1) + floor(vW.zy * 2.7) * 3.);
  float l = exp(-max(vW.y - ${(G + 3).toFixed(1)}, 0.) / 4.5);
  vec3 col = vec3(.026, .046, .020) * leaf * (.6 + .6 * vS.x) * (vec3(1., .62, .3) * l * (1.1 - n.y * .6) * 3. + vec3(.16, .24, .42) * (.5 + .5 * n.y));
  gl_FragColor = vec4(applyFog(col, vW), 1.);
}`

const skyVertex = /* glsl */ `varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.); gl_Position = p.xyww; }`
const skyFragment = /* glsl */ `
varying vec3 vD; uniform float uA;
${fog}
void main(){ vec3 d = normalize(vD); float a = min(exp(-max(d.y, 0.) * 5.) * 1.05, 1.); gl_FragColor = vec4(haze(d), a * uA); }`

/** Copa de árbol: una esfera con el contorno roto, para que no parezca una pelota. */
function crown() {
  const g = new THREE.IcosahedronGeometry(0.56, 2), p = g.getAttribute('position'), v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i)
    const k = 1 + 0.2 * Math.sin(v.x * 9 + v.y * 5) * Math.cos(v.z * 8 - v.y * 6) + 0.13 * Math.sin(v.x * 23 + v.z * 19 + v.y * 17)
    p.setXYZ(i, v.x * k, v.y * k * 0.9, v.z * k)
  }
  g.computeVertexNormals()
  return g
}

function build(q: Quality) {
  const rnd = mulberry(2026)
  const full = q.galaxy > 100000, lite = q.galaxy < 40000
  const reach = full ? 1150 : lite ? 480 : 700
  const isWater = (x: number, z: number) => z < shore(x) + 14
  // ---- casas y torres
  const boxes: number[][] = []
  // un poco de altura al azar: dos techos a la misma altura que se pisan titilan
  const put = (x: number, z: number, w: number, d: number, h: number) => { if (!isWater(x, z)) boxes.push([x, z, w, d, h + rnd() * 0.3]) }
  const n = Math.ceil(reach / CELL)
  for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
    const cx = i * CELL, cz = SZ + CELL / 2 + j * CELL // centro de la manzana
    if (Math.hypot(cx, cz) > reach + 60) continue
    if (i === 0 && j === 0) continue // la plaza
    const dense = Math.exp(-Math.hypot(cx - 60, cz + 260) / 420)
    const step = Math.hypot(cx, cz) < 320 || full ? 10 : 20
    for (let s = 0; s < 4; s++) for (let a = -50; a < 50; a += step) {
      if (rnd() < 0.09) continue
      const t = a + step / 2
      // el de la esquina llega justo a la esquina: su costado es la fachada de la calle transversal
      const depth = 14 + rnd() * 16, wr = step * (0.9 + rnd() * 0.1)
      const w = s < 2 && Math.abs(t) > 34 ? step : wr
      let h = 3.4 + rnd() * rnd() * 5
      if (rnd() < 0.05 + dense * 0.3) h = 14 + rnd() * 22 + dense * rnd() * 26
      const x = s === 0 ? t : s === 1 ? t : s === 2 ? -50 + depth / 2 : 50 - depth / 2
      const z = s === 0 ? 50 - depth / 2 : s === 1 ? -50 + depth / 2 : t
      if ((s > 1 && Math.abs(t) > 34) || (s < 2 && h > 14 && Math.abs(t) > 46)) continue
      // cada fachada entra distinto, y siempre al menos 25 cm detrás del costado del edificio de la esquina:
      // dos paredes casi en el mismo plano titilan (y la aberración las pinta de rojo y azul)
      const inset = 0.25 + rnd() * 0.45
      const X = cx + x + (s === 2 ? inset : s === 3 ? -inset : 0), Z = cz + z + (s === 0 ? -inset : s === 1 ? inset : 0)
      // alrededor de nuestro edificio todo es bajo: la ventana tiene que reinar
      if (i === 0 && j === -1) { if (Math.abs(X) < 9.4 + w / 2 && Z > -22) continue; h = Math.min(h, Math.abs(X) < 34 ? 6.5 : 13) }
      if (Math.abs(i) <= 1 && j >= 0 && j <= 2) h = Math.min(h, 9)
      put(X, Z, s < 2 ? w : depth, s < 2 ? depth : w, h)
    }
  }
  // nuestro edificio: tanque y cuarto de máquinas en la terraza
  boxes.push([-3, -6, 5, 5, 24.3 + 9 + 3.2], [5, -8, 2.4, 2.4, 24.3 + 9 + 2.2])
  // en las terrazas: tanque de agua sobre su base, alguna sala de máquinas y antenas en las torres
  const roof: number[][] = []
  boxes.forEach(([x, z, w, d, h]) => {
    if (h < 8 || h > 33 && rnd() < 0.2) return
    if (rnd() < 0.62) {
      const ox = (rnd() - 0.5) * Math.max(0, w - 4), oz = (rnd() - 0.5) * Math.max(0, d - 4)
      roof.push([x + ox, z + oz, 2.6, 2.6, 1.1, h], [x + ox, z + oz, 2.2, 2.2, 1.9, h + 1.1])
    }
    if (h > 18 && rnd() < 0.5) roof.push([x - w * 0.22, z + d * 0.18, Math.min(5, w * 0.35), Math.min(4, d * 0.3), 2.6, h])
    if (h > 30) roof.push([x + w * 0.2, z - d * 0.2, 0.2, 0.2, 9, h])
  })
  // costa de enfrente
  const box = new THREE.BoxGeometry(1, 1, 1)
  const mesh = (geo: THREE.BufferGeometry, list: number[][], mat: THREE.Material, y = 0) => {
    const m = new THREE.InstancedMesh(geo, mat, list.length), o = new THREE.Object3D(), s = new Float32Array(list.length * 4)
    list.forEach(([x, z, w, d, h, base = 0], k) => {
      o.position.set(x, G + y + base + h / 2, z); o.scale.set(w, h, d); o.updateMatrix(); m.setMatrixAt(k, o.matrix)
      // y = cuánta gente despierta: casi todos los edificios dormidos, algunos muy vivos
      s.set([rnd(), rnd() < 0.3 ? 0.03 : 0.07 + rnd() * rnd() * 0.32, rnd(), h], k * 4)
    })
    geo.setAttribute('aS', new THREE.InstancedBufferAttribute(s, 4))
    m.frustumCulled = false
    return m
  }
  // ---- luces: faroles cerca, mar de luces lejos, puente
  const L: number[] = [], C: number[] = []
  const lamp = (x: number, y: number, z: number, c: [number, number, number], s: number) => { L.push(x, y, z); C.push(...c, s) }
  const warm: [number, number, number] = [1, 0.55, 0.22], led: [number, number, number] = [0.85, 0.92, 1]
  const span = full ? 1400 : 840
  for (let i = -12; i <= 12; i++) {
    const X = SX + i * CELL, Z = SZ + i * CELL, cx = rnd() < 0.26 ? led : warm, cz = rnd() < 0.26 ? led : warm
    for (let a = -span; a <= span; a += 30) {
      if (Math.abs(X) < span && Math.hypot(X, a) < span && !isWater(X, a)) lamp(X + (Math.round(a / 30) % 2 ? 5 : -5), G + 7.5, a, cx, 2.6)
      if (Math.abs(Z) < span && Math.hypot(a, Z) < span && !isWater(a, Z)) lamp(a, G + 7.5, Z + (Math.round(a / 30) % 2 ? 5 : -5), cz, 2.6)
    }
  }
  const sea = full ? 15000 : lite ? 2600 : 6000
  for (let k = 0; k < sea; k++) {
    const a = rnd() * Math.PI * 2, r = span * 0.16 + Math.pow(rnd(), 0.8) * 3500
    let x = Math.cos(a) * r, z = Math.sin(a) * r + 300
    if (rnd() < 0.5) x = Math.round((x - SX) / CELL) * CELL + SX + (rnd() - 0.5) * 8
    else if (rnd() < 0.8) z = Math.round((z - SZ) / CELL) * CELL + SZ + (rnd() - 0.5) * 8
    const s = shore(x)
    if (z < s + 8 && z > s - 420) continue
    if (z < s && rnd() < 0.35) continue
    const c = rnd() < 0.2 ? led : rnd() < 0.06 ? ([0.4, 0.7, 1] as [number, number, number]) : warm
    const b = 0.5 + rnd() * 0.8
    lamp(x, G + 4 + rnd() * 12, z, [c[0] * b, c[1] * b, c[2] * b], 1.6 + rnd() * 1.6)
  }
  // la ventana: el punto más cálido de toda la ciudad
  lamp(0, 0.45, FZ + 0.4, [1.35, 0.6, 0.17], 4.2)
  // plaza
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; lamp(Math.cos(a) * 18, G + 4, 74 + Math.sin(a) * 18, warm, 1.6) }
  for (let k = -4; k <= 4; k++) if (k) { lamp(k * 11, G + 4, 74 + k * 11, warm, 1.4); lamp(k * 11, G + 4, 74 - k * 11, warm, 1.4) }
  for (let x = -1400; x < 1400; x += 22) lamp(x, G + 6, shore(x) + 9, warm, 2)
  // ---- puente colgante
  const BX = -60, B0 = shore(BX) + 6, B1 = B0 - 410, deck = G + 9, H = 46
  const parts: number[][] = []
  const t0 = B0 - 95, t1 = B1 + 95
  for (const z of [t0, t1]) for (const x of [-7, 7]) parts.push([BX + x, z, 2.2, 3, H])
  const line: number[] = []
  for (const x of [-7, 7]) {
    const cable = (za: number, ya: number, zb: number, yb: number, sag: number) => {
      const N = 34
      for (let k = 0; k <= N; k++) {
        const u = k / N, z = za + (zb - za) * u, y = ya + (yb - ya) * u - sag * 4 * u * (1 - u)
        if (k < N) { const v = (k + 1) / N; line.push(BX + x, y, z, BX + x, ya + (yb - ya) * v - sag * 4 * v * (1 - v), za + (zb - za) * v) }
        line.push(BX + x, y, z, BX + x, deck, z)
        lamp(BX + x, y + 0.4, z, [1, 0.8, 0.5], 1.7)
      }
    }
    cable(t0, G + H, t1, G + H, 31)
    cable(B0, deck, t0, G + H, 5)
    cable(t1, G + H, B1, deck, 5)
    for (let z = B1; z <= B0; z += 16) lamp(BX + x, deck + 4, z, led, 1.8)
  }
  for (const z of [t0, t1]) lamp(BX, G + H + 2, z, [1, 0.12, 0.08], 3.2)
  // luces rojas en las torres altas
  roof.forEach(r => { if (r[4] === 9) lamp(r[0], G + r[5] + 9.4, r[1], [1, 0.1, 0.06], 2.2) })
  // ---- autos
  const cars = full ? 900 : lite ? 160 : 380, A: number[] = []
  for (let k = 0; k < cars; k++) { const i = Math.round((rnd() - 0.5) * 14); A.push((k % 2 ? SZ : SX) + i * CELL, (k % 2) + (rnd() < 0.5 ? 0 : 2), rnd(), 9 + rnd() * 9) }
  // ---- árboles
  const trees: number[][] = []
  const tn = full ? 1500 : lite ? 260 : 520
  for (let k = 0; k < tn; k++) {
    let x: number, z: number
    if (k < tn * 0.11) { x = (rnd() - 0.5) * 96; z = 26 + rnd() * 96; if (Math.abs(x) < 5 && z < 60) continue }
    else if (rnd() < 0.5) { x = SX + Math.round((rnd() - 0.5) * 9) * CELL + (rnd() < 0.5 ? 9 : -9); z = (rnd() - 0.5) * 1000 }
    else { z = SZ + Math.round((rnd() - 0.5) * 9) * CELL + (rnd() < 0.5 ? 9 : -9); x = (rnd() - 0.5) * 1000 }
    if (isWater(x, z) || (Math.abs(x) < 12 && z > -20 && z < 22)) continue
    const s = 4 + rnd() * 3.4
    trees.push([x, z, s, s * (0.85 + rnd() * 0.3), s * 1.05])
  }
  return { boxes, box, mesh, L, C, A, trees, parts, roof, line, bridge: { x: BX, z: (B0 + B1) / 2, len: B0 - B1, y: deck } }
}

export default function City({ q }: { q: Quality }) {
  const root = useRef<THREE.Group>(null)
  const m = useMemo(() => {
    const d = build(q)
    const u = { uTime: U.time, uPx: { value: 900 } }
    const boxMat = new THREE.ShaderMaterial({ vertexShader: boxVertex, fragmentShader: boxFragment, uniforms: { uTime: U.time } })
    const treeMat = new THREE.ShaderMaterial({ vertexShader: boxVertex, fragmentShader: treeFragment })
    const lampMat = (mirror: number) => new THREE.ShaderMaterial({ vertexShader: lampVertex, fragmentShader: lampFragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { ...u, uMirror: { value: mirror } } })
    const lamps = new THREE.BufferGeometry()
    lamps.setAttribute('position', new THREE.Float32BufferAttribute(d.L, 3))
    lamps.setAttribute('aC', new THREE.Float32BufferAttribute(d.C, 4))
    const strip = new THREE.PlaneGeometry(1, 1)
    const cars = new THREE.InstancedBufferGeometry()
    cars.index = strip.index
    cars.setAttribute('position', strip.getAttribute('position'))
    cars.setAttribute('aCar', new THREE.InstancedBufferAttribute(new Float32Array(d.A), 4))
    cars.instanceCount = d.A.length / 4
    const cable = new THREE.BufferGeometry()
    cable.setAttribute('position', new THREE.Float32BufferAttribute(d.line, 3))
    const ground = new THREE.PlaneGeometry(16000, 16000)
    ground.rotateX(-Math.PI / 2)
    const home = new THREE.BoxGeometry(18, 33.3, 15)
    home.translate(0, G + 33.3 / 2, FZ - 7.5)
    const solid = new THREE.ShaderMaterial({ vertexShader: groundVertex, fragmentShader: /* glsl */ `varying vec3 vW; ${fog} void main(){ gl_FragColor = vec4(applyFog(vec3(.10, .085, .07) * (.35 + .65 * smoothstep(${(G + 2).toFixed(1)}, ${(G + 40).toFixed(1)}, vW.y)), vW), 1.); }` })
    return {
      u, solid, ground, home, lamps, cars, cable, bridge: d.bridge,
      boxes: d.mesh(d.box, d.boxes, boxMat),
      trees: d.mesh(crown(), d.trees, treeMat, 1.6),
      parts: d.mesh(new THREE.BoxGeometry(1, 1, 1), d.parts, solid),
      roof: d.mesh(new THREE.BoxGeometry(1, 1, 1), d.roof, solid),
      groundMat: new THREE.ShaderMaterial({ vertexShader: groundVertex, fragmentShader: groundFragment }),
      waterMat: new THREE.ShaderMaterial({ vertexShader: groundVertex, fragmentShader: waterFragment, transparent: true, depthWrite: false, uniforms: { uTime: U.time } }),
      homeMat: new THREE.ShaderMaterial({ vertexShader: homeVertex, fragmentShader: homeFragment }),
      lampMat: lampMat(0), mirrorMat: lampMat(1),
      carMat: new THREE.ShaderMaterial({ vertexShader: carVertex, fragmentShader: carFragment, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: u }),
      lineMat: new THREE.ShaderMaterial({ vertexShader: groundVertex, fragmentShader: /* glsl */ `varying vec3 vW; void main(){ gl_FragColor = vec4(vec3(.16, .12, .08) * exp(-length(vW - cameraPosition) * .0006), 1.); }` }),
      sky: new THREE.ShaderMaterial({ vertexShader: skyVertex, fragmentShader: skyFragment, side: THREE.BackSide, transparent: true, depthWrite: false, uniforms: { uA: { value: 1 } } }),
    }
  }, [q])

  useFrame(({ size, viewport, camera }) => {
    const g = root.current
    if (!g) return
    // adentro de la habitación la ciudad ya no se ve (queda a la espalda), salvo en modo explorar
    g.visible = J.raw >= 15 && J.raw < (J.explore ? 18.6 : 18.05)
    if (!g.visible) return
    m.u.uPx.value = (size.height * viewport.dpr) / (2 * Math.tan(THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov / 2)))
    m.sky.uniforms.uA.value = smooth(15, 15.3, J.raw)
  })

  return (
    <group ref={root} visible={false}>
      <mesh material={m.sky} renderOrder={-9} frustumCulled={false}><sphereGeometry args={[1, 32, 24]} /></mesh>
      <mesh geometry={m.ground} material={m.groundMat} position={[0, G, 0]} frustumCulled={false} />
      <mesh geometry={m.home} material={m.homeMat} frustumCulled={false} />
      <primitive object={m.boxes} />
      <primitive object={m.trees} />
      <primitive object={m.parts} />
      <primitive object={m.roof} />
      <mesh material={m.solid} position={[m.bridge.x, m.bridge.y, m.bridge.z]}><boxGeometry args={[15, 1.2, m.bridge.len]} /></mesh>
      <lineSegments geometry={m.cable} material={m.lineMat} frustumCulled={false} />
      <points geometry={m.lamps} material={m.mirrorMat} frustumCulled={false} renderOrder={-8} />
      <mesh geometry={m.ground} material={m.waterMat} position={[0, G - 0.3, 0]} frustumCulled={false} renderOrder={-7} />
      <points geometry={m.lamps} material={m.lampMat} frustumCulled={false} renderOrder={2} />
      <mesh geometry={m.cars} material={m.carMat} frustumCulled={false} renderOrder={2} />
    </group>
  )
}
