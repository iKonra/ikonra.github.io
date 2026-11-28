import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { hash, noise3 } from '../glsl'
import { U, mulberry } from '../shared'
import type { Quality } from '../quality'
import { Stop, sphere, type StopState } from './common'
import { uvVertex } from '../worlds/common'

// Esfera de Dyson, en su versión realista: un enjambre de colectores hexagonales en órbita alrededor de una estrella.
// La cara que mira a la estrella es un espejo dorado; el dorso, casi negro, tibio por el calor que tira al espacio
// (ese brillo infrarrojo es lo que se busca en los catálogos). La luz de la estrella se escapa entre los huecos.

const STAR = 2.3

const starVertex = /* glsl */ `
varying vec3 vN, vW;
void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`
const starFragment = /* glsl */ `
uniform float uTime, uFade; varying vec3 vN, vW;
${hash}
${noise3}
void main(){
  vec3 n = normalize(vN), V = normalize(cameraPosition - vW);
  float mu = max(dot(n, V), 0.);
  float g = fbm(n * 9. + vec3(uTime * .05), 4), s = fbm(n * 26. - uTime * .08, 3);
  float T = .78 + g * .22 + s * .12;
  vec3 c = mix(vec3(1., .62, .25), vec3(1., .93, .78), smoothstep(.55, 1., T));
  gl_FragColor = vec4(c * (4. + 6. * T) * (.35 + .65 * pow(mu, .45)) * uFade, 1.);
}`

const glowFragment = /* glsl */ `
uniform float uFade; varying vec2 vUv;
void main(){
  float r = length(vUv - .5) * 2.;
  float g = exp(-max(r - .2, 0.) * 9.) * .9 + exp(-r * 3.4) * .3;
  gl_FragColor = vec4(vec3(1., .78, .5) * g * uFade * smoothstep(1., .8, r), 1.);
}`

const panelVertex = /* glsl */ `
attribute vec4 aOrb; attribute vec2 aMisc;
uniform float uTime;
varying vec3 vN, vW; varying vec2 vP; varying float vSeed;
void main(){
  float r = aOrb.x, inc = aOrb.y, node = aOrb.z;
  float a = aOrb.w + uTime * .2 * pow(6. / r, 1.5);
  vec3 p = vec3(cos(a) * r, 0., sin(a) * r);
  float ci = cos(inc), si = sin(inc); p = vec3(p.x, p.z * si, p.z * ci);
  float cn = cos(node), sn = sin(node); p = vec3(p.x * cn - p.z * sn, p.y, p.x * sn + p.z * cn);
  // cada colector mira a la estrella
  vec3 n = -normalize(p);
  vec3 t1 = normalize(cross(n, abs(n.y) < .95 ? vec3(0., 1., 0.) : vec3(1., 0., 0.))), t2 = cross(n, t1);
  vec3 lp = p + (t1 * position.x + t2 * position.y) * aMisc.x;
  vec4 w = modelMatrix * vec4(lp, 1.);
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * n); vP = position.xy; vSeed = aMisc.y;
  gl_Position = projectionMatrix * viewMatrix * w;
}`
const panelFragment = /* glsl */ `
uniform vec3 uStar; uniform float uFade;
varying vec3 vN, vW; varying vec2 vP; varying float vSeed;
void main(){
  vec3 V = normalize(cameraPosition - vW), N = normalize(vN), Ls = normalize(uStar - vW);
  float hexd = max(abs(vP.x) * .866 + abs(vP.y) * .5, abs(vP.y));
  float edge = smoothstep(.8, .9, hexd);
  float face = dot(N, V);
  float dist = length(uStar - vW);
  vec3 col;
  if(face > 0.){
    // la cara espejada: refleja la estrella hacia donde mira
    vec3 R = reflect(-V, N);
    float spec = pow(max(dot(R, Ls), 0.), 28.);
    float cells = step(.5, fract(vP.x * 3.) ) * .06;
    col = vec3(.95, .74, .4) * (.12 + .88 * face) * 2.2 * (36. / (dist * dist)) + vec3(1., .9, .72) * spec * 9.;
    col *= 1. - edge * .65 - cells;
  } else {
    // el dorso: el calor que se tira al espacio, en infrarrojo
    col = vec3(.1, .028, .012) * (.6 + .5 * vSeed) + vec3(.5, .14, .04) * edge * .25;
  }
  gl_FragColor = vec4(col * uFade, 1.);
}`

export default function Dyson({ i, q }: { i: number; q: Quality }) {
  const state = useMemo<StopState>(() => ({ k: 0, d: 9 }), [])
  const glow = useRef<THREE.Mesh>(null)
  const m = useMemo(() => {
    const star = new THREE.ShaderMaterial({ vertexShader: starVertex, fragmentShader: starFragment, uniforms: { uTime: U.time, uFade: { value: 0 } } })
    const halo = new THREE.ShaderMaterial({ vertexShader: uvVertex, fragmentShader: glowFragment, uniforms: { uFade: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
    const panels = new THREE.ShaderMaterial({ vertexShader: panelVertex, fragmentShader: panelFragment, side: THREE.DoubleSide, uniforms: { uTime: U.time, uFade: { value: 0 }, uStar: { value: new THREE.Vector3() } } })
    return { star, halo, panels }
  }, [])

  const geo = useMemo(() => {
    const rnd = mulberry(5), rings = 16, n = q.detail >= 5 ? 4200 : 1800
    const hex = new THREE.CircleGeometry(1, 6)
    const g = new THREE.InstancedBufferGeometry()
    g.setAttribute('position', hex.getAttribute('position'))
    g.setIndex(hex.getIndex())
    const orb = new Float32Array(n * 4), misc = new Float32Array(n * 2)
    const ringP = Array.from({ length: rings }, (_, k) => [5 + (k / rings) * 3.8 + rnd() * 0.4, (rnd() - 0.5) * 2.6, rnd() * Math.PI * 2, 0.55 + rnd() * 0.45])
    for (let k = 0; k < n; k++) {
      const [r, inc, node, fill] = ringP[k % rings]
      // los anillos no están completos: la construcción sigue
      const a = (k / n) * Math.PI * 2 * rings * fill + rnd() * 0.05
      orb.set([r + (rnd() - 0.5) * 0.25, inc + (rnd() - 0.5) * 0.03, node, a], k * 4)
      misc.set([0.16 + rnd() * rnd() * 0.3, rnd()], k * 2)
    }
    g.setAttribute('aOrb', new THREE.InstancedBufferAttribute(orb, 4))
    g.setAttribute('aMisc', new THREE.InstancedBufferAttribute(misc, 2))
    g.instanceCount = n
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10)
    return g
  }, [q.detail])

  const q4 = useMemo(() => new THREE.Quaternion(), [])
  useFrame(({ camera }) => {
    const k = state.k
    m.star.uniforms.uFade.value = m.halo.uniforms.uFade.value = m.panels.uniforms.uFade.value = k
    const g = glow.current
    if (g?.parent) {
      g.parent.getWorldPosition(m.panels.uniforms.uStar.value)
      g.parent.getWorldQuaternion(q4).invert()
      g.quaternion.copy(q4).multiply(camera.quaternion)
    }
  })

  return (
    <Stop i={i} state={state}>
      <mesh geometry={sphere(48, 32)} material={m.star} scale={STAR} renderOrder={3} />
      <mesh ref={glow} material={m.halo} scale={STAR * 7} renderOrder={7}><planeGeometry args={[1, 1]} /></mesh>
      <mesh geometry={geo} material={m.panels} renderOrder={4} frustumCulled={false} />
    </Stop>
  )
}
