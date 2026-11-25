import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { starColor } from './glsl'
import { J, pose, smooth, win } from './journey'
import type { Quality } from './quality'

// Estrellas cercanas en capas: un volumen que se repite alrededor de la cámara (paralaje infinito).
// Cada una se estira según su movimiento real en pantalla: quieto son puntos, rápido son líneas de velocidad.

const vertex = /* glsl */ `
attribute vec3 aPos; attribute vec4 aR;
uniform vec3 uCam, uVel; uniform vec2 uRes; uniform float uSize, uI, uMaxLen, uBlue;
varying vec2 vQ; varying vec3 vCol; varying float vA; varying float vL;
${starColor}
void main(){
  // tres capas: polvo cercano, campo medio y fondo lejano
  float L = aR.w < .34 ? 26. : aR.w < .7 ? 70. : 190.;
  vec3 rel = mod(aPos * L - uCam, L) - .5 * L;
  vec3 prev = rel + uVel * (.35 + L / 190.);
  vec4 a = viewMatrix * vec4(rel + cameraPosition, 1.), b = viewMatrix * vec4(prev + cameraPosition, 1.);
  float d = length(rel);
  float nearZ = -.12;
  if(a.z > nearZ && b.z > nearZ){ gl_Position = vec4(2., 2., 2., 1.); return; }
  if(a.z > nearZ) a = mix(b, a, (nearZ - b.z) / (a.z - b.z));
  if(b.z > nearZ) b = mix(a, b, (nearZ - a.z) / (b.z - a.z));
  vec4 ca = projectionMatrix * a, cb = projectionMatrix * b;
  vec2 sa = ca.xy / ca.w * uRes, sb = cb.xy / cb.w * uRes;
  vec2 dir = sb - sa; float len = length(dir);
  float cap = min(len, uMaxLen);
  dir = len > .5 ? dir / len : vec2(1., 0.);
  vec2 nrm = vec2(-dir.y, dir.x);
  float px = uSize * (.5 + aR.x * aR.x * 2.1) * clamp(L * .16 / -a.z, .35, 3.4);
  vec2 off = dir * (position.x > 0. ? cap + px : -px) + nrm * position.y * px;
  gl_Position = vec4((sa + off) / uRes * ca.w, ca.z, ca.w);
  vQ = vec2(position.x, position.y); vL = cap / px;
  vCol = mix(bvColor(aR.y * 1.9 - .3), vec3(.55, .75, 1.35), uBlue * .7);
  float fade = smoothstep(.5 * L, .34 * L, d) * smoothstep(.02 * L, .07 * L, d);
  vA = uI * fade * (.25 + aR.x * 1.1) * mix(1., 1.5 / (1. + cap * .006), step(1., cap));
}`
const fragment = /* glsl */ `
varying vec2 vQ; varying vec3 vCol; varying float vA; varying float vL;
void main(){
  float x = vQ.x * .5 + .5;
  float ends = vL < 1. ? exp(-dot(vQ, vQ) * 3.2) : exp(-vQ.y * vQ.y * 3.2) * smoothstep(0., .12, x) * pow(max(1. - x, 0.), .65);
  gl_FragColor = vec4(vCol * ends * vA, 1.);
}`

export default function Streaks({ q }: { q: Quality }) {
  const { camera, size, viewport } = useThree()
  const prev = useRef(new THREE.Vector3(NaN, 0, 0))
  const vel = useRef(new THREE.Vector3())
  const geo = useMemo(() => {
    const g = new THREE.InstancedBufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3))
    g.setIndex([0, 1, 2, 0, 2, 3])
    const n = q.streaks, p = new Float32Array(n * 3), r = new Float32Array(n * 4)
    for (let i = 0; i < p.length; i++) p[i] = Math.random()
    for (let i = 0; i < r.length; i++) r[i] = Math.random()
    g.setAttribute('aPos', new THREE.InstancedBufferAttribute(p, 3))
    g.setAttribute('aR', new THREE.InstancedBufferAttribute(r, 4))
    g.instanceCount = n
    return g
  }, [q.streaks])
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
    uniforms: { uCam: { value: new THREE.Vector3() }, uVel: { value: new THREE.Vector3() }, uRes: { value: new THREE.Vector2() }, uSize: { value: 1 }, uI: { value: 1 }, uMaxLen: { value: 400 }, uBlue: { value: 0 } },
  }), [])

  useFrame((_, delta) => {
    const dt = Math.min(Math.max(delta, 1e-3), 0.05)
    const u = mat.uniforms
    const p = prev.current
    const step = Number.isNaN(p.x) ? 0 : p.distanceTo(camera.position)
    // obturador: cuánto "recuerda" cada estrella de su movimiento; en un corte se reinicia
    if (Number.isNaN(p.x) || step > 220) vel.current.set(0, 0, 0)
    else {
      const k = q.warp ? 2.1 : 0.5
      vel.current.lerp(p.sub(camera.position).multiplyScalar((k * 0.0167) / dt), 0.35)
    }
    p.copy(camera.position)
    u.uCam.value.copy(camera.position)
    u.uVel.value.copy(vel.current)
    u.uRes.value.set((size.width * viewport.dpr) / 2, (size.height * viewport.dpr) / 2)
    u.uSize.value = viewport.dpr * 1.05
    u.uMaxLen.value = size.height * viewport.dpr * 0.55
    u.uBlue.value = J.warp
    // frente a la galaxia entera no hay estrellas cercanas: aparecen al zambullirse
    u.uI.value = (0.12 + 0.88 * smooth(0.35, 0.9, J.t)) * (1 - J.tunnel) * pose.stars * 0.9 * (1 - win(J.raw, 14.3, 14.7, 19, 19.001))
  })

  return <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={-10} />
}
