import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { tex } from './assets'
import { hash, noise3, planetVertex } from './glsl'
import { C, J } from './journey'
import { U, mulberry } from './shared'
import type { Quality } from './quality'

// Saturno: la sombra del planeta cae sobre los anillos y la de los anillos sobre el planeta.
// De cerca, los anillos dejan de ser una lámina y se ven los bloques de hielo que los forman; la cámara los cruza.

const R = 12, IN = R * 1.24, OUT = R * 2.33

const planet = /* glsl */ `
varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec2 vUv;
uniform sampler2D uMap, uRing; uniform vec3 uLight, uLightColor, uC; uniform float uTime;
${hash}
${noise3}
void main(){
  vec3 n = normalize(vN), V = normalize(cameraPosition - vW), p = vW - uC;
  // bandas con turbulencia fina
  float w = fbm(vec3(vL.x * 3., vL.y * 26., vL.z * 3.) + vec3(uTime * .02, 0., 0.), 4);
  vec2 uv = vec2(vUv.x + uTime * .0012, vUv.y + w * .0035);
  vec3 alb = texture2D(uMap, uv).rgb;
  alb *= .94 + fbm(vec3(vL.x * 7. + uTime * .03, vL.y * 60., vL.z * 7.), 3) * .22;
  float nl = dot(n, uLight);
  float d = smoothstep(-.12, 1., nl) * max(nl + .12, 0.) / 1.12;
  // sombra de los anillos
  float sh = 1.;
  if(abs(uLight.y) > 1e-3){
    float s = -p.y / uLight.y;
    if(s > 0.){ vec3 h = p + uLight * s; float r = length(h.xz); float u = (r - ${IN.toFixed(2)}) / ${(OUT - IN).toFixed(2)}; if(u > 0. && u < 1.) sh = 1. - texture2D(uRing, vec2(u, .5)).a * .82; }
  }
  vec3 col = alb * uLightColor * d * sh * 1.28;
  // luz que rebota en los anillos hacia la noche
  col += alb * vec3(.95, .82, .6) * .035 * (1. - smoothstep(-.3, .2, nl)) * (1. - abs(n.y));
  float f = pow(max(1. - max(dot(n, V), 0.), 0.), 3.);
  col += vec3(1., .82, .55) * f * .22 * smoothstep(-.2, .5, nl);
  gl_FragColor = vec4(col, 1.);
}`

const ringVertex = /* glsl */ `varying vec3 vP; varying vec3 vW; void main(){ vP = position; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`
const ring = /* glsl */ `
varying vec3 vP; varying vec3 vW; uniform sampler2D uRing; uniform vec3 uLight, uLightColor, uC; uniform float uTime;
${hash}
${noise3}
void main(){
  vec3 p = vW - uC; float r = length(p.xz), u = (r - ${IN.toFixed(2)}) / ${(OUT - IN).toFixed(2)};
  vec4 t = texture2D(uRing, vec2(u, .5));
  // surcos finísimos que aparecen al acercarse
  float dist = length(cameraPosition - vW), near = smoothstep(46., 8., dist);
  float g = .5 + .5 * sin(r * 41. + sin(r * 13.) * 3.), g2 = vnoise(vec3(r * 9., 0., 3.));
  t.a *= mix(1., .62 + .5 * g + g2 * .5, near);
  // sombra del planeta
  float b = dot(p, uLight); vec3 c = p - uLight * b;
  float sh = b < 0. ? smoothstep(${(R * 0.985).toFixed(2)}, ${(R * 1.02).toFixed(2)}, length(c)) : 1.;
  // a contraluz los anillos brillan
  vec3 V = normalize(cameraPosition - vW);
  float same = sign(uLight.y) * sign(cameraPosition.y - uC.y);
  float phase = same > 0. ? 1. : .5 + .6 * pow(max(dot(-V, uLight), 0.), 6.);
  float grain = .85 + .3 * hash21(floor(p.xz * 22.)) * near;
  vec3 col = t.rgb * mix(t.rgb, vec3(1.), .25) * uLightColor * 1.75 * (sh * phase + .018) * grain;
  float a = t.a * mix(1., smoothstep(.4, 5., dist), 1.) * .97;
  gl_FragColor = vec4(col * a, a);
}`

