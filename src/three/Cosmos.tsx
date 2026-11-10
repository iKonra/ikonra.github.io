import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

// Lo que hay en el espacio alrededor del recorrido de la cámara: planetas que pasan al costado,
// estrellas fugaces y líneas de "warp" que aparecen cuando scrolleás rápido.

// Luz de una estrella lejana, arriba a la izquierda
const LIGHT = new THREE.Vector3(-0.6, 0.45, 0.65).normalize()

const planetVertex = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;
void main(){
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vNormal = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}`

const planetFragment = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uLight;
uniform vec3 uAtmo;
uniform float uAtmoStrength;
uniform float uFade;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;
void main(){
  vec3 tex = texture2D(uMap, vUv).rgb;
  float ndl = dot(normalize(vNormal), uLight);
  float day = smoothstep(-0.12, 0.45, ndl);
  float fres = pow(1.0 - max(dot(normalize(vNormal), vView), 0.0), 2.5);
  vec3 col = tex * (0.025 + day * 1.15);
  // Atmósfera: borde iluminado del lado del sol
  col += uAtmo * fres * uAtmoStrength * smoothstep(-0.3, 0.6, ndl);
  gl_FragColor = vec4(col, uFade);
}`

const cloudFragment = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uLight;
uniform float uFade;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;
void main(){
  float a = texture2D(uMap, vUv).r;
  float day = smoothstep(-0.1, 0.5, dot(normalize(vNormal), uLight));
  gl_FragColor = vec4(vec3(1.0) * (0.03 + day), a * 0.85 * uFade);
}`

const glowFragment = /* glsl */ `
uniform vec3 uAtmo;
uniform vec3 uLight;
uniform float uFade;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;
void main(){
  // Halo exterior: se dibuja la cara de atrás de una esfera un poco más grande;
  // brilla pegado al borde del planeta y se apaga hacia afuera
  float rim = pow(clamp(-dot(normalize(vNormal), vView), 0.0, 1.0), 2.0) * 2.2;
  float lit = smoothstep(-0.4, 0.7, dot(normalize(vNormal), uLight));
  gl_FragColor = vec4(uAtmo, rim * lit * uFade);
}`

const ringVertex = /* glsl */ `
varying vec3 vWorld;
varying vec2 vXY;
void main(){
  vXY = position.xy;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`

const ringFragment = /* glsl */ `
uniform sampler2D uMap;
uniform float uInner;
uniform float uOuter;
uniform vec3 uLight;
uniform vec3 uCenter;
uniform float uRadius;
uniform float uFade;
varying vec3 vWorld;
varying vec2 vXY;
void main(){
  float r = (length(vXY) - uInner) / (uOuter - uInner);
  vec4 t = texture2D(uMap, vec2(r, 0.5));
  // Sombra del planeta sobre los anillos: ¿el rayo hacia el sol choca con la esfera?
  vec3 oc = vWorld - uCenter;
  float b = dot(oc, uLight);
  float c = dot(oc, oc) - uRadius * uRadius;
  float shadow = (b < 0.0 && b * b - c > 0.0) ? 0.12 : 1.0;
  gl_FragColor = vec4(t.rgb * (0.25 + 0.95 * shadow), t.a * uFade);
}`

type PlanetSpec = {
  pos: [number, number, number]
  r: number
  map: string
  atmo: string
  atmoStrength: number
  tilt: number
  spin: number
  clouds?: string
  ring?: { inner: number; outer: number; map: string; tilt: [number, number, number] }
}

const planets: PlanetSpec[] = [
  // Gigante gaseoso: se ve en "Sobre mí"
  { pos: [6.8, -3.6, -16], r: 2.8, map: '/textures/gas-giant.webp', atmo: '#ffc9a0', atmoStrength: 0.5, tilt: 0.12, spin: 0.025 },
  // Planeta con anillos: aparece en "Trayectoria"
  { pos: [-6.2, 2.6, -40], r: 1.7, map: '/textures/ringed.webp', atmo: '#ffe7b8', atmoStrength: 0.35, tilt: 0.45, spin: 0.04,
    ring: { inner: 2.2, outer: 4.0, map: '/textures/rings.png', tilt: [1.2, 0.2, 0.35] } },
  // La Tierra (NASA) pasa por abajo en el contacto
  { pos: [5.6, -3.4, -48], r: 1.5, map: '/textures/earth.webp', atmo: '#5aa8ff', atmoStrength: 1.1, tilt: 0.41, spin: 0.05, clouds: '/textures/earth-clouds.webp' },
  // Y la Luna (NASA), arriba
  { pos: [3.4, 2.7, -56], r: 0.7, map: '/textures/moon.webp', atmo: '#ffffff', atmoStrength: 0.08, tilt: 0.1, spin: 0.03 },
]

const loader = new THREE.TextureLoader()
function loadTex(url: string) {
  const t = loader.load(url)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

function Planet({ spec, xScale }: { spec: PlanetSpec; xScale: number }) {
  const root = useRef<THREE.Group>(null)
  const body = useRef<THREE.Mesh>(null)
  const cloud = useRef<THREE.Mesh>(null)
  const { camera } = useThree()

  const mats = useMemo(() => {
    const atmo = new THREE.Color(spec.atmo)
    const planet = new THREE.ShaderMaterial({
      vertexShader: planetVertex, fragmentShader: planetFragment, transparent: true,
      uniforms: { uMap: { value: loadTex(spec.map) }, uLight: { value: LIGHT }, uAtmo: { value: atmo }, uAtmoStrength: { value: spec.atmoStrength }, uFade: { value: 0 } },
    })
    const glow = new THREE.ShaderMaterial({
      vertexShader: planetVertex, fragmentShader: glowFragment, transparent: true, side: THREE.BackSide,
      depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uAtmo: { value: atmo }, uLight: { value: LIGHT }, uFade: { value: 0 } },
    })
    const clouds = spec.clouds ? new THREE.ShaderMaterial({
      vertexShader: planetVertex, fragmentShader: cloudFragment, transparent: true, depthWrite: false,
      uniforms: { uMap: { value: loader.load(spec.clouds) }, uLight: { value: LIGHT }, uFade: { value: 0 } },
    }) : null
    const ring = spec.ring ? new THREE.ShaderMaterial({
      vertexShader: ringVertex, fragmentShader: ringFragment, transparent: true, side: THREE.DoubleSide, depthWrite: false,
      uniforms: {
        uMap: { value: loadTex(spec.ring.map) }, uInner: { value: spec.ring.inner }, uOuter: { value: spec.ring.outer },
        uLight: { value: LIGHT }, uCenter: { value: new THREE.Vector3() }, uRadius: { value: spec.r }, uFade: { value: 0 },
      },
    }) : null
    return { planet, glow, clouds, ring }
  }, [spec])

  useFrame((_, delta) => {
    // Aparece recién cuando la cámara se acerca, así de lejos no se cruza con los títulos
    const d = camera.position.z - spec.pos[2]
    const fade = THREE.MathUtils.smoothstep(22 - d, 0, 6)
    const show = fade > 0.001 && d > -2
    if (root.current) root.current.visible = show
    if (!show) return
    mats.planet.uniforms.uFade.value = fade
    mats.glow.uniforms.uFade.value = fade
    if (mats.clouds) mats.clouds.uniforms.uFade.value = fade
    if (mats.ring) {
      mats.ring.uniforms.uFade.value = fade
      root.current!.getWorldPosition(mats.ring.uniforms.uCenter.value)
    }
    if (body.current) body.current.rotation.y += delta * spec.spin
    if (cloud.current) cloud.current.rotation.y += delta * spec.spin * 1.4
  })

  return (
    <group ref={root} position={[spec.pos[0] * xScale, spec.pos[1], spec.pos[2]]}>
      <group rotation={[0, 0, spec.tilt]}>
        <mesh ref={body} material={mats.planet}><sphereGeometry args={[spec.r, 96, 64]} /></mesh>
        {mats.clouds && <mesh ref={cloud} material={mats.clouds}><sphereGeometry args={[spec.r * 1.012, 96, 64]} /></mesh>}
      </group>
      <mesh material={mats.glow}><sphereGeometry args={[spec.r * 1.16, 64, 48]} /></mesh>
      {spec.ring && mats.ring && (
        <mesh rotation={spec.ring.tilt} material={mats.ring}><ringGeometry args={[spec.ring.inner, spec.ring.outer, 192, 1]} /></mesh>
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

export default function Cosmos({ mobile, warp }: { mobile: boolean; warp: boolean }) {
  const { size } = useThree()
  // En pantallas angostas los planetas se acercan al centro para que se vean
  const xScale = Math.min(1, Math.max(0.45, size.width / size.height / 1.6))
  return (
    <>
      {planets.map((p, i) => <Planet key={i} spec={p} xScale={xScale} />)}
      <ShootingStars />
      {warp && <Warp count={mobile ? 140 : 320} />}
    </>
  )
}
