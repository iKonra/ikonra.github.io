import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { projectsState } from './projectsState'

const ORANGE = '#ff5a1f'
const INK = '#f3efe7'
const DARK = '#1a1916'

/** Reflejos sin descargar un HDR: un entorno de estudio generado en el momento. */
function Environment() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    return () => { env.dispose(); pmrem.dispose() }
  }, [gl, scene])
  return null
}

/** Tricapi: medalla hexagonal con el logo de los tres carpinchos, de los dos lados. */
function hexShape(r: number) {
  const sh = new THREE.Shape()
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 2 + (i / 6) * Math.PI * 2
    const x = Math.cos(a) * r, y = Math.sin(a) * r
    if (i === 0) sh.moveTo(x, y); else sh.lineTo(x, y)
  }
  sh.closePath()
  return sh
}
function TriModel() {
  const depth = 0.22
  const body = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(hexShape(1), { depth, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 5, curveSegments: 1 })
    g.translate(0, 0, -depth / 2)
    return g
  }, [])
  const rim = useMemo(() => {
    const sh = hexShape(1.16)
    sh.holes.push(hexShape(1.04) as unknown as THREE.Path)
    const g = new THREE.ExtrudeGeometry(sh, { depth: depth + 0.1, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 })
    g.translate(0, 0, -(depth + 0.1) / 2)
    return g
  }, [])
  const logo = useMemo(() => {
    const tex = new THREE.TextureLoader().load('/images/tricapi-logo.webp')
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    return tex
  }, [])
  const bodyMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#141210', roughness: 0.28, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08 }), [])
  const rimMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: ORANGE, roughness: 0.22, metalness: 0.55, clearcoat: 1 }), [])
  const logoMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: logo, color: INK, emissive: INK, emissiveMap: logo, emissiveIntensity: 0.35, transparent: true, roughness: 0.4, metalness: 0.3, depthWrite: false }),
    [logo],
  )
  const face = depth / 2 + 0.065
  return (
    <group scale={1.05}>
      <mesh geometry={body} material={bodyMat} />
      <mesh geometry={rim} material={rimMat} />
      <mesh position={[0, -0.02, face]} material={logoMat}><planeGeometry args={[1.55, 1.55]} /></mesh>
      <mesh position={[0, -0.02, -face]} rotation={[0, Math.PI, 0]} material={logoMat}><planeGeometry args={[1.55, 1.55]} /></mesh>
    </group>
  )
}

/** TwoBones: dos huesos cruzados. */
function Bone({ rotation }: { rotation: number }) {
  const shaft = useMemo(() => new THREE.CylinderGeometry(0.13, 0.13, 1.7, 24), [])
  const knob = useMemo(() => new THREE.SphereGeometry(0.22, 24, 16), [])
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#efe4cf', roughness: 0.45, clearcoat: 0.4, sheen: 0.5 }), [])
  return (
    <group rotation={[0, 0, rotation]}>
      <mesh geometry={shaft} material={mat} />
      {[-1, 1].map(y => [-1, 1].map(x => (
        <mesh key={`${x}${y}`} geometry={knob} material={mat} position={[x * 0.14, y * 0.88, 0]} />
      )))}
    </group>
  )
}
function BonesModel() {
  return (
    <group>
      <Bone rotation={Math.PI / 4} />
      <group position={[0, 0, 0.12]}><Bone rotation={-Math.PI / 4} /></group>
    </group>
  )
}

/** Desarrollo web: ventanas apiladas con contenido. */
function Window({ z, accent }: { z: number; accent: boolean }) {
  const body = useMemo(() => new RoundedBoxGeometry(2, 1.3, 0.06, 4, 0.05), [])
  const bodyMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: DARK, roughness: 0.35, clearcoat: 1 }), [])
  const barMat = useMemo(() => new THREE.MeshStandardMaterial({ color: accent ? ORANGE : '#3a3631', emissive: accent ? ORANGE : '#000', emissiveIntensity: accent ? 0.6 : 0 }), [accent])
  const blockMat = useMemo(() => new THREE.MeshStandardMaterial({ color: INK, roughness: 0.6 }), [])
  return (
    <group position={[0.35 - z * 0.35, z * 0.25, z * -0.45]}>
      <mesh geometry={body} material={bodyMat} />
      <mesh position={[0, 0.52, 0.035]} material={barMat}><planeGeometry args={[1.86, 0.12]} /></mesh>
      <mesh position={[-0.45, 0.1, 0.035]} material={blockMat}><planeGeometry args={[0.8, 0.5]} /></mesh>
      <mesh position={[0.5, 0.22, 0.035]} material={blockMat}><planeGeometry args={[0.7, 0.08]} /></mesh>
      <mesh position={[0.5, 0.06, 0.035]} material={blockMat}><planeGeometry args={[0.7, 0.08]} /></mesh>
      <mesh position={[0.5, -0.1, 0.035]} material={blockMat}><planeGeometry args={[0.45, 0.08]} /></mesh>
      <mesh position={[0, -0.38, 0.035]} material={barMat}><planeGeometry args={[1.6, 0.06]} /></mesh>
    </group>
  )
}
function WebModel() {
  return (
    <group scale={0.85}>
      <Window z={2} accent={false} />
      <Window z={1} accent={false} />
      <Window z={0} accent />
    </group>
  )
}

