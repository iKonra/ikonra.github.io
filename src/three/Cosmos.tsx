import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

// Lo que hay en el espacio alrededor del recorrido de la cámara: planetas que pasan al costado,
// estrellas fugaces y líneas de "warp" que aparecen cuando scrolleás rápido.

const noiseGlsl = /* glsl */ `
float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; } return v; }
`

const planetVertex = /* glsl */ `
varying vec3 vNormal;
varying vec3 vPos;
varying vec3 vView;
void main(){
  vPos = position;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vNormal = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}`

const planetFragment = /* glsl */ `
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;
uniform vec3 uAtmo;
uniform float uBands;
uniform float uCraters;
uniform float uTime;
uniform float uFade;
varying vec3 vNormal;
varying vec3 vPos;
varying vec3 vView;
${noiseGlsl}
void main(){
  vec3 n = normalize(vPos);
  float turb = fbm(n * 3.0 + vec3(uTime * 0.02, 0.0, 0.0));
  // Bandas de gigante gaseoso o superficie con cráteres
  float bands = sin(n.y * uBands + turb * 4.0) * 0.5 + 0.5;
  vec3 col = mix(uA, uB, bands);
  col = mix(col, uC, smoothstep(0.55, 0.8, fbm(n * 6.0)) * 0.6);
  float crater = smoothstep(0.62, 0.7, fbm(n * 9.0)) * uCraters;
  col *= 1.0 - crater * 0.45;
  // Luz de una estrella lejana, con terminador suave
  vec3 L = normalize(vec3(-0.6, 0.45, 0.65));
  float lit = smoothstep(-0.15, 0.6, dot(vNormal, L));
  float fres = pow(1.0 - max(dot(vNormal, vView), 0.0), 3.0);
  col = col * (0.06 + lit * 1.05) + uAtmo * fres * (0.25 + lit * 0.9);
  gl_FragColor = vec4(col, uFade);
}`

const ringVertex = /* glsl */ `
varying vec2 vXY;
void main(){ vXY = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`

const ringFragment = /* glsl */ `
uniform float uInner;
uniform float uOuter;
uniform vec3 uColor;
uniform float uFade;
varying vec2 vXY;
${noiseGlsl}
void main(){
  float r = (length(vXY) - uInner) / (uOuter - uInner);
  float bands = vnoise(vec3(r * 40.0, 0.0, 0.0)) * 0.6 + vnoise(vec3(r * 140.0, 3.0, 0.0)) * 0.4;
  float gap = smoothstep(0.52, 0.55, r) * (1.0 - smoothstep(0.58, 0.61, r));
  float a = smoothstep(0.0, 0.08, r) * (1.0 - smoothstep(0.9, 1.0, r)) * (0.35 + bands * 0.65) * (1.0 - gap * 0.9);
  gl_FragColor = vec4(uColor * (0.6 + bands * 0.6), a * 0.8 * uFade);
}`

type PlanetSpec = {
  pos: [number, number, number]
  r: number
  colors: [string, string, string, string]
  bands: number
  craters: number
  ring?: { inner: number; outer: number; color: string; tilt: [number, number, number] }
  spin: number
}

const planets: PlanetSpec[] = [
  // Gigante gaseoso naranja: se ve desde el inicio y pasa en "Sobre mí"
  { pos: [6.8, -3.6, -16], r: 2.8, colors: ['#8a3a17', '#f0b27a', '#ff5a1f', '#ffb27a'], bands: 22, craters: 0, spin: 0.03 },
  // Planeta helado con anillos: aparece en "Trayectoria"
  { pos: [-6.2, 2.6, -40], r: 1.7, colors: ['#1e3d7a', '#9fc4ff', '#e9f2ff', '#7fb0ff'], bands: 12, craters: 0, spin: 0.05,
    ring: { inner: 2.3, outer: 3.8, color: '#cfe0ff', tilt: [1.25, 0.25, 0.3] } },
  // Luna gris con cráteres, cerca del final
  { pos: [3.4, 2.6, -55], r: 0.85, colors: ['#4a4744', '#a6a19a', '#d8d2c8', '#f3efe7'], bands: 2, craters: 1, spin: 0.08 },
]

