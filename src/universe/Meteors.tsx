import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { J, smooth } from './journey'
import { U } from './shared'

// Estrellas fugaces: pocas, en cualquier lugar del cielo, cada tanto.

const COUNT = 4
const vertex = /* glsl */ `
attribute vec4 iM; attribute float iK;
varying vec2 vUv; varying float vK;
void main(){ vUv = uv; vK = iK; vec2 d = vec2(cos(iM.z), sin(iM.z)); vec2 p = iM.xy + d * (position.x - .5) * iM.w + vec2(-d.y, d.x) * position.y * .004; gl_Position = vec4(p, .9999, 1.); }`
const fragment = /* glsl */ `
varying vec2 vUv; varying float vK;
void main(){ float y = abs(vUv.y - .5) * 2.; float f = pow(max(vUv.x, 0.), 2.4) * exp(-y * y * 4.) * smoothstep(1., .985, vUv.x); gl_FragColor = vec4(mix(vec3(.45, .7, 1.), vec3(1.), vUv.x) * f * vK * 1.6, 1.); }`

export default function Meteors() {
  const { size } = useThree()
  const ref = useRef<THREE.Mesh>(null)
  const m = useMemo(() => {
    const g = new THREE.InstancedBufferGeometry(), p = new THREE.PlaneGeometry(1, 1)
    p.translate(0.5, 0, 0)
    g.setAttribute('position', p.getAttribute('position'))
    g.setAttribute('uv', p.getAttribute('uv'))
    g.setIndex(p.getIndex())
    const iM = new THREE.InstancedBufferAttribute(new Float32Array(COUNT * 4), 4), iK = new THREE.InstancedBufferAttribute(new Float32Array(COUNT), 1)
    g.setAttribute('iM', iM)
    g.setAttribute('iK', iK)
    g.instanceCount = COUNT
    const mat = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
    const s = Array.from({ length: COUNT }, (_, i) => ({ next: 2 + i * 3.1, t: -1, x: 0, y: 0, a: 0, len: 0.4, sp: 1 }))
    return { g, iM, iK, mat, s }
  }, [])
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05), now = U.time.value
    // no tienen sentido dentro de la nebulosa, del túnel ni frente al agujero negro
    const on = (J.t < 0.5 || (J.t > 5 && J.t < 14.1)) && J.tunnel < 0.05 ? 1 : 0
    let any = false
    m.s.forEach((s, i) => {
      if (s.t < 0 && now > s.next && on) {
        s.t = 0
        s.x = Math.random() * 1.9 - 0.8
        s.y = 0.1 + Math.random() * 0.95
        s.a = -2.5 - Math.random() * 0.7
        s.len = 0.18 + Math.random() * 0.3
        s.sp = 1 + Math.random() * 0.9
      }
      if (s.t >= 0) {
        s.t += dt * 1.15
        if (s.t > 1) { s.t = -1; s.next = now + 4 + Math.random() * 11 }
      }
      const k = s.t < 0 ? 0 : smooth(0, 0.15, s.t) * (1 - smooth(0.45, 1, s.t)) * on
      if (k > 0) any = true
      const d = Math.max(0, s.t) * s.sp, asp = size.width / size.height
      m.iM.setXYZW(i, s.x + Math.cos(s.a) * d, s.y + Math.sin(s.a) * d * asp * 0.7, s.a, s.len * (0.4 + k))
      m.iK.setX(i, k)
    })
    m.iM.needsUpdate = m.iK.needsUpdate = true
    if (ref.current) ref.current.visible = any
  })
  return <mesh ref={ref} geometry={m.g} material={m.mat} frustumCulled={false} renderOrder={-15} />
}
