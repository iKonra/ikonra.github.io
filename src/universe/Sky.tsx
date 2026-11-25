import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { bin, tex } from './assets'
import { starColor } from './glsl'
import { J, damp, pose, smooth, win } from './journey'
import type { Quality } from './quality'

// El cielo real: la Vía Láctea medida por Gaia (mapa de NASA SVS), las 8.777 estrellas a simple vista del catálogo de Yale
// con su brillo y color, y las líneas de las constelaciones. Todo en coordenadas galácticas, a distancia infinita.

/** Orientación del cielo en cada etapa (Euler): ubica la banda de la Vía Láctea en el encuadre. Se interpola con t. */
const turns: [number, [number, number, number]][] = [
  [0, [0.5, 1.2, 0.35]], [1, [0.2, 1.35, 0.5]], [2, [0.1, 1.5, 0.62]], [3, [0.06, 1.62, 0.42]], [4, [0, 1.6, 0.4]],
  [5, [0.3, 2.3, 0.75]], [6, [0.22, 2.9, 0.4]], [7, [0.1, 3.5, 0.85]], [8, [-0.2, 4.1, 0.5]], [9, [0.3, 4.7, 0.9]],
  [10, [0.15, 5.1, -0.35]], [11, [0.1, 5.3, -0.3]], [12, [-0.12, 1.75, -0.5]], [13, [-0.1, 1.5, -0.45]], [14, [0.42, 1.3, -0.28]],
]
/** Giro actual del cielo (lo necesita el agujero negro para curvarlo). */
export const skyQuaternion = new THREE.Quaternion()
const ea = new THREE.Euler(), qa = new THREE.Quaternion(), qb = new THREE.Quaternion()
function skyTurn(t: number, out: THREE.Quaternion) {
  let i = 0
  while (i < turns.length - 2 && t > turns[i + 1][0]) i++
  const [t0, a] = turns[i], [t1, b] = turns[i + 1]
  qa.setFromEuler(ea.set(a[0], a[1], a[2]))
  qb.setFromEuler(ea.set(b[0], b[1], b[2]))
  return out.slerpQuaternions(qa, qb, smooth(t0, t1, t))
}

const domeVertex = /* glsl */ `
varying vec3 vDir;
void main(){ vDir = position; vec4 p = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); gl_Position = p.xyww; }`

export const skyLookup = /* glsl */ `
vec3 skyTex(sampler2D map, vec3 d){
  d = normalize(d);
  vec2 uv = vec2(.5 - atan(-d.z, d.x) / 6.2831853, .5 + asin(clamp(d.y, -1., 1.)) / 3.14159265);
  return texture2D(map, uv).rgb;
}`

const domeFragment = /* glsl */ `
uniform sampler2D uMap; uniform float uI; uniform vec3 uTint; uniform float uHaze;
varying vec3 vDir;
${skyLookup}
void main(){
  vec3 c = skyTex(uMap, vDir);
  // espacio profundo: nunca negro puro, apenas teñido por la zona
  vec3 d = normalize(vDir);
  vec3 base = mix(vec3(.0022, .0027, .0045), uTint * .012, .4) * (1. + .5 * d.y) * uHaze;
  gl_FragColor = vec4(base + c * uI, 1.);
}`

const starVertex = /* glsl */ `
attribute vec2 aMag; // magnitud, B-V
attribute float aSeed;
uniform float uTime, uPR, uI, uScale;
varying vec3 vCol; varying float vSpike; varying float vA;
${starColor}
void main(){
  vec4 p = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
  gl_Position = p.xyww;
  float flux = pow(10., -.4 * (aMag.x - 2.));
  float tw = 1. + .16 * sin(uTime * (1.2 + aSeed * 3.) + aSeed * 60.) * smoothstep(.02, .6, flux);
  float e = pow(flux, .5) * tw;
  vSpike = smoothstep(1.2, 4.2, e);
  gl_PointSize = uPR * uScale * (1.7 + 3.1 * pow(flux, .28) + vSpike * 16.);
  vCol = bvColor(aMag.y);
  vCol = mix(vec3(dot(vCol, vec3(.333))), vCol, 1.35);
  vA = uI * min(.22 + e * .85, 5.);
}`
const starFragment = /* glsl */ `
varying vec3 vCol; varying float vSpike; varying float vA;
void main(){
  vec2 q = gl_PointCoord - .5; float r = length(q) * 2.;
  float soft = mix(2.4, 22., vSpike);
  float core = exp(-r * r * soft);
  // destellos de difracción en las más brillantes
  float sp = (exp(-abs(q.x) * 90.) * exp(-abs(q.y) * 9.) + exp(-abs(q.y) * 90.) * exp(-abs(q.x) * 9.)) * vSpike * .55;
  float a = (core + sp) * smoothstep(1., .72, r);
  gl_FragColor = vec4(mix(vCol, vec3(1.), core * .45) * a * vA, 1.);
}`

const lineVertex = /* glsl */ `
attribute float aT;
varying float vT; varying float vE;
attribute float aE;
void main(){ vT = aT; vE = aE; vec4 p = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); gl_Position = p.xyww; }`
const lineFragment = /* glsl */ `
uniform float uI, uReveal; uniform vec3 uColor;
varying float vT; varying float vE;
void main(){
  // cada trazo se dibuja de punta a punta, en momentos distintos
  float k = smoothstep(0., .35, uReveal * 1.35 - vT);
  float gap = smoothstep(0., .12, vE) * smoothstep(1., .88, vE);
  gl_FragColor = vec4(uColor * uI * step(vE, k) * gap, 1.);
}`

