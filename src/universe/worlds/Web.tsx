import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { hash, noise3, planetVertex } from '../glsl'
import { J, worldColors } from '../journey'
import { U, mulberry } from '../shared'
import { Atmosphere, Slot, type WorldState } from './common'

// Desarrollo web: un planeta en construcción. Abajo ya está terminado; arriba todavía es plano y grilla,
// y un frente de luz lo va construyendo con bloques que llegan desde la órbita. Las ventanas son sus satélites.

const R = 1.5
const planet = /* glsl */ `
varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec2 vUv;
uniform vec3 uLight, uLightColor; uniform float uTime, uBuild; uniform int uOct;
${hash}
${noise3}
float grid(vec2 u, float w){ vec2 f = abs(fract(u) - .5), d = fwidth(u); vec2 l = smoothstep(.5 - d * w, .5 - d * w * .2, f); return max(l.x, l.y); }
void main(){
  vec3 n = normalize(vN), V = normalize(cameraPosition - vW), p = normalize(vL);
  // frente de obra en bloques
  vec2 ll = vec2(atan(p.z, p.x) / 6.28318, asin(clamp(p.y, -1., 1.)) / 3.14159);
  vec2 cell = floor(ll * vec2(64., 32.));
  float block = hash21(cell);
  float front = uBuild + (block - .5) * .24 + sin(ll.x * 12.6 + uTime * .4) * .04;
  float y = (cell.y + .5) / 32. * 2.;
  float done = step(y, front);
  float near = exp(-abs(y - front) * 9.);
  // ---- terminado
  float h = fbm(p * 2.1 + 11., uOct + 2), land = smoothstep(.0, .04, h);
  vec3 sea = mix(vec3(.008, .03, .10), vec3(.02, .10, .24), smoothstep(-.4, 0., h));
  vec3 ter = mix(vec3(.05, .12, .14), vec3(.20, .24, .34), smoothstep(.05, .4, h));
  vec3 alb = mix(sea, ter, land);
  float d = max(dot(n, uLight), 0.), soft = smoothstep(-.3, .6, dot(n, uLight));
  vec3 col = alb * (uLightColor * d * 2.4 + vec3(.05, .07, .13));
  col += (1. - land) * pow(max(dot(n, normalize(uLight + V)), 0.), 70.) * uLightColor * .8;
  vec3 g = p * 30.; vec3 r = hash33(floor(g));
  col += vec3(.55, .72, 1.) * land * step(.8, r.x) * smoothstep(.32, 0., length(fract(g) - .5)) * mix(2.2, .35, soft);
  float clouds = smoothstep(.08, .5, fbm(p * 3. + vec3(uTime * .012, 0., 0.) + fbm(p * 5., 3), uOct + 1));
  col = mix(col, vec3(.75, .82, 1.) * (d * 1.1 + .05), clouds * .6);
  // ---- en construcción: plano técnico
  float gA = grid(ll * vec2(64., 32.), 1.1), gB = grid(ll * vec2(16., 8.), 1.5);
  vec3 holo = vec3(.010, .016, .045) + vec3(.20, .34, 1.) * (gA * .34 + gB * .75);
  holo += vec3(.35, .5, 1.) * step(.93, block) * (.25 + .35 * sin(uTime * 3. + block * 90.));
  float scan = exp(-pow(abs(fract(p.y * .5 - uTime * .12) * 8. - 4.), 2.) * 3.);
  holo += vec3(.3, .5, 1.) * scan * .16;
  holo *= .55 + .75 * pow(max(1. - max(dot(n, V), 0.), 0.), 1.2);
  col = mix(holo, col, done);
  // frente: bloques recién colocados
  col += vec3(.45, .62, 1.) * near * (gA * .9 + step(.45, block) * .7) * (1.1 + .5 * sin(uTime * 6. + block * 60.));
  col += vec3(.3, .42, 1.) * pow(max(1. - max(dot(n, V), 0.), 0.), 3.5) * (.25 + .8 * soft);
  gl_FragColor = vec4(col, 1.);
}`

