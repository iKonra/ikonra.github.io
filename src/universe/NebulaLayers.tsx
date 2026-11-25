import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { fsVertex, hash, noise3 } from './glsl'
import { C, J, win } from './journey'
import { tri } from './Pipeline'
import { U } from './shared'
import type { Quality } from './quality'
import { compilePass, started } from './warm'

// Telones de la nebulosa: cada uno es una imagen procedural con mucho detalle que se calcula una sola vez (en la GPU, al cargar)
// y después se dibuja como un plano a distinta profundidad. La cámara los atraviesa uno por uno: paralaje de verdad.
// El ruido se calcula en pases chicos y se combina al final: todo junto en un solo shader tardaba nueve segundos en compilar.

const noise = /* glsl */ `
varying vec2 vUv; uniform sampler2D uWx, uWy; uniform float uScale, uWarp, uFreq, uSwirl, uRidge; uniform vec3 uOff; uniform vec2 uLac; uniform int uOct;
${hash}
${noise3}
void main(){
  vec2 p = (vUv - .5) * uScale;
  vec2 w = vec2(texture2D(uWx, vUv).r, texture2D(uWy, vUv).r) * uWarp;
  vec3 q = vec3((p + w * 1.35) * uFreq + w.yx * uSwirl + uOff.xy, uOff.z);
  float a = .5, s = 0.;
  for(int i = 0; i < 8; i++){
    if(i >= uOct) break;
    float n = vnoise(q), c = 1. - abs(n) * 2.;
    s += a * mix(n, c * c, uRidge);
    q = q * uLac.x + uLac.y; a *= .5;
  }
  gl_FragColor = vec4(s, 0., 0., 1.);
}`

const compose = /* glsl */ `
varying vec2 vUv; uniform float uHole, uBack, uScale; uniform sampler2D uWx, uWy, uN, uR, uF, uD;
// relieve del polvo: los "acantilados" de gas frío
float cliff(vec2 p, vec2 w, float n){ return p.y * .95 + w.x * 1.15 + n * .62 + .22; }
void main(){
  vec2 p = (vUv - .5) * uScale;
  vec2 w = vec2(texture2D(uWx, vUv).r, texture2D(uWy, vUv).r);
  float n = texture2D(uN, vUv).r, r = texture2D(uR, vUv).r, f = texture2D(uF, vUv).r;
  // ---- gas ionizado
  float gas = smoothstep(-.42, .5, n + w.y * .8);
  vec3 teal = vec3(.07, .33, .40), blue = vec3(.06, .13, .36), rose = vec3(.52, .10, .17), gold = vec3(.80, .40, .15);
  vec3 gc = mix(blue, teal, smoothstep(-.3, .35, w.y + p.y * .12));
  gc = mix(gc, rose, smoothstep(.02, .55, w.x + n * .5) * .75);
  gc = mix(gc, gold, smoothstep(.1, .55, f + n * .4 - p.y * .12) * .5);
  vec3 col = gc * (gas * gas * 1.25 + pow(max(r - .45, 0.), 2.) * 2.1 * gas);
  float a = gas * .5 + gas * gas * .22;
  // ---- polvo: oscuro, con el borde encendido por las estrellas
  float h = cliff(p, w, n), dust = smoothstep(.12, -.2, h);
  vec2 L = normalize(vec2(.35, 1.)) * .055, uv2 = vUv + L / uScale;
  vec2 w2 = vec2(texture2D(uWx, uv2).r, texture2D(uWy, uv2).r);
  float relief = clamp((cliff(p + L, w2, texture2D(uN, uv2).r) - h) * 5.2, -1., 1.);
  float edge = exp(-pow(abs((h - .05) * 9.), 2.));
  vec3 dc = mix(vec3(.030, .012, .010), vec3(.34, .125, .05), smoothstep(-.35, .75, relief + f * .9));
  dc += vec3(1., .55, .26) * max(relief, 0.) * smoothstep(-.7, .05, h) * .5;
  col = mix(col, dc, dust);
  col += (vec3(1., .72, .42) * edge * .75 + vec3(.35, .8, .85) * exp(-pow(abs((h - .28) * 5.), 2.)) * .22) * (.35 + gas);
  a = mix(a, .97, dust);
  a = max(a, edge * .6);
  // vetas oscuras
  float lane = smoothstep(.16, .42, texture2D(uD, vUv).r);
  col *= 1. - lane * .62;
  // ---- recorte: el centro queda libre en los telones cercanos
  vec2 c = vUv - .5; float rr = length(c) * 2.;
  float mask = smoothstep(1., .62, rr + w.x * .18);
  if(uHole > 0.) mask *= smoothstep(uHole * .55, uHole * 1.35, rr + (w.x + n) * .42);
  a *= mask; col *= mask;
  if(uBack > .5) a = max(a, mask * .82);
  gl_FragColor = vec4(col, clamp(a, 0., 1.));
}`

