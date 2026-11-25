import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { hash, noise3, planetVertex } from '../glsl'
import { J } from '../journey'
import { circle, ribbons, ribbonVertex } from '../ribbons'
import { U } from '../shared'
import { Halo, Slot, SlotLight, type WorldState } from './common'

// Inti: una estrella azul. El logo (anillo blanco y ocho rayos) es una megaestructura que la rodea,
// y los cinco planetas en órbita son los cinco clientes del primer mes.

const star = /* glsl */ `
varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec2 vUv; uniform float uTime; uniform int uOct;
${hash}
${noise3}
void main(){
  vec3 n = normalize(vN), V = normalize(cameraPosition - vW), p = normalize(vL);
  float mu = max(dot(n, V), 0.);
  vec3 q = p * 3.2 + vec3(0., uTime * .05, 0.);
  float w = fbm(q + uTime * .07, uOct);
  float g = fbm(p * 8. + w * 1.6 + vec3(uTime * .11, 0., -uTime * .09), uOct + 1);
  float cells = ridged(p * 5.5 + w + uTime * .06, uOct);
  float spots = smoothstep(.28, .5, fbm(p * 2.1 + 9. + uTime * .015, 4));
  float I = .72 + g * .9 + (cells - .45) * .5; I *= 1. - spots * .62;
  vec3 hot = vec3(.86, .94, 1.), mid = vec3(.12, .42, 1.), cold = vec3(.01, .06, .42);
  vec3 c = mix(cold, mid, smoothstep(.12, .72, I)); c = mix(c, hot, smoothstep(.85, 1.45, I));
  c *= mix(.55, 1.35, pow(mu, .55));
  c += vec3(.2, .5, 1.) * pow(max(1. - mu, 0.), 2.6) * 1.1;
  gl_FragColor = vec4(c * .74, 1.);
}`
const corona = /* glsl */ `
varying vec2 vUv; uniform float uTime, uK;
${hash}
${noise3}
void main(){
  vec2 c = (vUv - .5) * 2.; float r = length(c), a = atan(c.y, c.x);
  float R = .2; // radio de la estrella dentro del cartel
  float d = max(r - R, 0.);
  float n = fbm(vec3(cos(a) * 2.2, sin(a) * 2.2, d * 3.5 - uTime * .16), 5);
  float rays = fbm(vec3(cos(a) * 7., sin(a) * 7., uTime * .06 - d * .9), 4);
  float f = exp(-d * 13.) * 1.1 + exp(-d * 5.) * (.32 + n * .5) + exp(-d * 2.6) * max(rays, 0.) * .5;
  f *= smoothstep(1., .55, r) * smoothstep(R * .72, R, r);
  gl_FragColor = vec4(mix(vec3(.10, .34, 1.), vec3(.75, .9, 1.), exp(-d * 12.)) * f * uK, 1.);
}`
const orbit = /* glsl */ `
varying float vT, vSeed, vS; varying vec3 vW; uniform float uK, uTime;
void main(){
  float e = 1. - abs(vS);
  gl_FragColor = vec4(vec3(.35, .62, 1.) * e * .34 * smoothstep(0., .1, uK * 1.2 - vT), 1.);
}`

function rayGeometry(length: number, halfWidth: number) {
  const steps = 22
  const profile = Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps
    return new THREE.Vector2(Math.sin(Math.PI * t) ** 0.7 * halfWidth, (t - 0.5) * length)
  })
  return new THREE.LatheGeometry(profile, 24)
}

const ORBITS = [1.62, 1.95, 2.3, 2.62, 2.95]