const bitsVertex = /* glsl */ `
attribute vec3 iP; attribute vec4 iR;
uniform vec3 uCam, uC; uniform float uTime; uniform sampler2D uRing;
varying vec3 vN2; varying vec3 vO; varying float vA; varying float vSh; uniform vec3 uLight;
mat3 rot(vec3 a, float t){ float c = cos(t), s = sin(t); vec3 k = (1. - c) * a; return mat3(k.x * a.x + c, k.x * a.y + a.z * s, k.x * a.z - a.y * s, k.x * a.y - a.z * s, k.y * a.y + c, k.y * a.z + a.x * s, k.x * a.z + a.y * s, k.y * a.z - a.x * s, k.z * a.z + c); }
void main(){
  float L = 30.;
  vec2 rel = mod(iP.xz * L - uCam.xz + vec2(uTime * .12, 0.), L) - .5 * L;
  vec3 w = vec3(uCam.x + rel.x, uC.y + iP.y, uCam.z + rel.y);
  vec3 p = w - uC; float r = length(p.xz), u = (r - ${IN.toFixed(2)}) / ${(OUT - IN).toFixed(2)};
  float dens = u > 0. && u < 1. ? texture2D(uRing, vec2(u, .5)).a : 0.;
  float d = length(rel);
  float k = smoothstep(.5 * L, .3 * L, d) * smoothstep(iR.w * .9, iR.w * .9 + .25, dens + .12) * step(.001, dens);
  mat3 m = rot(normalize(iR.xyz - .5 + 1e-3), uTime * (.2 + iR.w) + iR.x * 40.);
  vN2 = m * normal;
  vec3 q = w + m * position * (.014 + pow(iR.y, 6.) * .13) * k;
  vO = position * 1.7 + iR.xyz * 40.;
  float b = dot(p, uLight); vSh = b < 0. ? smoothstep(${(R * 0.97).toFixed(2)}, ${(R * 1.04).toFixed(2)}, length(p - uLight * b)) : 1.;
  vA = k;
  gl_Position = projectionMatrix * viewMatrix * vec4(q, 1.);
}`
const bits = /* glsl */ `
varying vec3 vN2; varying vec3 vO; varying float vA; varying float vSh; uniform vec3 uLight, uLightColor;
${hash}
${noise3}
void main(){
  if(vA < .02) discard;
  float e = .06, n0 = fbm(vO, 4);
  vec3 g = vec3(fbm(vO + vec3(e, 0., 0.), 3), fbm(vO + vec3(0., e, 0.), 3), fbm(vO + vec3(0., 0., e), 3)) - n0;
  vec3 n = normalize(normalize(vN2) - g * 5.);
  float d = max(dot(n, uLight), 0.);
  vec3 ice = mix(vec3(.58, .52, .46), vec3(.92, .88, .82), smoothstep(-.25, .3, n0));
  gl_FragColor = vec4(ice * (uLightColor * d * 1.35 * vSh + .03), 1.);
}`

export default function Saturn({ q }: { q: Quality }) {
  const group = useRef<THREE.Group>(null), bitsRef = useRef<THREE.Mesh>(null)
  const m = useMemo(() => {
    const ringTex = tex('saturn-ring.png', { aniso: 8 })
    const common = { uLight: U.light, uLightColor: U.lightColor, uC: { value: C.saturn }, uTime: U.time, uRing: { value: ringTex } }
    const g = new THREE.RingGeometry(IN, OUT, 192, 1)
    g.rotateX(-Math.PI / 2)
    // bloques de hielo: icosaedros deformados
    const rnd = mulberry(31)
    const ico = new THREE.IcosahedronGeometry(1, 2)
    const ip = ico.getAttribute('position')
    const jitter = new Map<string, number>()
    for (let i = 0; i < ip.count; i++) {
      const key = `${ip.getX(i).toFixed(3)},${ip.getY(i).toFixed(3)},${ip.getZ(i).toFixed(3)}`
      if (!jitter.has(key)) jitter.set(key, 0.7 + rnd() * 0.5)
      const s = jitter.get(key)!
      ip.setXYZ(i, ip.getX(i) * s, ip.getY(i) * s * 0.8, ip.getZ(i) * s)
    }
    ico.computeVertexNormals()
    // normales suaves: el relieve fino lo pone el shader
    const inr = ico.getAttribute('normal')
    for (let i = 0; i < ip.count; i++) { const l = Math.hypot(ip.getX(i), ip.getY(i), ip.getZ(i)) || 1; inr.setXYZ(i, ip.getX(i) / l, ip.getY(i) / l, ip.getZ(i) / l) }
    const inst = new THREE.InstancedBufferGeometry()
    inst.setAttribute('position', ico.getAttribute('position'))
    inst.setAttribute('normal', ico.getAttribute('normal'))
    const P = new Float32Array(q.ringBits * 3), Rn = new Float32Array(q.ringBits * 4)
    for (let i = 0; i < q.ringBits; i++) {
      P.set([rnd(), (rnd() + rnd() + rnd() - 1.5) * 0.5, rnd()], i * 3)
      Rn.set([rnd(), rnd(), rnd(), rnd()], i * 4)
    }
    inst.setAttribute('iP', new THREE.InstancedBufferAttribute(P, 3))
    inst.setAttribute('iR', new THREE.InstancedBufferAttribute(Rn, 4))
    inst.instanceCount = q.ringBits
    return {
      planet: new THREE.ShaderMaterial({ vertexShader: planetVertex, fragmentShader: planet, uniforms: { ...common, uMap: { value: tex('saturn.webp', { repeat: true, aniso: 8 }) } } }),
      ring: new THREE.ShaderMaterial({ vertexShader: ringVertex, fragmentShader: ring, side: THREE.DoubleSide, transparent: true, depthWrite: false, premultipliedAlpha: true, uniforms: common }),
      bits: new THREE.ShaderMaterial({ vertexShader: bitsVertex, fragmentShader: bits, uniforms: { ...common, uCam: { value: new THREE.Vector3() } } }),
      g, inst,
    }
  }, [q.ringBits])

  useFrame(({ camera }) => {
    const g = group.current
    if (!g) return
    g.visible = J.t > 11.3 && J.t < 13.42
    if (!g.visible) return
    m.bits.uniforms.uCam.value.copy(camera.position)
    if (bitsRef.current) bitsRef.current.visible = J.t > 12.15
  })

  return (
    <group ref={group}>
      <mesh position={C.saturn} material={m.planet} scale={[R, R * 0.902, R]}><sphereGeometry args={[1, 128, 96]} /></mesh>
      <mesh position={C.saturn} geometry={m.g} material={m.ring} renderOrder={1} />
      <mesh ref={bitsRef} geometry={m.inst} material={m.bits} frustumCulled={false} />
    </group>
  )
}
