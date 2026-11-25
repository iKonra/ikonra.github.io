import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { hash, noise3, planetVertex } from '../glsl'
import { J, worldColors } from '../journey'
import { ribbons, ribbonVertex } from '../ribbons'
import { U, mulberry } from '../shared'
import { Halo, Slot, type WorldState } from './common'

// Discord Bots: una sonda robot en el centro de su red. Cada satélite es uno de los 75 servidores; los mensajes viajan por los enlaces.

const N = 75
const link = /* glsl */ `
varying float vT, vSeed, vS; varying vec3 vW; uniform float uTime, uK;
void main(){
  float on = smoothstep(0., .2, uK * 1.7 - vSeed * .7 - vT * .5);
  float dir = step(.5, fract(vSeed * 17.)), x = mix(vT, 1. - vT, dir);
  float p = fract(uTime * (.22 + vSeed * .3) + vSeed * 9.);
  float head = exp(-pow(abs((x - p) * 26.), 2.)) + exp(-max(p - x, 0.) * 11.) * step(x, p) * .35;
  float e = 1. - abs(vS);
  gl_FragColor = vec4(mix(vec3(.28, .33, 1.), vec3(.85, .92, 1.), head) * (.10 + head * 2.3) * e * on * smoothstep(0., .12, vT), 1.);
}`
const shield = /* glsl */ `
varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec2 vUv; uniform float uTime, uK;
${hash}
${noise3}
void main(){
  vec3 n = normalize(vN), V = normalize(cameraPosition - vW);
  float f = pow(max(1. - abs(dot(n, V)), 0.), 3.);
  float ring = pow(max(sin(length(vL.xz) * 9. - uTime * 2.2), 0.), 18.);
  gl_FragColor = vec4(vec3(.34, .40, 1.) * (f * .5 + ring * .1) * uK, 1.);
}`
const core = /* glsl */ `
varying vec2 vUv; uniform float uK;
void main(){ float d = length(vUv - .5) * 2.; gl_FragColor = vec4(vec3(.34, .4, 1.) * (exp(-d * 3.) * .42) * smoothstep(1., .3, d) * uK, 1.); }`
const o = new THREE.Object3D(), col = new THREE.Color()