/** Skoly: la cabeza de un robot que parpadea. */
function RobotModel() {
  const eyes = useRef<THREE.Group>(null)
  const head = useMemo(() => new RoundedBoxGeometry(1.6, 1.25, 1.2, 6, 0.32), [])
  const headMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#5865f2', roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 }), [])
  const visor = useMemo(() => new RoundedBoxGeometry(1.25, 0.7, 0.2, 4, 0.1), [])
  const visorMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#0b0a14', roughness: 0.1, clearcoat: 1 }), [])
  const eyeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e9fbff', emissive: '#bff6ff', emissiveIntensity: 1.6 }), [])
  const metal = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#d9d4cc', metalness: 0.9, roughness: 0.25 }), [])
  const tip = useMemo(() => new THREE.MeshStandardMaterial({ color: ORANGE, emissive: ORANGE, emissiveIntensity: 0.8 }), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime % 3.2
    const blink = t > 3.05 ? Math.abs(Math.sin(((t - 3.05) / 0.15) * Math.PI)) : 0
    if (eyes.current) eyes.current.scale.y = 1 - blink * 0.9
  })

  return (
    <group scale={0.95}>
      <mesh geometry={head} material={headMat} />
      <mesh geometry={visor} material={visorMat} position={[0, 0, 0.56]} />
      <group ref={eyes} position={[0, 0, 0.67]}>
        {[-0.28, 0.28].map(x => (
          <mesh key={x} position={[x, 0, 0]} material={eyeMat}><capsuleGeometry args={[0.08, 0.16, 6, 12]} /></mesh>
        ))}
      </group>
      {[-1, 1].map(x => (
        <mesh key={x} position={[x * 0.85, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={metal}><cylinderGeometry args={[0.2, 0.2, 0.16, 24]} /></mesh>
      ))}
      <mesh position={[0, 0.8, 0]} material={metal}><cylinderGeometry args={[0.035, 0.035, 0.4, 12]} /></mesh>
      <mesh position={[0, 1.03, 0]} material={tip}><sphereGeometry args={[0.09, 16, 12]} /></mesh>
    </group>
  )
}

const models: ReactNode[] = [<TriModel key="tri" />, <BonesModel key="bones" />, <WebModel key="web" />, <RobotModel key="robot" />]

function Rig() {
  const groups = useRef<(THREE.Group | null)[]>([])
  const root = useRef<THREE.Group>(null)
  const { viewport, size } = useThree()
  const wide = size.width > 860

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const p = projectsState.progress
    if (root.current) {
      // Escritorio: el modelo vive a la derecha. Celular: arriba.
      root.current.position.set(wide ? viewport.width * 0.22 : 0, wide ? 0 : viewport.height * 0.2, 0)
      root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, -state.pointer.y * 0.25, 0.08)
      root.current.rotation.z = THREE.MathUtils.lerp(root.current.rotation.z, state.pointer.x * 0.1, 0.08)
    }
    const base = Math.min(wide ? viewport.height * 0.26 : viewport.width * 0.3, 1.25)
    groups.current.forEach((g, i) => {
      if (!g) return
      const d = p - i
      const w = THREE.MathUtils.smoothstep(1 - Math.abs(d) * 1.25, 0, 1)
      g.visible = w > 0.002
      if (!g.visible) return
      g.scale.setScalar(base * (0.2 + 0.8 * w) * w)
      g.position.y = d * 2.2
      g.position.y = Math.sin(state.clock.elapsedTime * 0.8 + i) * 0.08
      g.rotation.y += dt * 0.35
      g.rotation.x = -d * 1.6
    })
  })

  return (
    <group ref={root}>
      {models.map((m, i) => (
        <group key={i} ref={el => { groups.current[i] = el }}>{m}</group>
      ))}
    </group>
  )
}

export default function ProjectsScene() {
  const wrap = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const isMobile = useMemo(() => matchMedia('(max-width: 860px), (pointer: coarse)').matches, [])

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    let inView = false
    const update = () => setVisible(inView && !document.hidden)
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; update() })
    io.observe(el)
    document.addEventListener('visibilitychange', update)
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', update) }
  }, [])

  return (
    <div ref={wrap} className="projects-canvas" aria-hidden>
      <Canvas
        frameloop={visible ? 'always' : 'never'}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        camera={{ position: [0, 0, 6], fov: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
        eventSource={document.body}
        eventPrefix="client"
      >
        <Environment />
        <directionalLight position={[3, 4, 5]} intensity={1.6} />
        <directionalLight position={[-4, -2, 2]} intensity={0.5} color={ORANGE} />
        <Rig />
      </Canvas>
    </div>
  )
}
