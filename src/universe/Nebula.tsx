import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { tex } from './assets'
import { starColor } from './glsl'
import { C, J, smooth, win } from './journey'
import { U, mulberry } from './shared'
import type { Quality } from './quality'

// La nebulosa del brazo espiral: nubes volumétricas renderizadas en Cycles (tres luces por nube) que acá se vuelven a iluminar
// según dónde estén las estrellas jóvenes del centro. La cámara las atraviesa.

const vertex = /* glsl */ `
attribute vec4 iPos; attribute vec3 iCol; attribute vec4 iMisc;
uniform vec3 uCore; uniform float uTime;
varying vec2 vUv; varying vec2 vCell; varying vec3 vCol; varying vec3 vLight; varying float vA, vAtt, vEm;
void main(){
  vec3 wp = iPos.xyz;
  wp.x += sin(uTime * .05 + iMisc.y * 5.) * .35; wp.y += cos(uTime * .06 + iMisc.x) * .25;
  vec4 mv = viewMatrix * vec4(wp, 1.);
  float r = iMisc.y + uTime * .012 * (mod(iMisc.x, 2.) * 2. - 1.);
  float c = cos(r), s = sin(r);
  mat2 rot = mat2(c, s, -s, c);
  vec3 core = (viewMatrix * vec4(uCore, 1.)).xyz - mv.xyz;
  vAtt = 1. / (1. + dot(core, core) * .012);
  vec3 L = normalize(core);
  vLight = vec3(L.x * c + L.y * s, -L.x * s + L.y * c, L.z);
  float z = -mv.z;
  mv.xy += rot * position.xy * iPos.w;
  gl_Position = projectionMatrix * mv;
  vUv = uv; vCell = vec2(mod(iMisc.x, 4.), floor(iMisc.x / 4.));
  vCol = iCol; vEm = iMisc.w;
  vA = iMisc.z * smoothstep(.4, 6.5, z);
}`
const fragment = /* glsl */ `
uniform sampler2D uMap; uniform float uFade; uniform vec3 uKey;
varying vec2 vUv; varying vec2 vCell; varying vec3 vCol; varying vec3 vLight; varying float vA, vAtt, vEm;
void main(){
  vec2 u = clamp(vUv, .004, .996);
  vec4 t = texture2D(uMap, vec2(vCell.x + u.x, 3. - vCell.y + u.y) * .25);
  float a = t.a * vA * uFade;
  if(a < .003) discard;
  float avg = (t.r + t.g + t.b) * .333;
  float lit = t.r * max(vLight.x, 0.) + t.g * max(-vLight.x, 0.) + t.b * max(vLight.y, 0.) + avg * max(-vLight.y, 0.) * .3 + avg * max(-vLight.z, 0.) * .55 + avg * .12;
  // a contraluz los bordes finos brillan
  float rim = pow(max(1. - t.a, 0.), 1.5) * max(-vLight.z, 0.) * 1.6;
  vec3 col = vCol * (lit * uKey * (.35 + 2.6 * vAtt) + rim * uKey * vAtt * 1.8) + vCol * vEm * (.35 + t.a * .65);
  gl_FragColor = vec4(col * a, a);
}`

const starVertex = /* glsl */ `
attribute vec2 aS; uniform float uTime, uPR; varying vec3 vC; varying float vB;
${starColor}
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mv;
  float z = -mv.z;
  gl_PointSize = min(uPR * aS.x * 620. / max(z, .5), uPR * 190.);
  vC = bvColor(aS.y); vB = smoothstep(.6, 4., z) * (1. + .12 * sin(uTime * 1.7 + aS.x * 90.));
}`
const starFragment = /* glsl */ `
uniform float uFade; varying vec3 vC; varying float vB;
void main(){
  vec2 q = gl_PointCoord - .5; float r = length(q) * 2.;
  float core = exp(-r * r * 160.) * 5. + exp(-r * 13.) * .7 + exp(-r * 4.5) * .1;
  float sp = exp(-abs(q.x) * 240.) * exp(-abs(q.y) * 13.) + exp(-abs(q.y) * 240.) * exp(-abs(q.x) * 13.);
  vec2 d = mat2(.866, .5, -.5, .866) * q; sp += exp(-abs(d.x) * 260.) * exp(-abs(d.y) * 24.) * .6;
  d = mat2(.866, -.5, .5, .866) * q; sp += exp(-abs(d.x) * 260.) * exp(-abs(d.y) * 24.) * .6;
  gl_FragColor = vec4(mix(vC, vec3(1.), min(core * .2, .8)) * (core + sp * 1.5) * smoothstep(1., .55, r) * vB * uFade, 1.);
}`

type Puff = { x: number; y: number; z: number; s: number; c: THREE.Color; cell: number; rot: number; a: number; em: number; d: number }