/** Sonda: cabeza de robot con visor, antena, paneles solares y motor. */
function Robot() {
  const eyes = useRef<THREE.Group>(null), antenna = useRef<THREE.Mesh>(null)
  const m = useMemo(() => {
    const panel = document.createElement('canvas')
    panel.width = 128
    panel.height = 64
    const c = panel.getContext('2d')!
    c.fillStyle = '#0a1030'
    c.fillRect(0, 0, 128, 64)
    for (let x = 0; x < 8; x++) for (let y = 0; y < 4; y++) { c.fillStyle = (x + y) % 2 ? '#16246b' : '#1b2d85'; c.fillRect(x * 16 + 1, y * 16 + 1, 14, 14) }
    const map = new THREE.CanvasTexture(panel)
    map.colorSpace = THREE.SRGBColorSpace
    return {
      head: new RoundedBoxGeometry(1.6, 1.25, 1.2, 6, 0.32), visor: new RoundedBoxGeometry(1.25, 0.7, 0.2, 4, 0.1),
      headMat: new THREE.MeshPhysicalMaterial({ color: '#5865f2', roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12, metalness: 0.15 }),
      visorMat: new THREE.MeshPhysicalMaterial({ color: '#07060f', roughness: 0.08, clearcoat: 1 }),
      eye: new THREE.MeshStandardMaterial({ color: '#e9fbff', emissive: '#9fe9ff', emissiveIntensity: 4 }),
      metal: new THREE.MeshStandardMaterial({ color: '#d9d4cc', metalness: 0.95, roughness: 0.28 }),
      dark: new THREE.MeshStandardMaterial({ color: '#23263a', metalness: 0.6, roughness: 0.45 }),
      tip: new THREE.MeshStandardMaterial({ color: '#ff5a1f', emissive: '#ff5a1f', emissiveIntensity: 3 }),
      panel: new THREE.MeshStandardMaterial({ map, metalness: 0.55, roughness: 0.3, emissive: '#1b2d85', emissiveMap: map, emissiveIntensity: 0.35, side: THREE.DoubleSide }),
    }
  }, [])
  useFrame(() => {
    const t = U.time.value, c = t % 3.2
    const blink = c > 3.05 ? Math.abs(Math.sin(((c - 3.05) / 0.15) * Math.PI)) : 0
    if (eyes.current) {
      eyes.current.scale.y = 1 - blink * 0.9
      eyes.current.position.x = J.mx * 0.14
      eyes.current.position.y = J.my * 0.08
    }
    m.tip.emissiveIntensity = 1.2 + Math.max(0, Math.sin(t * 4)) * 4
    if (antenna.current) antenna.current.rotation.y = t * 0.6
  })
  return (
    <>
      <mesh geometry={m.head} material={m.headMat} />
      <mesh geometry={m.visor} material={m.visorMat} position={[0, 0, 0.56]} />
      <group ref={eyes} position={[0, 0, 0.67]}>
        {[-0.28, 0.28].map(x => <mesh key={x} position={[x, 0, 0]} material={m.eye}><capsuleGeometry args={[0.08, 0.16, 6, 12]} /></mesh>)}
      </group>
      {[-1, 1].map(x => (
        <group key={x}>
          <mesh position={[x * 0.85, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={m.metal}><cylinderGeometry args={[0.2, 0.2, 0.16, 24]} /></mesh>
          <mesh position={[x * 1.15, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={m.metal}><cylinderGeometry args={[0.04, 0.04, 0.5, 12]} /></mesh>
          {/* panel solar */}
          <mesh position={[x * 2.15, 0, 0]} rotation={[-0.5, 0, 0]} material={m.panel}><boxGeometry args={[1.5, 0.75, 0.03]} /></mesh>
          <mesh position={[x * 2.15, 0, 0]} rotation={[-0.5, 0, 0]} material={m.metal}><boxGeometry args={[1.56, 0.03, 0.06]} /></mesh>
        </group>
      ))}
      <mesh position={[0, 0.8, 0]} material={m.metal}><cylinderGeometry args={[0.035, 0.035, 0.4, 12]} /></mesh>
      <mesh position={[0, 1.03, 0]} material={m.tip}><sphereGeometry args={[0.09, 16, 12]} /></mesh>
      <mesh ref={antenna} position={[0.5, 0.72, -0.1]} rotation={[0.5, 0, -0.4]} material={m.dark}><coneGeometry args={[0.24, 0.16, 24, 1, true]} /></mesh>
      <mesh position={[0, -0.72, -0.1]} material={m.dark}><cylinderGeometry args={[0.3, 0.46, 0.28, 24]} /></mesh>
    </>
  )
}

export default function Bots() {
  const state = useMemo<WorldState>(() => ({ k: 0, d: -9 }), [])
  const robot = useRef<THREE.Group>(null), net = useRef<THREE.Group>(null), sats = useRef<THREE.InstancedMesh>(null)
  const m = useMemo(() => {
    const rnd = mulberry(75), k = { value: 0 }
    const pts = Array.from({ length: N }, (_, i) => {
      const y = 1 - ((i + 0.5) / N) * 2, a = i * 2.39996, s = Math.sqrt(1 - y * y), r = 1.95 + rnd() * 0.95
      return new THREE.Vector3(Math.cos(a) * s * r, y * r * 0.82, Math.sin(a) * s * r)
    })
    // cada satélite se enlaza con la sonda, y algunos entre sí
    const curves = pts.map(p => ({ points: Array.from({ length: 13 }, (_, i) => p.clone().multiplyScalar(0.28 + (0.72 * i) / 12)), seed: rnd(), width: 1 }))
    pts.forEach((p, i) => {
      const near = pts.map((q, j) => [p.distanceTo(q), j] as const).filter(([, j]) => j > i).sort((a, b) => a[0] - b[0])[0]
      if (near && near[0] < 1.1) curves.push({ points: Array.from({ length: 9 }, (_, n) => p.clone().lerp(pts[near[1]], n / 8)), seed: rnd(), width: 0.7 })
    })
    const body = new RoundedBoxGeometry(1, 1, 1, 2, 0.16)
    return {
      k, pts, seeds: pts.map(() => rnd()), body,
      sat: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.45, metalness: 0.3, emissive: '#ffffff', emissiveIntensity: 0.12 }),
      links: ribbons(curves),
      linkMat: new THREE.ShaderMaterial({ vertexShader: ribbonVertex, fragmentShader: link, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uTime: U.time, uK: k, uRes: U.res, uWidth: { value: 1.4 } } }),
      shield: new THREE.ShaderMaterial({ vertexShader: planetVertex, fragmentShader: shield, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: U.time, uK: k } }),
      core: { uK: k },
    }
  }, [])

  useFrame((_, delta) => {
    if (Math.abs(state.d) > 0.9) return
    const t = U.time.value
    m.k.value += (state.k - m.k.value) * Math.min(1, delta * 2)
    m.linkMat.uniforms.uWidth.value = 1.5 * U.pr.value
    const k = m.k.value
    if (robot.current) {
      robot.current.rotation.y = -0.3 + Math.sin(t * 0.4) * 0.16 + J.mx * 0.45 - state.d * 1.2
      robot.current.rotation.x = Math.sin(t * 0.5) * 0.06 - J.my * 0.25
      robot.current.position.y = Math.sin(t * 0.9) * 0.07
      robot.current.scale.setScalar(0.62 * (0.3 + 0.7 * k))
    }
    if (net.current) { net.current.rotation.y = t * 0.06; net.current.rotation.x = 0.18 + J.my * 0.05 }
    const im = sats.current
    if (im) {
      m.pts.forEach((p, i) => {
        const on = Math.min(1, Math.max(0, k * 1.8 - m.seeds[i] * 0.8))
        o.position.copy(p)
        o.rotation.set(t * 0.3 + i, t * 0.2 + i * 2, 0)
        o.scale.setScalar((0.045 + m.seeds[i] * 0.05) * on)
        o.updateMatrix()
        im.setMatrixAt(i, o.matrix)
      })
      im.instanceMatrix.needsUpdate = true
    }
  })

  useLayoutEffect(() => {
    const im = sats.current
    if (!im) return
    for (let i = 0; i < N; i++) im.setColorAt(i, col.set(i % 5 === 0 ? '#ff8a4c' : i % 3 === 0 ? '#e7eaff' : worldColors[4]))
    if (im.instanceColor) im.instanceColor.needsUpdate = true
  }, [])

  return (
    <Slot i={4} state={state}>
      <Halo size={8} fragment={core} uniforms={m.core} order={0} />
      <group ref={robot}><Robot /></group>
      <group ref={net}>
        <mesh geometry={m.links} material={m.linkMat} renderOrder={4} frustumCulled={false} />
        <instancedMesh ref={sats} args={[m.body, m.sat, N]} frustumCulled={false} />
        <mesh material={m.shield} scale={[3, 2.5, 3]} renderOrder={3}><sphereGeometry args={[1, 48, 32]} /></mesh>
      </group>
    </Slot>
  )
}
