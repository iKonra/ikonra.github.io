import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { tex } from '../assets'
import { hash, noise3, planetVertex } from '../glsl'
import { J, worldColors } from '../journey'
import { ribbons, ribbonVertex } from '../ribbons'
import { U, mulberry } from '../shared'
import { Atmosphere, Slot, type WorldState } from './common'

// Tricapi: un planeta de noche cubierto de señales. 130 arcos de luz (las 130 líneas de WhatsApp) convergen en un punto
// y suben hasta la medalla con el logo.

const R = 1.55
const HUB = new THREE.Vector3(-0.36, 0.42, 0.83).normalize()

const planet = /* glsl */ `
varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec2 vUv;
uniform vec3 uLight, uLightColor, uHub; uniform float uTime, uK; uniform int uOct;
${hash}
${noise3}
void main(){
  vec3 n = normalize(vN), V = normalize(cameraPosition - vW), p = normalize(vL);
  float h = fbm(p * 1.6 + 4., uOct + 2), land = smoothstep(-.03, .05, h);
  float det = fbm(p * 11., uOct);
  // relieve
  vec3 b = vec3(fbm(p * 7. + vec3(.02, 0., 0.), 3), fbm(p * 7. + vec3(0., .02, 0.), 3), fbm(p * 7. + vec3(0., 0., .02), 3)) - fbm(p * 7., 3);
  n = normalize(n - b * 2.4 * land);
  vec3 alb = mix(vec3(.014, .018, .028), mix(vec3(.10, .060, .040), vec3(.20, .12, .075), det + .5), land);
  float d = max(dot(n, uLight), 0.), soft = smoothstep(-.25, .6, dot(n, uLight));
  vec3 col = alb * (uLightColor * d * 2.6 + vec3(.05, .05, .08));
  vec3 H = normalize(uLight + V);
  col += (1. - land) * pow(max(dot(n, H), 0.), 70.) * vec3(1., .62, .36) * .42 * d;
  // ciudades: puntos que se agrupan en tierra, más intensas de noche
  float city = 0.;
  for(int o = 0; o < 2; o++){
    vec3 g = p * (o == 0 ? 24. : 52.); vec3 id = floor(g), r = hash33(id + float(o) * 7.);
    float on = step(.58, r.x + h * .9) * land;
    city += on * smoothstep(.34, .0, length(fract(g) - .5 - (r - .5) * .5)) * (.6 + .4 * sin(uTime * (1. + r.y * 2.) + r.z * 40.)) * (o == 0 ? 1. : .55);
  }
  col += vec3(1., .50, .20) * city * mix(2.4, .5, soft) * uK;
  // red hexagonal tenue: late desde el punto de encuentro
  vec2 ll = vec2(atan(p.z, p.x), asin(p.y));
  float ang = acos(clamp(dot(p, uHub), -1., 1.));
  float wave = fract(ang * 1.1 - uTime * .28);
  float ring = exp(-pow(abs((wave - .5) * 16.), 2.)) * exp(-ang * 1.1);
  col += vec3(1., .46, .20) * ring * .34 * uK;
  col += vec3(1., .5, .22) * exp(-ang * 9.) * .55 * uK;
  float fr = pow(max(1. - max(dot(n, V), 0.), 0.), 3.4);
  col += vec3(1., .42, .18) * fr * (.18 + .8 * soft);
  gl_FragColor = vec4(col, 1.);
}`

const arc = /* glsl */ `
varying float vT, vSeed, vS; varying vec3 vW;
uniform float uTime, uK; uniform vec3 uCenter;
void main(){
  float draw = smoothstep(0., .25, uK * 1.6 - vSeed * .6 - vT * .75);
  float pulse = fract(uTime * (.16 + vSeed * .16) + vSeed * 13.);
  float head = exp(-pow(abs((vT - pulse) * 22.), 2.)) + exp(-max(pulse - vT, 0.) * 9.) * step(vT, pulse) * .55;
  float edge = 1. - abs(vS); edge *= edge;
  vec3 c = mix(vec3(1., .36, .12), vec3(1., .82, .55), head);
  // los del lado de atrás se apagan
  float back = smoothstep(-.35, .55, dot(normalize(vW - uCenter), normalize(cameraPosition - uCenter)));
  gl_FragColor = vec4(c * (.16 + head * 2.6) * edge * draw * (.12 + .88 * back) * smoothstep(0., .04, vT), 1.);
}`

