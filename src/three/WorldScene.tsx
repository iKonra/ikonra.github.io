import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { palettes, sceneState } from './sceneState'
import { shapes } from './shapes'
import Cosmos from './Cosmos'

// Un solo mundo detrás de toda la página: la cámara vuela entre estrellas con el scroll
// y un enjambre de partículas viaja de sección en sección cambiando de figura.

const DEPTH = 46 // distancia que recorre la cámara de arriba a abajo
const SWARM_DIST = 4.6

type Pose = { x: number; y: number; s: number }
// Posición y figura del enjambre en cada sección. shape -1 = la que eligió "Me aburrí".
const poses: Record<string, { wide: Pose; narrow: Pose; shape: number }> = {
  top: { wide: { x: 0.24, y: 0, s: 1 }, narrow: { x: 0.06, y: -0.3, s: 0.62 }, shape: -1 },
  about: { wide: { x: 0.4, y: -0.04, s: 1.1 }, narrow: { x: 0.2, y: 0.3, s: 0.6 }, shape: 2 },
  journey: { wide: { x: 0.4, y: 0.12, s: 0.6 }, narrow: { x: 0.34, y: 0.36, s: 0.4 }, shape: 0 },
  contact: { wide: { x: 0.28, y: 0.02, s: 1.05 }, narrow: { x: 0.3, y: 0.36, s: 0.42 }, shape: 5 },
}
const sectionIds = Object.keys(poses)

/** Cuánto de la pantalla ocupa cada sección (0 a 1). */
function presences(vh: number) {
  return sectionIds.map(id => {
    const el = document.getElementById(id)
    if (!el) return 0
    const r = el.getBoundingClientRect()
    return Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) / vh
  })
}

const swarmVertex = /* glsl */ `
uniform float uFrom;
uniform float uTo;
uniform float uT;
uniform float uTime;
uniform float uKick;
uniform float uSize;
uniform float uPixelRatio;
uniform vec3 uMouse;
uniform vec3 uColorA;
uniform vec3 uColorB;
attribute vec3 p1;
attribute vec3 p2;
attribute vec3 p3;
attribute vec3 p4;
attribute vec3 p5;
attribute vec4 aRand;
varying vec3 vColor;
varying float vAlpha;

vec3 shapeAt(float i) {
  if (i < 0.5) return position;
  if (i < 1.5) return p1;
  if (i < 2.5) return p2;
  if (i < 3.5) return p3;
  if (i < 4.5) return p4;
  return p5;
}

void main() {
  // Cada partícula arranca su viaje con un pequeño retraso propio
  float t = clamp(uT * 1.5 - aRand.x * 0.5, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);
  vec3 p = mix(shapeAt(uFrom), shapeAt(uTo), t);

  // A mitad de camino se arremolinan
  float mid = sin(t * 3.14159);
  p += vec3(sin(aRand.y * 31.0 + uTime * 1.3), cos(aRand.z * 23.0 + uTime), sin(aRand.w * 17.0 - uTime * 1.1)) * 0.45 * mid;
  // Respiración suave
  p += normalize(p + 1e-4) * sin(uTime * 1.6 + aRand.w * 6.2831) * 0.025;
  // Explosión del botón "Me aburrí"
  p += normalize(p + 1e-4) * uKick * (0.4 + aRand.y * 1.4);

  // El cursor las aparta
  vec3 d = p - uMouse;
  float dist = length(d);
  float push = smoothstep(0.85, 0.0, dist);
  p += normalize(d + 1e-4) * push * 0.6;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.45 + aRand.z * 1.1) * uPixelRatio / -mv.z;

  vColor = mix(uColorA, uColorB, aRand.x * aRand.x) + push * 0.6;
  vAlpha = 0.55 + aRand.y * 0.45;
}`