// Ventana de navegador: vidrio oscuro con una interfaz que se arma sola
const ui = /* glsl */ `
varying vec2 vUv; uniform float uTime, uSeed, uOn; uniform vec3 uAccent;
float box(vec2 p, vec2 a, vec2 b){ vec2 s = smoothstep(a - .004, a, p) * smoothstep(b + .004, b, p); return s.x * s.y; }
void main(){
  vec2 p = vUv; vec3 c = vec3(.012, .016, .034);
  float bar = step(.87, p.y);
  c = mix(c, vec3(.035, .045, .09), bar);
  for(int i = 0; i < 3; i++){ float d = length((p - vec2(.045 + float(i) * .038, .935)) * vec2(1.54, 1.)); c += smoothstep(.02, .014, d) * (i == 0 ? vec3(1., .35, .2) : i == 1 ? vec3(1., .75, .25) : vec3(.3, .85, .45)) * .9; }
  c += box(p, vec2(.2, .915), vec2(.8, .955)) * vec3(.07, .09, .17);
  float t = fract(uTime * .07 + uSeed) * 1.4;
  float a = smoothstep(0., .12, t), b = smoothstep(.12, .3, t), d2 = smoothstep(.28, .45, t), e = smoothstep(.42, .62, t);
  c += box(p, vec2(.06, .56), vec2(.06 + .42 * a, .80)) * mix(uAccent, vec3(1.), p.x * .35) * .75;
  c += box(p, vec2(.54, .74), vec2(.54 + .38 * b, .78)) * vec3(.55, .62, .8);
  c += box(p, vec2(.54, .66), vec2(.54 + .30 * b, .69)) * vec3(.26, .3, .42);
  c += box(p, vec2(.54, .59), vec2(.54 + .34 * b, .62)) * vec3(.26, .3, .42);
  for(int i = 0; i < 3; i++){ float x = .06 + float(i) * .3; c += box(p, vec2(x, .30), vec2(x + .26, .30 + .2 * d2)) * vec3(.06, .08, .16); c += box(p, vec2(x + .02, .33), vec2(x + .02 + .18 * d2, .36)) * vec3(.4, .46, .62); }
  for(int i = 0; i < 9; i++){ float x = .06 + float(i) * .098, hh = .05 + .14 * fract(sin(float(i) * 12.9 + uSeed * 78.) * 43758.5); c += box(p, vec2(x, .06), vec2(x + .07, .06 + hh * e)) * mix(uAccent, vec3(.7, .85, 1.), float(i) / 9.) * .8; }
  gl_FragColor = vec4(c * (.35 + uOn * 1.05), 1.);
}`
const uvVertex = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`

const sats = [
  { r: 2.2, a: 0.5, y: 0.75, s: 0.62, sp: 0.1 },
  { r: 2.35, a: 2.5, y: -0.7, s: 0.5, sp: 0.085 },
  { r: 2.1, a: 4.4, y: 0.1, s: 0.44, sp: 0.12 },
]
const BLOCKS = 70
const o = new THREE.Object3D(), tmp = new THREE.Vector3(), q = new THREE.Quaternion()

export default function Web({ detail }: { detail: number }) {
  const state = useMemo<WorldState>(() => ({ k: 0, d: -9 }), [])
  const groups = useRef<(THREE.Group | null)[]>([]), body = useRef<THREE.Mesh>(null), blocks = useRef<THREE.InstancedMesh>(null)
  const m = useMemo(() => {
    const rnd = mulberry(5)
    return {
      k: 0,
      planet: new THREE.ShaderMaterial({ vertexShader: planetVertex, fragmentShader: planet, uniforms: { uLight: U.light, uLightColor: U.lightColor, uTime: U.time, uBuild: { value: -1 }, uOct: { value: detail } } }),
      win: new RoundedBoxGeometry(2, 1.3, 0.07, 4, 0.05),
      frame: new THREE.MeshPhysicalMaterial({ color: '#10131f', roughness: 0.3, metalness: 0.5, clearcoat: 1 }),
      ui: sats.map((_, i) => new THREE.ShaderMaterial({ vertexShader: uvVertex, fragmentShader: ui, uniforms: { uTime: U.time, uSeed: { value: i * 0.37 }, uOn: { value: 0 }, uAccent: { value: new THREE.Color(worldColors[2]) } } })),
      block: new THREE.MeshStandardMaterial({ color: '#7f9bff', emissive: '#3f66ff', emissiveIntensity: 1.6, roughness: 0.4 }),
      seeds: Array.from({ length: BLOCKS }, () => ({ a: rnd() * 6.283, p: rnd(), sp: 0.1 + rnd() * 0.12, l: rnd(), s: 0.014 + rnd() * 0.02, side: rnd() * 2 - 1 })),
    }
  }, [detail])

  useFrame(({ camera }, delta) => {
    if (Math.abs(state.d) > 0.9) return
    const t = U.time.value
    m.k += (state.k - m.k) * Math.min(1, delta * 1.6)
    const build = -1.05 + m.k * (1.22 + Math.sin(t * 0.18) * 0.2)
    m.planet.uniforms.uBuild.value = build
    if (body.current) body.current.rotation.y = t * 0.05
    groups.current.forEach((g, i) => {
      if (!g) return
      const s = sats[i], a = s.a + t * s.sp + (1 - m.k) * 2
      g.position.set(Math.cos(a) * s.r, s.y + Math.sin(t * 0.5 + i) * 0.08, Math.sin(a) * s.r)
      g.quaternion.copy(camera.quaternion)
      g.rotateY(Math.sin(t * 0.4 + i * 2) * 0.3 - Math.cos(a) * 0.45 + J.mx * 0.2)
      g.rotateX(0.1 - J.my * 0.15)
      g.scale.setScalar(s.s * (0.3 + 0.7 * m.k))
      m.ui[i].uniforms.uOn.value = m.k
    })
    const im = blocks.current
    if (im) {
      m.seeds.forEach((b, i) => {
        const u = (t * b.sp + b.p) % 1, e = u * u * (3 - 2 * u)
        const y = THREE.MathUtils.clamp(build, -0.9, 0.9) + b.side * 0.14
        const rr = Math.sqrt(Math.max(0.02, 1 - y * y))
        const from = 2.5 + b.l * 0.8
        tmp.set(Math.cos(b.a + (1 - e) * 1.1) * THREE.MathUtils.lerp(from, rr * R, e), THREE.MathUtils.lerp(1.2 + b.side * 0.8, y * R, e), Math.sin(b.a + (1 - e) * 1.1) * THREE.MathUtils.lerp(from, rr * R, e))
        o.position.copy(tmp)
        o.quaternion.copy(q.setFromEuler(new THREE.Euler(t * 2 + i, t * 1.4 + i, 0)))
        o.scale.setScalar(b.s * m.k * Math.min(1, u * 8) * (u > 0.97 ? (1 - u) * 33 : 1))
        o.updateMatrix()
        im.setMatrixAt(i, o.matrix)
      })
      im.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <Slot i={2} state={state}>
      <mesh ref={body} material={m.planet} scale={R}><sphereGeometry args={[1, 96, 64]} /></mesh>
      <Atmosphere r={R * 1.15} planet={R} color={worldColors[2]} i={1.05} pow={2.6} />
      <instancedMesh ref={blocks} args={[undefined, undefined, BLOCKS]} material={m.block} frustumCulled={false}><boxGeometry args={[1, 1, 1]} /></instancedMesh>
      {sats.map((_, i) => (
        <group key={i} ref={el => { groups.current[i] = el }}>
          <mesh geometry={m.win} material={m.frame} />
          <mesh material={m.ui[i]} position={[0, 0, 0.037]}><planeGeometry args={[1.9, 1.2]} /></mesh>
        </group>
      ))}
    </Slot>
  )
}