const beam = /* glsl */ `
varying vec2 vUv; uniform float uTime, uK;
void main(){
  float x = abs(vUv.x - .5) * 2.;
  float f = exp(-x * x * 14.) * smoothstep(0., .1, vUv.y) * smoothstep(1., .75, vUv.y);
  float run = .55 + .45 * sin(vUv.y * 26. - uTime * 9.);
  gl_FragColor = vec4(vec3(1., .55, .25) * f * run * uK * 1.5, 1.);
}`
const uvVertex = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`

function arcsGeometry() {
  const rnd = mulberry(130)
  const a = new THREE.Vector3(), p = new THREE.Vector3(), axis = new THREE.Vector3(), q = new THREE.Quaternion()
  return ribbons(Array.from({ length: 130 }, (_, i) => {
    // repartidos parejo por la esfera (espiral de Fibonacci con algo de azar)
    const y = 1 - ((i + 0.5) / 130) * 2, t = i * 2.39996 + rnd() * 0.5, s = Math.sqrt(1 - y * y)
    a.set(Math.cos(t) * s, y, Math.sin(t) * s).normalize()
    const ang = Math.acos(THREE.MathUtils.clamp(a.dot(HUB), -1, 1))
    axis.crossVectors(a, HUB).normalize()
    const lift = 0.12 + ang * 0.2 + rnd() * 0.1
    const points = Array.from({ length: 41 }, (_, k) => {
      const u = k / 40
      q.setFromAxisAngle(axis, ang * u)
      return p.copy(a).applyQuaternion(q).multiplyScalar(R * (1.003 + Math.sin(Math.PI * u) * lift * 0.62)).clone()
    })
    return { points, seed: rnd(), width: 0.7 + rnd() * 0.7 }
  }))
}

function hexShape(r: number) {
  const sh = new THREE.Shape()
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 2 + (i / 6) * Math.PI * 2
    if (i === 0) sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); else sh.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  sh.closePath()
  return sh
}

function Medal() {
  const depth = 0.22
  const m = useMemo(() => {
    const body = new THREE.ExtrudeGeometry(hexShape(1), { depth, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 5, curveSegments: 1 })
    body.translate(0, 0, -depth / 2)
    const sh = hexShape(1.16)
    sh.holes.push(hexShape(1.04) as unknown as THREE.Path)
    const rim = new THREE.ExtrudeGeometry(sh, { depth: depth + 0.1, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 })
    rim.translate(0, 0, -(depth + 0.1) / 2)
    const logo = tex('/images/tricapi-logo.webp')
    return {
      body, rim,
      bodyMat: new THREE.MeshPhysicalMaterial({ color: '#141210', roughness: 0.28, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 }),
      rimMat: new THREE.MeshStandardMaterial({ color: '#ff5a1f', roughness: 0.25, metalness: 0.5, emissive: '#ff4a10', emissiveIntensity: 0.55 }),
      logoMat: new THREE.MeshStandardMaterial({ map: logo, color: '#f3efe7', emissive: '#f3efe7', emissiveMap: logo, emissiveIntensity: 0.75, transparent: true, roughness: 0.4, depthWrite: false }),
    }
  }, [])
  const face = depth / 2 + 0.065
  return (
    <>
      <mesh geometry={m.body} material={m.bodyMat} />
      <mesh geometry={m.rim} material={m.rimMat} />
      <mesh position={[0, -0.02, face]} material={m.logoMat}><planeGeometry args={[1.55, 1.55]} /></mesh>
      <mesh position={[0, -0.02, -face]} rotation={[0, Math.PI, 0]} material={m.logoMat}><planeGeometry args={[1.55, 1.55]} /></mesh>
    </>
  )
}

export default function Tricapi({ detail }: { detail: number }) {
  const state = useMemo<WorldState>(() => ({ k: 0, d: -9 }), [])
  const medal = useRef<THREE.Group>(null), body = useRef<THREE.Group>(null), beamRef = useRef<THREE.Mesh>(null)
  const m = useMemo(() => {
    const k = { value: 0 }
    return {
      k, center: { value: new THREE.Vector3() },
      planet: new THREE.ShaderMaterial({ vertexShader: planetVertex, fragmentShader: planet, uniforms: { uLight: U.light, uLightColor: U.lightColor, uTime: U.time, uK: k, uHub: { value: HUB }, uOct: { value: detail } } }),
      arcs: new THREE.ShaderMaterial({ vertexShader: ribbonVertex, fragmentShader: arc, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uTime: U.time, uK: k, uRes: U.res, uWidth: { value: 2 }, uCenter: { value: new THREE.Vector3() } } }),
      beam: new THREE.ShaderMaterial({ vertexShader: uvVertex, fragmentShader: beam, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uTime: U.time, uK: k } }),
      geo: arcsGeometry(),
    }
  }, [detail])

  useFrame(({ camera }, delta) => {
    if (Math.abs(state.d) > 0.9) return
    const t = U.time.value, g = medal.current
    m.k.value += (state.k - m.k.value) * Math.min(1, delta * 2.2)
    m.arcs.uniforms.uWidth.value = 2.1 * U.pr.value
    const b = body.current
    if (b) {
      b.rotation.y = Math.sin(t * 0.12) * 0.16 + state.d * 0.9
      b.rotation.x = Math.sin(t * 0.09) * 0.05
      b.getWorldPosition(m.arcs.uniforms.uCenter.value)
      m.planet.uniforms.uHub.value = HUB
    }
    if (g) {
      const s = 0.36 * (0.3 + 0.7 * m.k.value)
      g.scale.setScalar(s)
      g.rotation.y = Math.sin(t * 0.55) * 0.55 + J.mx * 0.4
      g.rotation.x = Math.sin(t * 0.4) * 0.1 - J.my * 0.25
      g.position.copy(HUB).multiplyScalar(R + 0.95 + Math.sin(t * 0.9) * 0.04)
    }
    if (beamRef.current) {
      const be = beamRef.current
      be.position.copy(HUB).multiplyScalar(R + 0.42)
      be.up.copy(HUB)
      const local = be.parent!.worldToLocal(camera.position.clone())
      // cilindro falso: un plano que gira sobre el eje del haz para mirar a cámara
      const z = local.sub(be.position)
      z.addScaledVector(HUB, -z.dot(HUB)).normalize()
      const x = new THREE.Vector3().crossVectors(HUB, z)
      be.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, HUB, z))
    }
  })

  return (
    <Slot i={0} state={state}>
      <group ref={body}>
        <mesh material={m.planet} scale={R}><sphereGeometry args={[1, 96, 64]} /></mesh>
        <Atmosphere r={R * 1.17} planet={R} color={worldColors[0]} i={0.95} pow={2.6} />
        <mesh geometry={m.geo} material={m.arcs} renderOrder={5} frustumCulled={false} />
        <mesh ref={beamRef} material={m.beam} renderOrder={5}><planeGeometry args={[0.34, 0.95]} /></mesh>
        <group ref={medal}><Medal /></group>
      </group>
    </Slot>
  )
}