/** Cada mapa de ruido: deformación, frecuencia, giro, octavas, crestas y corrimiento según la semilla. */
const maps: { warp: number; freq: number; swirl: number; oct: number; ridge: number; off: (s: number) => [number, number, number] }[] = [
  { warp: 0, freq: 0.8, swirl: 0, oct: 5, ridge: 0, off: s => [3, 3, s + 3] },
  { warp: 0, freq: 0.8, swirl: 0, oct: 5, ridge: 0, off: s => [9.7, 9.7, s + 9.7] },
  { warp: 1, freq: 1.25, swirl: 0, oct: 7, ridge: 0, off: s => [0, 0, s * 1.3] },
  { warp: 1, freq: 1.05, swirl: 1, oct: 6, ridge: 1, off: s => [0, 0, s + 4] },
  { warp: 1, freq: 3.1, swirl: 0, oct: 5, ridge: 0, off: s => [0, 0, s + 8] },
  { warp: 1, freq: 1.7, swirl: 0, oct: 5, ridge: 0, off: s => [5, 5, s + 2] },
]

const vertex = /* glsl */ `
varying vec2 vUv; varying float vZ;
void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.); vZ = -mv.z; gl_Position = projectionMatrix * mv; }`
const fragment = /* glsl */ `
uniform sampler2D uMap; uniform float uFade, uTime, uGain; varying vec2 vUv; varying float vZ;
void main(){
  // respira: una deformación lentísima
  vec2 u = vUv + vec2(sin(uTime * .05 + vUv.y * 7.), cos(uTime * .043 + vUv.x * 6.)) * .0035;
  vec4 t = texture2D(uMap, u);
  float k = uFade * smoothstep(.6, 7.5, vZ);
  gl_FragColor = vec4(t.rgb * k * uGain, t.a * k);
}`

/** x, y, z relativos al centro de la nebulosa; tamaño; hueco central; giro; intensidad. */
const layers = [
  { z: -34, s: 150, hole: 0, back: 1, rot: 0, scale: 5.2, gain: 0.9, x: 0, y: 4 },
  { z: -21, s: 92, hole: 0, back: 0, rot: 0.06, scale: 4.4, gain: 0.85, x: 4, y: 0 },
  { z: -11, s: 66, hole: 0.2, back: 0, rot: -0.08, scale: 3.8, gain: 0.8, x: -3, y: 1 },
  { z: -2, s: 52, hole: 0.3, back: 0, rot: 0.12, scale: 3.4, gain: 0.75, x: 2, y: -1 },
  { z: 6, s: 42, hole: 0.36, back: 0, rot: -0.1, scale: 3.1, gain: 0.7, x: 0, y: 0 },
  { z: 13, s: 35, hole: 0.42, back: 0, rot: 0.16, scale: 2.8, gain: 0.66, x: 0, y: 0.4 },
]