export default function Inti({ detail }: { detail: number }) {
  const state = useMemo<WorldState>(() => ({ k: 0, d: -9 }), [])
  const logo = useRef<THREE.Group>(null), system = useRef<THREE.Group>(null), planets = useRef<(THREE.Mesh | null)[]>([])
  const m = useMemo(() => {
    const k = { value: 0 }
    return {
      k,
      star: new THREE.ShaderMaterial({ vertexShader: planetVertex, fragmentShader: star, uniforms: { uTime: U.time, uOct: { value: detail } } }),
      corona: { uTime: U.time, uK: { value: 0.5 } },
      ring: new THREE.TorusGeometry(1.02, 0.085, 28, 128),
      ray: rayGeometry(0.92, 0.105),
      white: new THREE.MeshPhysicalMaterial({ color: '#f7f8fc', roughness: 0.3, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.12, emissive: '#e6efff', emissiveIntensity: 0.6 }),
      blue: new THREE.MeshStandardMaterial({ color: '#0b6dff', roughness: 0.5, metalness: 0.1, emissive: '#0b6dff', emissiveIntensity: 1.1, envMapIntensity: 0.4 }),
      orbits: ribbons(ORBITS.map((r, i) => ({ points: circle(r, 128), seed: i / 5 }))),
      orbitMat: new THREE.ShaderMaterial({ vertexShader: ribbonVertex, fragmentShader: orbit, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uTime: U.time, uK: k, uRes: U.res, uWidth: { value: 1 } } }),
      planet: ['#9db4d6', '#e3b27a', '#7fb7a8', '#c7cbe8', '#d98f7a'].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, emissive: c, emissiveIntensity: 0.1 })),
      pg: new THREE.SphereGeometry(1, 32, 24),
    }
  }, [detail])

  useFrame((_, delta) => {
    if (Math.abs(state.d) > 0.9) return
    const t = U.time.value
    m.k.value += (state.k - m.k.value) * Math.min(1, delta * 2.4)
    m.orbitMat.uniforms.uWidth.value = 1.2 * U.pr.value
    const k = m.k.value
    if (logo.current) {
      logo.current.rotation.z = Math.sin(t * 0.22) * 0.05 + (1 - k) * 1.6
      logo.current.rotation.y = Math.sin(t * 0.32) * 0.28 + J.mx * 0.25
      logo.current.rotation.x = Math.sin(t * 0.26) * 0.14 - J.my * 0.2
      logo.current.children.forEach((c, i) => {
        if (i === 0) { c.scale.setScalar(0.4 + 0.6 * k); return }
        // los rayos llegan desde afuera y se acomodan
        const u = Math.min(1, Math.max(0, k * 1.6 - (i - 1) * 0.07))
        const e = 1 - Math.pow(1 - u, 3)
        const a = ((i - 1) / 8) * Math.PI * 2
        const r = 1.72 + (1 - e) * 2.6
        c.position.set(Math.cos(a) * r, Math.sin(a) * r, 0)
        c.scale.setScalar(0.2 + 0.8 * e)
      })
    }
    if (system.current) system.current.rotation.set(0.34 + J.my * 0.05, 0, 0.16)
    planets.current.forEach((p, i) => {
      if (!p) return
      const a = t * (0.5 / Math.pow(ORBITS[i], 1.5)) * 1.8 + i * 2.2
      p.position.set(Math.cos(a) * ORBITS[i], 0, Math.sin(a) * ORBITS[i])
      p.scale.setScalar([0.055, 0.085, 0.07, 0.11, 0.06][i] * k)
    })
  })

  return (
    <>
    <Slot i={1} state={state}>
      <Halo size={7} fragment={corona} uniforms={m.corona} order={1} />
      <mesh material={m.star} scale={0.7}><sphereGeometry args={[1, 72, 48]} /></mesh>
      <group ref={logo}>
        <mesh geometry={m.ring} material={m.white} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2
          return <mesh key={i} geometry={m.ray} material={i % 2 ? m.blue : m.white} rotation={[0, 0, a - Math.PI / 2]} />
        })}
      </group>
      <group ref={system}>
        <mesh geometry={m.orbits} material={m.orbitMat} renderOrder={3} frustumCulled={false} />
        {ORBITS.map((_, i) => <mesh key={i} ref={el => { planets.current[i] = el }} geometry={m.pg} material={m.planet[i]} />)}
      </group>
    </Slot>
    <SlotLight i={1} state={state} color="#8fc0ff" intensity={9} distance={9} decay={2} />
    </>
  )
}
