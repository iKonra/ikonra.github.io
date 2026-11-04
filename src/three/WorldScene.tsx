import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { blobFragment, blobVertex } from './blobShaders'
import { palettes, sceneState } from './sceneState'

// Un solo mundo detrás de toda la página: la cámara vuela entre estrellas con el scroll
// y el blob viaja de sección en sección.

const DEPTH = 46 // distancia que recorre la cámara de arriba a abajo
const BLOB_DIST = 4.6

type Pose = { x: number; y: number; s: number }
// Posición del blob en cada sección, en fracciones del ancho y alto visibles
const poses: Record<string, { wide: Pose; narrow: Pose }> = {
  top: { wide: { x: 0.24, y: 0, s: 1 }, narrow: { x: 0.08, y: -0.32, s: 0.62 } },
  about: { wide: { x: 0.42, y: 0.32, s: 0.42 }, narrow: { x: 0.36, y: 0.38, s: 0.32 } },
  journey: { wide: { x: 0.42, y: 0.3, s: 0 }, narrow: { x: 0.36, y: 0.38, s: 0 } },
  contact: { wide: { x: 0.28, y: 0.02, s: 1.05 }, narrow: { x: 0.3, y: 0.36, s: 0.42 } },
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

function World({ detail, stars }: { detail: number; stars: number }) {
  const { camera, size } = useThree()
  const blob = useRef<THREE.Mesh>(null)
  const pointer = useRef(new THREE.Vector2())
  const pose = useRef({ x: 0, y: 0, s: 0 })
  const wide = size.width > 860

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0.22 },
      uPointer: { value: new THREE.Vector2() },
      uColorA: { value: new THREE.Color(palettes[0][0]) },
      uColorB: { value: new THREE.Color(palettes[0][1]) },
      uColorC: { value: new THREE.Color(palettes[0][2]) },
    }),
    [],
  )
  const target = useMemo(() => [new THREE.Color(), new THREE.Color(), new THREE.Color()], [])

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

    // Blob: promedio de las poses de las secciones visibles
    const pres = presences(vh)
    const total = pres.reduce((a, b) => a + b, 0)
    let tx = 0, ty = 0, ts = 0
    pres.forEach((p, i) => {
      const ps = poses[sectionIds[i]][wide ? 'wide' : 'narrow']
      tx += ps.x * p; ty += ps.y * p; ts += ps.s * p
    })
    if (total > 0.001) { tx /= total; ty /= total }
    ts = total > 0.001 ? ts / Math.max(total, 1) : 0
    const k = 1 - Math.pow(0.004, dt)
    pose.current.x += (tx - pose.current.x) * k
    pose.current.y += (ty - pose.current.y) * k
    pose.current.s += (ts - pose.current.s) * k

    const h = 2 * BLOB_DIST * Math.tan(THREE.MathUtils.degToRad(45 / 2))
    const w = h * (size.width / size.height)
    const base = Math.min(1.15, w / 3, h / 2.9)

    sceneState.kick = Math.max(0, sceneState.kick - dt * 1.4)
    const kick = sceneState.kick
    const pal = palettes[sceneState.palette]
    const mix = 1 - Math.pow(0.02, dt)
    target[0].set(pal[0]); target[1].set(pal[1]); target[2].set(pal[2])
    uniforms.uColorA.value.lerp(target[0], mix)
    uniforms.uColorB.value.lerp(target[1], mix)
    uniforms.uColorC.value.lerp(target[2], mix)
    uniforms.uTime.value += dt + kick * dt * 3
    uniforms.uPointer.value.copy(pointer.current)
    uniforms.uIntensity.value = 0.2 + Math.abs(pointer.current.x) * 0.08 + kick * kick * 0.35 + frac * 0.15

    const m = blob.current
    if (m) {
      m.visible = pose.current.s > 0.01
      m.position.set(camera.position.x * 0.5 + pose.current.x * w, camera.position.y * 0.5 + pose.current.y * h, camera.position.z - BLOB_DIST)
      m.scale.setScalar(base * pose.current.s * (1 - kick * (1 - kick) * 0.5))
      m.rotation.y += dt * (0.12 + kick * 2.2)
      m.rotation.x = pointer.current.y * 0.35 + frac * 6
      m.rotation.z = pointer.current.x * 0.2
    }
  })

  return (
    <>
      <mesh ref={blob}>
        <icosahedronGeometry args={[1.25, detail]} />
        <shaderMaterial vertexShader={blobVertex} fragmentShader={blobFragment} uniforms={uniforms} />
      </mesh>
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
        gl={{ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' }}
        eventSource={document.body}
        eventPrefix="client"
      >
        <World detail={isMobile ? 24 : 48} stars={isMobile ? 700 : 1800} />
      </Canvas>
    </div>
  )
}