export default function NebulaLayers({ q }: { q: Quality }) {
  const { gl, invalidate } = useThree()
  const group = useRef<THREE.Group>(null)
  const baked = useRef(0)
  const list = useMemo(() => (q.gas >= 7 ? layers : layers.filter((_, i) => i % 2 === 0)), [q.gas])

  const p = useMemo(() => {
    const S = q.bigTex ? 1024 : 512
    const rts = list.map(() => {
      const rt = new THREE.WebGLRenderTarget(S, S, { depthBuffer: false, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, type: THREE.HalfFloatType })
      rt.texture.anisotropy = 4
      return rt
    })
    const mats = list.map((l, i) => new THREE.ShaderMaterial({
      vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide,
      uniforms: { uMap: { value: rts[i].texture }, uFade: { value: 0 }, uTime: U.time, uGain: { value: l.gain } },
    }))
    const tmp = maps.map(() => new THREE.WebGLRenderTarget(S, S, { depthBuffer: false, format: THREE.RedFormat, type: THREE.HalfFloatType }))
    const warp = { uWx: { value: tmp[0].texture }, uWy: { value: tmp[1].texture }, uScale: { value: 4 } }
    const common = { vertexShader: fsVertex, depthTest: false, depthWrite: false, blending: THREE.NoBlending } as const
    const nm = new THREE.ShaderMaterial({ ...common, fragmentShader: noise, uniforms: { ...warp, uWx: { value: null }, uWy: { value: null }, uWarp: { value: 0 }, uFreq: { value: 1 }, uSwirl: { value: 0 }, uRidge: { value: 0 }, uOff: { value: new THREE.Vector3() }, uLac: { value: new THREE.Vector2() }, uOct: { value: 5 } } })
    const cm = new THREE.ShaderMaterial({ ...common, fragmentShader: compose, uniforms: { ...warp, uHole: { value: 0 }, uBack: { value: 0 }, uN: { value: tmp[2].texture }, uR: { value: tmp[3].texture }, uF: { value: tmp[4].texture }, uD: { value: tmp[5].texture } } })
    const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), quad = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(tri, nm)
    quad.frustumCulled = false
    scene.add(quad)
    return { rts, tmp, mats, nm, cm, quad, scene, cam, ready: false }
  }, [list, q.bigTex])

  useEffect(() => {
    baked.current = 0
    void started.then(() => Promise.all([[p.nm, p.tmp[0]], [p.cm, p.rts[0]]].map(([m, t]) => {
      p.quad.material = m as THREE.Material
      return compilePass(gl, p.scene, p.cam, t as THREE.WebGLRenderTarget)
    }))).then(() => { p.ready = true; invalidate() })
    return () => { [...p.rts, ...p.tmp].forEach(r => r.dispose()); p.mats.forEach(m => m.dispose()); p.nm.dispose(); p.cm.dispose() }
  }, [p, gl, invalidate])

  useFrame(() => {
    // un telón por frame, para no trabar la carga
    if (baked.current < list.length && p.ready) {
      const i = baked.current++
      const l = list[i], u = p.nm.uniforms, c = p.cm.uniforms, seed = 3.1 + layers.indexOf(l) * 5.37
      const keep = gl.getRenderTarget()
      u.uScale.value = l.scale
      maps.forEach((m, k) => {
        u.uWx.value = m.warp ? p.tmp[0].texture : null
        u.uWy.value = m.warp ? p.tmp[1].texture : null
        u.uWarp.value = m.warp
        u.uFreq.value = m.freq
        u.uSwirl.value = m.swirl
        u.uOct.value = m.oct
        u.uRidge.value = m.ridge
        u.uLac.value.set(m.ridge ? 2.05 : 2.03, m.ridge ? 11.3 : 17.17)
        u.uOff.value.set(...m.off(seed))
        p.quad.material = p.nm
        gl.setRenderTarget(p.tmp[k])
        gl.render(p.scene, p.cam)
      })
      c.uScale.value = l.scale
      c.uHole.value = l.hole
      c.uBack.value = l.back
      p.quad.material = p.cm
      gl.setRenderTarget(p.rts[i])
      gl.render(p.scene, p.cam)
      gl.setRenderTarget(keep)
      if (baked.current === list.length) p.tmp.forEach(t => t.dispose())
      else invalidate()
    }
    const g = group.current
    if (!g) return
    const f = win(J.t, 0.38, 0.95, 2.3, 2.5)
    g.visible = f > 0.002
    if (!g.visible) return
    p.mats.forEach(m => { m.uniforms.uFade.value = f })
  })

  return (
    <group ref={group}>
      {list.map((l, i) => (
        <mesh key={i} material={p.mats[i]} position={[C.nebula.x + l.x, C.nebula.y + l.y, C.nebula.z - 6 + l.z]} rotation={[0, 0, l.rot]} scale={l.s} renderOrder={1 + i * 0.01} frustumCulled={false}>
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  )
}
