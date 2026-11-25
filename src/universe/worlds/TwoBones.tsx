import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { model, tex } from '../assets'
import { J } from '../journey'
import { U, mulberry } from '../shared'
import { Halo, Slot, SlotLight, type WorldState } from './common'

// TwoBones: una luna con forma de calavera (esculpida en Blender), con un anillo de huesos. Los ojos siguen al mouse.

const BONES = 46, ROCKS = 60
const eye = /* glsl */ `
varying vec2 vUv; uniform float uTime, uK;
void main(){ float d = length(vUv - .5) * 2.; float f = exp(-d * d * 7.) * 1.5 + exp(-d * 3.4) * .5; gl_FragColor = vec4(mix(vec3(1., .22, .04), vec3(1., .8, .45), exp(-d * d * 16.)) * f * smoothstep(1., .5, d) * uK * (.85 + .15 * sin(uTime * 7.)), 1.); }`
const dust = /* glsl */ `
varying vec2 vUv; uniform float uK;
void main(){ float d = length(vUv - .5) * 2.; gl_FragColor = vec4(vec3(1., .34, .1) * (exp(-d * 2.6) * .28 + exp(-d * d * 3.) * .1) * smoothstep(1., .3, d) * uK, 1.); }`
const o = new THREE.Object3D(), e = new THREE.Euler()

export default function TwoBones({ big }: { big: boolean }) {
  const state = useMemo<WorldState>(() => ({ k: 0, d: -9 }), [])
  const [geo, setGeo] = useState<{ skull: THREE.BufferGeometry; bone: THREE.BufferGeometry; rock: THREE.BufferGeometry } | null>(null)
  const skull = useRef<THREE.Group>(null), ring = useRef<THREE.Group>(null), bones = useRef<THREE.InstancedMesh>(null), rocks = useRef<THREE.InstancedMesh>(null)

  useEffect(() => {
    let live = true
    model('rocks.glb').then(g => {
      if (!live) return
      const get = (n: string) => (g.scene.getObjectByName(n) as THREE.Mesh).geometry
      setGeo({ skull: get('skull'), bone: get('bone'), rock: get('rock_1') })
    }).catch(() => {})
    return () => { live = false }
  }, [])

  const m = useMemo(() => {
    const rnd = mulberry(66), sfx = big ? '' : '-sm'
    const map = tex(`rocks-color${sfx}.webp`, { aniso: 4, flipY: false }), normalMap = tex(`rocks-normal${sfx}.webp`, { srgb: false, aniso: 4, flipY: false })
    return {
      k: 0,
      bone: new THREE.MeshStandardMaterial({ map, normalMap, normalScale: new THREE.Vector2(1.1, 1.1), color: '#fff1dc', roughness: 0.78, envMapIntensity: 0.7 }),
      rock: new THREE.MeshStandardMaterial({ map, normalMap, color: '#b7a596', roughness: 0.95, envMapIntensity: 0.3 }),
      eye: { uTime: U.time, uK: { value: 0 } }, dust: { uK: { value: 0 } },
      b: Array.from({ length: BONES }, (_, i) => ({ a: (i / BONES) * 6.283 + rnd() * 0.1, r: 2.1 + rnd() * 0.75, y: (rnd() - 0.5) * 0.16, s: 0.1 + rnd() * 0.12, rx: rnd() * 6, ry: rnd() * 6, sp: 0.3 + rnd() })),
      r: Array.from({ length: ROCKS }, () => ({ a: rnd() * 6.283, r: 2.0 + rnd() * 1.0, y: (rnd() - 0.5) * 0.18, s: 0.012 + rnd() * rnd() * 0.06, rx: rnd() * 6, sp: 0.3 + rnd() })),
    }
  }, [big])

  useFrame((_, delta) => {
    if (Math.abs(state.d) > 0.9) return
    const t = U.time.value
    m.k += (state.k - m.k) * Math.min(1, delta * 2)
    m.eye.uK.value = m.k * (0.75 + J.kick)
    m.dust.uK.value = m.k
    const s = skull.current
    if (s) {
      s.rotation.y = -0.42 + Math.sin(t * 0.25) * 0.14 + J.mx * 0.38 - state.d * 1.4
      s.rotation.x = 0.06 + Math.sin(t * 0.31) * 0.05 - J.my * 0.22
      s.rotation.z = Math.sin(t * 0.2) * 0.04
      s.position.y = Math.sin(t * 0.6) * 0.06
    }
    if (ring.current) ring.current.rotation.set(0.42, 0, -0.24)
    const put = (im: THREE.InstancedMesh | null, list: { a: number; r: number; y: number; s: number; rx: number; sp: number; ry?: number }[], sp: number) => {
      if (!im) return
      list.forEach((b, i) => {
        const a = b.a + (t * sp) / Math.pow(b.r, 1.5)
        o.position.set(Math.cos(a) * b.r, b.y, Math.sin(a) * b.r)
        o.quaternion.setFromEuler(e.set(b.rx + t * b.sp * 0.5, (b.ry ?? 0) + t * b.sp * 0.4, b.rx * 2))
        o.scale.setScalar(b.s * (0.2 + 0.8 * m.k))
        o.updateMatrix()
        im.setMatrixAt(i, o.matrix)
      })
      im.instanceMatrix.needsUpdate = true
    }
    put(bones.current, m.b, 0.55)
    put(rocks.current, m.r, 0.6)
  })

  return (
    <>
    <Slot i={3} state={state}>
      <Halo size={8} fragment={dust} uniforms={m.dust} order={0} />
      {geo && (
        <>
          <group ref={skull}>
            <group scale={1.42}>
              <mesh geometry={geo.skull} material={m.bone} />
              {[-0.31, 0.31].map(x => (
                <group key={x} position={[x, -0.06, 0.78]}><Halo size={0.6} fragment={eye} uniforms={m.eye} order={3} /></group>
              ))}
            </group>
          </group>
          <group ref={ring}>
            <instancedMesh ref={bones} args={[geo.bone, m.bone, BONES]} frustumCulled={false} />
            <instancedMesh ref={rocks} args={[geo.rock, m.rock, ROCKS]} frustumCulled={false} />
          </group>
        </>
      )}
    </Slot>
    <SlotLight i={3} state={state} at={[0, 0.2, 0.5]} color="#ff5a1f" intensity={3} distance={3.1} decay={1.6} />
    </>
  )
}