export default function Sky({ q }: { q: Quality }) {
  const { camera, viewport } = useThree()
  const root = useRef<THREE.Group>(null)

  const m = useMemo(() => {
    const dome = new THREE.ShaderMaterial({
      vertexShader: domeVertex, fragmentShader: domeFragment, side: THREE.BackSide, depthWrite: false, depthTest: false,
      uniforms: { uMap: { value: tex(q.bigTex ? 'milkyway-4k.webp' : 'milkyway-2k.webp', { mip: false, aniso: 1 }) }, uI: { value: 0 }, uTint: { value: new THREE.Color() }, uHaze: { value: 1 } },
    })
    const stars = new THREE.ShaderMaterial({
      vertexShader: starVertex, fragmentShader: starFragment, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPR: { value: 1 }, uI: { value: 1 }, uScale: { value: 1 } },
    })
    const lines = new THREE.ShaderMaterial({
      vertexShader: lineVertex, fragmentShader: lineFragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uI: { value: 0 }, uReveal: { value: 0 }, uColor: { value: new THREE.Color('#ffd9a0') } },
    })
    return { dome, stars, lines }
  }, [q.bigTex])

  const geo = useMemo(() => ({ stars: new THREE.BufferGeometry(), lines: new THREE.BufferGeometry() }), [])

  useEffect(() => {
    let live = true
    bin('stars.bin').then(b => {
      if (!live) return
      const n = b.byteLength / 8, dv = new DataView(b), f = q.faint
      const pos = new Float32Array((n + f) * 3), mag = new Float32Array((n + f) * 2), seed = new Float32Array(n + f)
      for (let i = 0; i < n; i++) {
        const o = i * 8
        pos.set([dv.getInt16(o, true) / 32767, dv.getInt16(o + 2, true) / 32767, dv.getInt16(o + 4, true) / 32767], i * 3)
        mag.set([(dv.getUint8(o + 6) / 255) * 8.4 - 1.6, (dv.getUint8(o + 7) / 255) * 2.4 - 0.4], i * 2)
        seed[i] = Math.random()
      }
      // estrellas débiles: más densas hacia el plano de la galaxia
      for (let i = n; i < n + f; i++) {
        const l = Math.random() * Math.PI * 2
        const plane = Math.random() < 0.6
        const sb = plane ? Math.max(-1, Math.min(1, (Math.random() + Math.random() + Math.random() - 1.5) * 0.34)) : Math.random() * 2 - 1
        const cb = Math.sqrt(1 - sb * sb)
        pos.set([cb * Math.cos(l), sb, -cb * Math.sin(l)], i * 3)
        mag.set([6.1 + Math.random() * 1.8, Math.random() * 1.6 - 0.2], i * 2)
        seed[i] = Math.random()
      }
      geo.stars.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      geo.stars.setAttribute('aMag', new THREE.BufferAttribute(mag, 2))
      geo.stars.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
      geo.stars.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 2)
    })
    bin('constellations.bin').then(b => {
      if (!live) return
      const a = new Int16Array(b), n = a.length / 3
      const pos = new Float32Array(n * 3), t = new Float32Array(n), e = new Float32Array(n)
      for (let i = 0; i < n * 3; i++) pos[i] = a[i] / 32767
      for (let i = 0; i < n; i += 2) { t[i] = t[i + 1] = Math.random(); e[i + 1] = 1 }
      geo.lines.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      geo.lines.setAttribute('aT', new THREE.BufferAttribute(t, 1))
      geo.lines.setAttribute('aE', new THREE.BufferAttribute(e, 1))
      geo.lines.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 2)
    })
    return () => { live = false }
  }, [geo, q.faint])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const g = root.current
    if (!g) return
    g.position.copy(camera.position)
    skyTurn(J.t, skyQuaternion)
    g.quaternion.copy(skyQuaternion)
    const s = m.stars.uniforms, d = m.dome.uniforms, l = m.lines.uniforms
    s.uTime.value += dt
    s.uPR.value = viewport.dpr
    s.uScale.value = Math.min(1.15, Math.max(0.75, window.innerHeight / 900))
    // dentro de los túneles el cielo se apaga
    const open = 1 - J.tunnel
    // el agujero negro dibuja su propio cielo curvado: ahí las estrellas sueltas se apagan
    const hole = win(J.t, 2.4, 2.5, 4.48, 4.6)
    s.uI.value = pose.stars * open * (1 - hole)
    d.uI.value = pose.sky * 0.62 * open
    d.uTint.value.copy(pose.tint)
    const want = win(J.t, 11.5, 12.1, 13, 13.6) * 0.2 + win(J.t, 13.7, 14, 14.1, 14.4) * 0.11
    l.uI.value = damp(l.uI.value, want, 3, dt)
    l.uReveal.value = damp(l.uReveal.value, J.t > 11.5 ? 1.2 : 0, 0.8, dt)
  })

  return (
    <group ref={root}>
      <mesh material={m.dome} renderOrder={-20} frustumCulled={false}><sphereGeometry args={[1, 48, 32]} /></mesh>
      <points geometry={geo.stars} material={m.stars} renderOrder={-18} frustumCulled={false} />
      <lineSegments geometry={geo.lines} material={m.lines} renderOrder={-17} frustumCulled={false} />
    </group>
  )
}