function Planet({ spec, xScale }: { spec: PlanetSpec; xScale: number }) {
  const ref = useRef<THREE.Group>(null)
  const mat = useMemo(
    () => new THREE.ShaderMaterial({
      vertexShader: planetVertex,
      fragmentShader: planetFragment,
      uniforms: {
        uA: { value: new THREE.Color(spec.colors[0]) },
        uB: { value: new THREE.Color(spec.colors[1]) },
        uC: { value: new THREE.Color(spec.colors[2]) },
        uAtmo: { value: new THREE.Color(spec.colors[3]) },
        uBands: { value: spec.bands },
        uCraters: { value: spec.craters },
        uTime: { value: 0 },
        uFade: { value: 0 },
      },
      transparent: true,
    }),
    [spec],
  )
  const ringMat = useMemo(
    () => spec.ring && new THREE.ShaderMaterial({
      vertexShader: ringVertex,
      fragmentShader: ringFragment,
      uniforms: { uInner: { value: spec.ring.inner }, uOuter: { value: spec.ring.outer }, uColor: { value: new THREE.Color(spec.ring.color) }, uFade: { value: 0 } },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    [spec],
  )
  const root = useRef<THREE.Group>(null)
  const { camera } = useThree()
  useFrame((_, delta) => {
    // Aparece recién cuando la cámara se acerca, así de lejos no se cruza con los títulos
    const d = camera.position.z - spec.pos[2]
    const fade = THREE.MathUtils.smoothstep(22 - d, 0, 6)
    mat.uniforms.uFade.value = fade
    if (ringMat) ringMat.uniforms.uFade.value = fade
    if (root.current) root.current.visible = fade > 0.001 && d > -2
    mat.uniforms.uTime.value += delta
    if (ref.current) ref.current.rotation.y += delta * spec.spin
  })
  return (
    <group ref={root} position={[spec.pos[0] * xScale, spec.pos[1], spec.pos[2]]}>
      <group ref={ref}>
        <mesh material={mat}><sphereGeometry args={[spec.r, 64, 48]} /></mesh>
      </group>
      {spec.ring && ringMat && (
        <mesh rotation={spec.ring.tilt} material={ringMat}><ringGeometry args={[spec.ring.inner, spec.ring.outer, 160, 1]} /></mesh>
      )}
    </group>
  )
}

const streakVertex = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
const streakFragment = /* glsl */ `
uniform float uAlpha;
varying vec2 vUv;
void main(){
  float head = pow(vUv.x, 3.0);
  float core = 1.0 - abs(vUv.y - 0.5) * 2.0;
  gl_FragColor = vec4(1.0, 0.92, 0.82, head * core * uAlpha);
}`

/** Estrellas fugaces: cada tanto cruza una en diagonal, en el espacio de la cámara. */
function ShootingStars() {
  const { camera } = useThree()
  const meshes = useRef<(THREE.Mesh | null)[]>([])
  const state = useMemo(() => [0, 1].map(i => ({ t: -1 - i * 3.5, x: 0, y: 0, dir: new THREE.Vector2() })), [])
  const mats = useMemo(() => state.map(() => new THREE.ShaderMaterial({
    vertexShader: streakVertex, fragmentShader: streakFragment, uniforms: { uAlpha: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })), [state])

  useFrame((_, delta) => {
    state.forEach((s, i) => {
      const m = meshes.current[i]
      if (!m) return
      s.t += delta
      if (s.t > 1) {
        // Espera al azar y relanza desde otro lugar
        s.t = -(2 + Math.random() * 5)
        s.x = (Math.random() - 0.2) * 5
        s.y = 1 + Math.random() * 1.6
        const a = Math.PI + 0.25 + Math.random() * 0.35
        s.dir.set(Math.cos(a), Math.sin(a))
      }
      const t = Math.max(0, s.t)
      mats[i].uniforms.uAlpha.value = s.t < 0 ? 0 : Math.sin(t * Math.PI) * 0.9
      m.position.set(camera.position.x + s.x + s.dir.x * t * 5, camera.position.y + s.y + s.dir.y * t * 5, camera.position.z - 7)
      m.rotation.z = Math.atan2(s.dir.y, s.dir.x) + Math.PI
    })
  })

  return (
    <>
      {mats.map((mat, i) => (
        <mesh key={i} ref={el => { meshes.current[i] = el }} material={mat}><planeGeometry args={[1.8, 0.025]} /></mesh>
      ))}
    </>
  )
}

const warpVertex = /* glsl */ `
uniform float uOff;
uniform float uLen;
attribute float aEnd;
void main(){
  vec3 p = position;
  // Las líneas viven en un tubo de 30 unidades delante de la cámara y se reciclan solas
  p.z = -mod(position.z - uOff * 1.6, 30.0) - 1.0 + aEnd * uLen;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`
const warpFragment = /* glsl */ `
uniform float uAlpha;
void main(){ gl_FragColor = vec4(0.95, 0.9, 1.0, uAlpha); }`

/** Líneas de velocidad: aparecen y se estiran según qué tan rápido scrolleás. */
function Warp({ count }: { count: number }) {
  const { camera } = useThree()
  const ref = useRef<THREE.LineSegments>(null)
  const last = useRef({ y: 0, v: 0 })
  const geo = useMemo(() => {
    const pos = new Float32Array(count * 6)
    const end = new Float32Array(count * 2)
    for (let i = 0; i < count; i++) {
      // Lejos del centro para no tapar el texto
      const a = Math.random() * Math.PI * 2, r = 1.6 + Math.random() * 5
      const x = Math.cos(a) * r * 1.4, y = Math.sin(a) * r, z = Math.random() * 30
      pos.set([x, y, z, x, y, z], i * 6)
      end.set([0, 1], i * 2)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aEnd', new THREE.BufferAttribute(end, 1))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 50)
    return g
  }, [count])
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: warpVertex, fragmentShader: warpFragment,
    uniforms: { uOff: { value: 0 }, uLen: { value: 0 }, uAlpha: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }), [])

  useFrame((_, delta) => {
    const dt = Math.max(delta, 1e-3)
    const speed = Math.abs(scrollY - last.current.y) / dt / innerHeight
    last.current.y = scrollY
    last.current.v += (Math.min(speed, 6) - last.current.v) * (1 - Math.pow(0.02, dt))
    const v = last.current.v
    mat.uniforms.uOff.value = camera.position.z
    mat.uniforms.uLen.value = Math.min(v * 1.6, 5)
    mat.uniforms.uAlpha.value = Math.min(Math.max(v - 0.4, 0) * 0.35, 0.55)
    ref.current?.position.set(camera.position.x, camera.position.y, camera.position.z)
  })

  return <lineSegments ref={ref} geometry={geo} material={mat} />
}

export default function Cosmos({ mobile }: { mobile: boolean }) {
  const { size } = useThree()
  // En pantallas angostas los planetas se acercan al centro para que se vean
  const xScale = Math.min(1, Math.max(0.45, size.width / size.height / 1.6))
  return (
    <>
      {planets.map((p, i) => <Planet key={i} spec={p} xScale={xScale} />)}
      <ShootingStars />
      <Warp count={mobile ? 140 : 320} />
    </>
  )
}
