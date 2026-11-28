import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { planetVertex } from '../glsl'
import { C, J, smooth } from '../journey'
import { U } from '../shared'

/** Cuánto se ve cada mundo: `k` es la aparición (0…1) al llegar, `d` la distancia en t al proyecto. */
export type WorldState = { k: number; d: number }

/** Ubica un mundo y lo apaga cuando está lejos. Los hijos leen `state` en sus propios frames. */
export function Slot({ i, state, children }: { i: number; state: WorldState; children: ReactNode }) {
  const g = useRef<THREE.Group>(null)
  useFrame(() => {
    const d = J.t - (5 + i)
    state.d = d
    state.k = smooth(-0.42, -0.02, d)
    if (g.current) g.current.visible = J.t > 4.5 && J.t < 9.1 && d > -0.82 && d < 0.8
  }, -5)
  return <group ref={g} position={C.worlds[i]} visible={false}>{children}</group>
}

/** Luz propia de un mundo. Vive fuera de su grupo y nunca se apaga del todo: si cambiara la cantidad de luces, habría que recompilar todos los materiales. */
export function SlotLight({ i, state, at = [0, 0, 0], intensity, ...props }: { i: number; state: WorldState; at?: [number, number, number]; color: string; intensity: number; distance: number; decay: number }) {
  const l = useRef<THREE.PointLight>(null)
  useFrame(() => { if (l.current) l.current.intensity = Math.abs(state.d) < 0.82 ? intensity : 0 })
  return <pointLight ref={l} {...props} position={[C.worlds[i].x + at[0], C.worlds[i].y + at[1], C.worlds[i].z + at[2]]} />
}

const rimFragment = /* glsl */ `
varying vec3 vN; varying vec3 vW; varying vec2 vUv; varying vec3 vL;
uniform vec3 uColor, uLight; uniform float uI, uPow, uLimb;
void main(){
  vec3 V = normalize(cameraPosition - vW), n = normalize(vN);
  // 1 pegado al planeta, 0 en el borde de la cáscara
  float e = clamp(-dot(V, n) / uLimb, 0., 1.);
  float f = pow(e, uPow) * (1. - smoothstep(1., 1.25, -dot(V, n) / uLimb) * .4);
  float s = dot(n, uLight);
  float lit = .10 + 1.1 * smoothstep(-.45, .55, s);
  vec3 c = mix(uColor, vec3(1.), pow(e, 6.) * .35 * smoothstep(0., .6, s));
  gl_FragColor = vec4(c * f * lit * uI, 1.);
}`

/** Atmósfera: una cáscara del lado de adentro, más brillante hacia la luz. */
export function Atmosphere({ r, planet, color, i = 1, pow = 2.6 }: { r: number; planet: number; color: string; i?: number; pow?: number }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: planetVertex, fragmentShader: rimFragment, side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(color) }, uLight: U.light, uI: { value: i }, uPow: { value: pow }, uLimb: { value: Math.sqrt(1 - (planet / r) ** 2) } },
  }), [color, i, pow, planet, r])
  return <mesh material={mat} scale={r} renderOrder={4}><sphereGeometry args={[1, 64, 48]} /></mesh>
}

export const uvVertex = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`

/** Cartel que siempre mira a cámara, con un shader aditivo (halos, coronas). */
export function Halo({ size, fragment, uniforms, order = 2 }: { size: number; fragment: string; uniforms: Record<string, THREE.IUniform>; order?: number }) {
  const ref = useRef<THREE.Mesh>(null)
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: uvVertex, fragmentShader: fragment, uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), [fragment, uniforms])
  const q = useMemo(() => new THREE.Quaternion(), [])
  useFrame(({ camera }) => {
    const m = ref.current
    if (!m?.parent) return
    m.parent.getWorldQuaternion(q).invert()
    m.quaternion.copy(q).multiply(camera.quaternion)
  })
  return <mesh ref={ref} material={mat} scale={size} renderOrder={order}><planeGeometry args={[1, 1]} /></mesh>
}