const swarmFragment = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vColor, a * a * vAlpha);
}`

function Swarm({ count, poseRef }: { count: number; poseRef: React.MutableRefObject<THREE.Points | null> }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const all = shapes.map(fn => fn(count))
    g.setAttribute('position', new THREE.BufferAttribute(all[0], 3))
    all.slice(1).forEach((arr, i) => g.setAttribute(`p${i + 1}`, new THREE.BufferAttribute(arr, 3)))
    const rand = new Float32Array(count * 4)
    for (let i = 0; i < rand.length; i++) rand[i] = Math.random()
    g.setAttribute('aRand', new THREE.BufferAttribute(rand, 4))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4)
    return g
  }, [count])

  const uniforms = useMemo(
    () => ({
      uFrom: { value: 0 },
      uTo: { value: 0 },
      uT: { value: 1 },
      uTime: { value: 0 },
      uKick: { value: 0 },
      uSize: { value: 30 },
      uPixelRatio: { value: Math.min(devicePixelRatio, 2) },
      uMouse: { value: new THREE.Vector3(99, 99, 99) },
      uColorA: { value: new THREE.Color(palettes[0][0]) },
      uColorB: { value: new THREE.Color(palettes[0][1]) },
    }),
    [],
  )

  return (
    <points ref={poseRef} geometry={geo}>
      <shaderMaterial
        vertexShader={swarmVertex}
        fragmentShader={swarmFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function World({ particles, stars }: { particles: number; stars: number }) {
  const { camera, size, raycaster } = useThree()
  const swarm = useRef<THREE.Points | null>(null)
  const pointer = useRef(new THREE.Vector2())
  const pose = useRef({ x: 0, y: 0, s: 0 })
  const morph = useRef({ to: 0 })
  const tmp = useMemo(() => ({ plane: new THREE.Plane(), hit: new THREE.Vector3(), n: new THREE.Vector3(), a: new THREE.Color(), b: new THREE.Color() }), [])
  const wide = size.width > 860
  // En pantallas táctiles no hay cursor que siga: no apartamos partículas
  const fine = useMemo(() => matchMedia('(hover: hover) and (pointer: fine)').matches, [])

  const starGeo = useMemo(() => {
    const pos = new Float32Array(stars * 3)
    const scale = new Float32Array(stars)
    for (let i = 0; i < stars; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 18
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12
      pos[i * 3 + 2] = 6 - Math.random() * (DEPTH + 12)
      scale[i] = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aScale', new THREE.BufferAttribute(scale, 1))
    return g
  }, [stars])
  const starUniforms = useMemo(() => ({ uTime: { value: 0 }, uPixelRatio: { value: Math.min(devicePixelRatio, 2) } }), [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const vh = innerHeight
    const max = Math.max(1, document.documentElement.scrollHeight - vh)
    const frac = scrollY / max

    // Cámara: avanza entre las estrellas con el scroll y se inclina con el mouse
    pointer.current.lerp(state.pointer, 1 - Math.pow(0.001, dt))
    const camZ = 5 - frac * DEPTH
    camera.position.z += (camZ - camera.position.z) * (1 - Math.pow(0.0005, dt))
    camera.position.x = pointer.current.x * 0.25
    camera.position.y = pointer.current.y * 0.18
    camera.lookAt(camera.position.x * 0.5, camera.position.y * 0.5, camera.position.z - 10)
    starUniforms.uTime.value += dt

    // Pose: promedio de las secciones visibles. Figura: la de la sección que más se ve.
    const pres = presences(vh)
    const total = pres.reduce((a, b) => a + b, 0)
    let tx = 0, ty = 0, ts = 0, best = 0
    pres.forEach((p, i) => {
      const ps = poses[sectionIds[i]][wide ? 'wide' : 'narrow']
      tx += ps.x * p; ty += ps.y * p; ts += ps.s * p
      if (p > pres[best]) best = i
    })
    if (total > 0.001) { tx /= total; ty /= total }
    ts = total > 0.001 ? ts / Math.max(total, 1) : 0
    const k = 1 - Math.pow(0.004, dt)
    pose.current.x += (tx - pose.current.x) * k
    pose.current.y += (ty - pose.current.y) * k
    pose.current.s += (ts - pose.current.s) * k

    const pts = swarm.current
    if (!pts) return
    const u = (pts.material as THREE.ShaderMaterial).uniforms

    const shapeWanted = poses[sectionIds[best]].shape
    const target = shapeWanted < 0 ? sceneState.shape : shapeWanted
    if (target !== morph.current.to) {
      // Arranca desde la figura a la que iba, aunque no haya llegado
      u.uFrom.value = u.uT.value > 0.5 ? morph.current.to : u.uFrom.value
      u.uTo.value = target
      u.uT.value = 0
      morph.current.to = target
    }
    u.uT.value = Math.min(1, u.uT.value + dt / 1.8)

    sceneState.kick = Math.max(0, sceneState.kick - dt * 1.2)
    u.uKick.value = sceneState.kick * sceneState.kick
    u.uTime.value += dt

    const pal = palettes[sceneState.palette]
    const mix = 1 - Math.pow(0.02, dt)
    u.uColorA.value.lerp(tmp.a.set(pal[0]), mix)
    u.uColorB.value.lerp(tmp.b.set(pal[1]), mix)

    const h = 2 * SWARM_DIST * Math.tan(THREE.MathUtils.degToRad(45 / 2))
    const w = h * (size.width / size.height)
    const base = Math.min(1.1, w / 3.2, h / 3)
    pts.visible = pose.current.s > 0.01
    pts.position.set(camera.position.x * 0.5 + pose.current.x * w, camera.position.y * 0.5 + pose.current.y * h, camera.position.z - SWARM_DIST)
    pts.scale.setScalar(base * pose.current.s)
    pts.rotation.y += dt * 0.18
    pts.rotation.x = 0.35 + pointer.current.y * 0.3
    pts.rotation.z = pointer.current.x * 0.15
    u.uSize.value = (wide ? 34 : 26) * Math.max(0.6, pose.current.s)

    // Punto del cursor en el espacio del enjambre, para apartar las partículas
    pts.updateMatrixWorld()
    raycaster.setFromCamera(state.pointer, camera)
    tmp.plane.setFromNormalAndCoplanarPoint(tmp.n.set(0, 0, 1), pts.position)
    if (fine && raycaster.ray.intersectPlane(tmp.plane, tmp.hit)) u.uMouse.value.copy(pts.worldToLocal(tmp.hit))
  })

  return (
    <>
      <Cosmos mobile={particles < 10000} />
      <Swarm count={particles} poseRef={swarm} />
      <points geometry={starGeo}>
        <shaderMaterial
          vertexShader={starVertex}
          fragmentShader={starFragment}
          uniforms={starUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  )
}

const starVertex = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
attribute float aScale;
varying float vAlpha;
void main(){
  vec3 p = position;
  p.y += sin(uTime * 0.3 + position.x) * 0.06;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = (2.0 + aScale * 26.0) * uPixelRatio / -mv.z;
  // Se apagan al acercarse demasiado a la cámara
  vAlpha = (0.25 + aScale * 0.6) * smoothstep(0.4, 2.0, -mv.z);
  gl_Position = projectionMatrix * mv;
}`