function makePuffs(n: number): Puff[] {
  const rnd = mulberry(7)
  const teal = new THREE.Color('#4fb6bd'), gold = new THREE.Color('#ff9a52'), rose = new THREE.Color('#d8446f'), violet = new THREE.Color('#6b55c8'), dust = new THREE.Color('#3a1f16')
  const out: Puff[] = []
  for (let i = 0; i < n; i++) {
    // un corredor alrededor del recorrido de la cámara, cerrado al fondo
    const z = 41 - Math.pow(rnd(), 0.8) * 52
    const back = z < 4
    const a = rnd() * Math.PI * 2
    const r = back ? Math.sqrt(rnd()) * 12 : 2.7 + Math.pow(rnd(), 0.75) * 10.5
    const x = C.nebula.x + Math.cos(a) * r * 1.25, y = C.nebula.y + 0.4 + Math.sin(a) * r * 0.72
    const inner = 1 - Math.min(1, Math.hypot(x - C.nebula.x, y - C.nebula.y, (z - 6) * 0.5) / 12)
    const c = new THREE.Color()
    const pick = rnd()
    // abajo polvo tibio, arriba gas frío, como en los telones
    const h = Math.min(1, Math.max(0, (y - C.nebula.y + 4) / 9 + (rnd() - 0.5) * 0.3))
    const isDust = pick < 0.34 && h < 0.6
    if (isDust) c.copy(dust).lerp(gold, 0.12 + rnd() * 0.16)
    else c.copy(gold).lerp(rose, 0.25 + rnd() * 0.4).lerp(teal, Math.pow(h, 0.8)).lerp(violet, rnd() * 0.25)
    out.push({ x, y, z, s: (back ? 9 : 5) + rnd() * (back ? 8 : 5), c, cell: Math.floor(rnd() * 16), rot: rnd() * 6.28, a: isDust ? 0.62 : 0.2 + rnd() * 0.22, em: isDust ? 0 : 0.01 + inner * 0.05, d: 0 })
  }
  return out
}

export default function Nebula({ q }: { q: Quality }) {
  const { camera } = useThree()
  const group = useRef<THREE.Group>(null)
  const puffs = useMemo(() => makePuffs(q.puffs), [q.puffs])
  const geo = useMemo(() => {
    const g = new THREE.InstancedBufferGeometry()
    const p = new THREE.PlaneGeometry(1, 1)
    g.setAttribute('position', p.getAttribute('position'))
    g.setAttribute('uv', p.getAttribute('uv'))
    g.setIndex(p.getIndex())
    for (const [k, d] of [['iPos', 4], ['iCol', 3], ['iMisc', 4]] as const) {
      const a = new THREE.InstancedBufferAttribute(new Float32Array(puffs.length * d), d)
      a.setUsage(THREE.DynamicDrawUsage)
      g.setAttribute(k, a)
    }
    g.instanceCount = puffs.length
    return g
  }, [puffs])
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false, premultipliedAlpha: true,
    uniforms: { uMap: { value: tex(q.bigTex ? 'puffs.webp' : 'puffs-sm.webp', { srgb: true, aniso: 2 }) }, uCore: { value: new THREE.Vector3(C.nebula.x - 1.5, C.nebula.y + 1.6, -1) }, uKey: { value: new THREE.Color('#d9ecff') }, uTime: U.time, uFade: { value: 0 } },
  }), [q.bigTex])

  const cluster = useMemo(() => {
    const rnd = mulberry(21), n = 46
    const pos = new Float32Array(n * 3), s = new Float32Array(n * 2)
    for (let i = 0; i < n; i++) {
      const tight = i < 16
      const a = rnd() * 6.28, r = tight ? Math.pow(rnd(), 1.4) * 2.6 : 2.5 + rnd() * 11
      pos.set([C.nebula.x - 1.5 + Math.cos(a) * r, C.nebula.y + 1.6 + Math.sin(a) * r * 0.7, tight ? -1 + (rnd() - 0.5) * 3 : 36 - rnd() * 44], i * 3)
      s.set([i < 4 ? 1.7 + rnd() : 0.25 + rnd() * rnd() * 1.1, rnd() < 0.75 ? -0.25 + rnd() * 0.3 : 0.9 + rnd() * 0.7], i * 2)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aS', new THREE.BufferAttribute(s, 2))
    const m = new THREE.ShaderMaterial({ vertexShader: starVertex, fragmentShader: starFragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: U.time, uPR: U.pr, uFade: { value: 0 } } })
    return { g, m }
  }, [])

  const dir = useMemo(() => new THREE.Vector3(), [])
  useFrame(() => {
    const g = group.current
    if (!g) return
    const f = win(J.t, 0.4, 0.95, 2.3, 2.5)
    g.visible = f > 0.002
    if (!g.visible) return
    mat.uniforms.uFade.value = f
    cluster.m.uniforms.uFade.value = f * smooth(0.45, 1, J.t)
    // de atrás hacia adelante
    camera.getWorldDirection(dir)
    const cp = camera.position
    for (const p of puffs) p.d = (p.x - cp.x) * dir.x + (p.y - cp.y) * dir.y + (p.z - cp.z) * dir.z
    puffs.sort((a, b) => b.d - a.d)
    const P = geo.getAttribute('iPos').array as Float32Array, K = geo.getAttribute('iCol').array as Float32Array, M = geo.getAttribute('iMisc').array as Float32Array
    puffs.forEach((p, i) => {
      P[i * 4] = p.x; P[i * 4 + 1] = p.y; P[i * 4 + 2] = p.z; P[i * 4 + 3] = p.s
      K[i * 3] = p.c.r; K[i * 3 + 1] = p.c.g; K[i * 3 + 2] = p.c.b
      M[i * 4] = p.cell; M[i * 4 + 1] = p.rot; M[i * 4 + 2] = p.a; M[i * 4 + 3] = p.em
    })
    for (const k of ['iPos', 'iCol', 'iMisc']) geo.getAttribute(k).needsUpdate = true
  })

  return (
    <group ref={group}>
      <points geometry={cluster.g} material={cluster.m} frustumCulled={false} renderOrder={2} />
      <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={3} />
    </group>
  )
}