const starFragment = /* glsl */ `
varying float vAlpha;
void main(){
  float d = length(gl_PointCoord - 0.5);
  gl_FragColor = vec4(1.0, 0.93, 0.86, smoothstep(0.5, 0.0, d) * vAlpha);
}`

export default function WorldScene() {
  const [visible, setVisible] = useState(true)
  const isMobile = useMemo(() => matchMedia('(max-width: 860px), (pointer: coarse)').matches, [])
  const reduced = useMemo(() => matchMedia('(prefers-reduced-motion: reduce)').matches, [])

  // Se pausa con la pestaña oculta o mientras Proyectos tapa toda la pantalla
  useEffect(() => {
    const check = () => {
      const p = document.getElementById('projects')?.getBoundingClientRect()
      const covered = !!p && p.top <= 0 && p.bottom >= innerHeight
      setVisible(!document.hidden && !covered)
    }
    check()
    addEventListener('scroll', check, { passive: true })
    document.addEventListener('visibilitychange', check)
    return () => { removeEventListener('scroll', check); document.removeEventListener('visibilitychange', check) }
  }, [])

  return (
    <div className="world" aria-hidden>
      <Canvas
        frameloop={!visible ? 'never' : reduced ? 'demand' : 'always'}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        camera={{ position: [0, 0, 5], fov: 45, near: 0.1, far: 80 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        eventSource={document.body}
        eventPrefix="client"
      >
        <World particles={isMobile ? 7000 : 16000} stars={isMobile ? 700 : 1800} />
      </Canvas>
    </div>
  )
}
