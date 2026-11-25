import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { tex } from './assets'
import { hash, noise3, planetVertex } from './glsl'
import { C, J, beacon, smooth } from './journey'
import { U } from './shared'
import type { Quality } from './quality'

// La Luna y la Tierra (datos de NASA): de día el relieve, los océanos y las nubes; de noche las ciudades. La baliza marca Santa Fe, Argentina.

export const R = 6.4
const LAT = THREE.MathUtils.degToRad(-31.63), LON = THREE.MathUtils.degToRad(-60.7)
/** Santa Fe en coordenadas de la esfera. */
const HOME = new THREE.Vector3(Math.cos(LAT) * Math.cos(LON), Math.sin(LAT), -Math.cos(LAT) * Math.sin(LON))

const earth = /* glsl */ `
varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec2 vUv;
uniform sampler2D uDay, uNight, uBrc; uniform vec3 uLight, uLightColor; uniform float uTime; uniform vec2 uTexel; uniform mat3 uRot;
void main(){
  vec3 n0 = normalize(vN), V = normalize(cameraPosition - vW);
  vec3 brc = texture2D(uBrc, vUv).rgb;
  float rough = brc.g;
  // normal por diferencias del relieve, en la base local este-norte
  vec3 p = normalize(vL), E = normalize(vec3(p.z, 0., -p.x)), Nn = normalize(cross(p, E));
  float hx = texture2D(uBrc, vUv + vec2(uTexel.x, 0.)).r - texture2D(uBrc, vUv - vec2(uTexel.x, 0.)).r;
  float hy = texture2D(uBrc, vUv + vec2(0., uTexel.y)).r - texture2D(uBrc, vUv - vec2(0., uTexel.y)).r;
  vec3 ln = normalize(p - (E * hx * 1.5 + Nn * hy * 1.5));
  vec3 n = normalize(uRot * ln);
  float nl0 = dot(n0, uLight), nl = dot(n, uLight);
  float day = smoothstep(-.08, .22, nl0);
  vec2 cuv = vUv + vec2(uTime * .00045, 0.);
  float cl = smoothstep(.12, .92, texture2D(uBrc, cuv).b);
  // sombra de las nubes: se corre según la luz
  vec3 lt = transpose(uRot) * uLight; vec2 so = vec2(dot(lt, E), dot(lt, Nn)) * vec2(1., 2.) * .0016;
  float cs = smoothstep(.15, .95, texture2D(uBrc, cuv + so).b);
  vec3 alb = texture2D(uDay, vUv).rgb;
  float sea = 1. - smoothstep(.35, .65, rough);
  alb = mix(alb, alb * vec3(.55, .8, 1.12), sea * .7);
  vec3 col = alb * uLightColor * max(nl, 0.) * 2.1 * (1. - cs * .55);
  // reflejo del sol en el océano
  vec3 H = normalize(uLight + V); float sp = pow(max(dot(n0, H), 0.), 90.) * 1.4 + pow(max(dot(n0, H), 0.), 14.) * .16;
  col += uLightColor * sp * sea * max(nl0, 0.) * (1. - cl) * vec3(1., .93, .82);
  // nubes, anaranjadas en el borde del día
  vec3 dusk = mix(vec3(1., .42, .18), vec3(1.), smoothstep(-.02, .32, nl0));
  col = mix(col, uLightColor * dusk * (max(nl0 + .06, 0.) * 1.75 + .006), cl * .88);
  // ciudades
  vec3 city = texture2D(uNight, vUv).rgb; float lum = dot(city, vec3(.33));
  col += city * vec3(1.35, .95, .58) * (1. - smoothstep(-.18, .1, nl0)) * (1. - cl * .72) * (.6 + lum * 3.2);
  // atmósfera sobre el disco
  float f = pow(max(1. - max(dot(n0, V), 0.), 0.), 3.2);
  vec3 sky = mix(vec3(1., .36, .14), vec3(.26, .56, 1.), smoothstep(-.12, .30, nl0));
  col += sky * f * smoothstep(-.28, .35, nl0) * 1.5;
  col += vec3(.02, .05, .11) * f * .5;
  gl_FragColor = vec4(col, 1.);
}`

const air = /* glsl */ `
varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec2 vUv; uniform vec3 uLight;
void main(){
  vec3 n = normalize(vN), V = normalize(cameraPosition - vW);
  float e = clamp(-dot(n, V), 0., 1.);
  float g = pow(smoothstep(0., .42, e), 2.6);
  float s = dot(normalize(n), uLight);
  vec3 c = mix(vec3(1., .40, .16), vec3(.28, .58, 1.), smoothstep(-.18, .22, s));
  float back = pow(max(dot(-V, uLight), 0.), 8.);
  gl_FragColor = vec4(c * g * (smoothstep(-.35, .4, s) * 1.35 + back * .8 + .015), 1.);
}`

const moon = /* glsl */ `
varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec2 vUv; uniform sampler2D uMap; uniform vec3 uLight, uLightColor; uniform mat3 uRot;
${hash}
${noise3}
void main(){
  vec3 p = normalize(vL), E = normalize(vec3(p.z, 0., -p.x)), Nn = normalize(cross(p, E));
  vec2 tx = vec2(1. / 1024., 1. / 512.);
  float hx = texture2D(uMap, vUv + vec2(tx.x, 0.)).r - texture2D(uMap, vUv - vec2(tx.x, 0.)).r, hy = texture2D(uMap, vUv + vec2(0., tx.y)).r - texture2D(uMap, vUv - vec2(0., tx.y)).r;
  float d = fbm(p * 60., 4);
  vec3 n = normalize(uRot * normalize(p - (E * hx + Nn * hy) * 1.1));
  vec3 a = texture2D(uMap, vUv).rgb; a *= .92 + d * .35;
  float nl = dot(n, uLight);
  float k = max(nl, 0.) * smoothstep(-.06, .16, dot(normalize(vN), uLight));
  gl_FragColor = vec4(a * a * uLightColor * k * 2.5 + a * vec3(.010, .016, .03), 1.);
}`

const beam = /* glsl */ `
varying vec2 vUv; uniform float uTime, uK;
void main(){
  float x = abs(vUv.x - .5) * 2., y = vUv.y;
  float f = exp(-x * x * 10.) * pow(max(1. - y, 0.), 1.4) * smoothstep(0., .02, y);
  gl_FragColor = vec4(vec3(1., .42, .16) * f * (.75 + .35 * sin(y * 30. - uTime * 8.)) * uK * 2., 1.);
}`
const pin = /* glsl */ `
varying vec2 vUv; uniform float uTime, uK;
void main(){
  float d = length(vUv - .5) * 2., f = exp(-d * d * 120.) * 3.;
  for(int i = 0; i < 3; i++){ float t = fract(uTime * .35 + float(i) / 3.); f += exp(-pow(abs((d - t) * 26.), 2.)) * (1. - t) * 1.1; }
  gl_FragColor = vec4(vec3(1., .45, .18) * f * smoothstep(1., .9, d) * uK, 1.);
}`
const uvVertex = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`

const v = new THREE.Vector3(), n = new THREE.Vector3(), m4 = new THREE.Matrix4(), x = new THREE.Vector3(), z = new THREE.Vector3()

export default function Earth({ q }: { q: Quality }) {
  const group = useRef<THREE.Group>(null), globe = useRef<THREE.Group>(null), moonRef = useRef<THREE.Mesh>(null), home = useRef<THREE.Group>(null), beamRef = useRef<THREE.Mesh>(null)
  const m = useMemo(() => {
    const s = q.bigTex ? '4k' : '2k', w = q.bigTex ? 4096 : 2048
    const k = { value: 0 }
    const add = (fragmentShader: string) => new THREE.ShaderMaterial({ vertexShader: uvVertex, fragmentShader, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: { uTime: U.time, uK: k } })
    return {
      k,
      earth: new THREE.ShaderMaterial({ vertexShader: planetVertex, fragmentShader: earth, uniforms: { uDay: { value: tex(`earth-day-${s}.webp`, { aniso: 8 }) }, uNight: { value: tex(`earth-night-${s}.webp`, { aniso: 8 }) }, uBrc: { value: tex(`earth-brc-${s}.webp`, { srgb: false, aniso: 8, repeat: true }) }, uLight: U.light, uLightColor: U.lightColor, uTime: U.time, uTexel: { value: new THREE.Vector2(1.2 / w, 2.4 / w) }, uRot: { value: new THREE.Matrix3() } } }),
      air: new THREE.ShaderMaterial({ vertexShader: planetVertex, fragmentShader: air, side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uLight: U.light } }),
      moon: new THREE.ShaderMaterial({ vertexShader: planetVertex, fragmentShader: moon, uniforms: { uMap: { value: tex('moon.webp', { aniso: 8 }) }, uLight: U.light, uLightColor: U.lightColor, uRot: { value: new THREE.Matrix3() } } }),
      beam: add(beam), pin: add(pin),
    }
  }, [q.bigTex])

  useFrame(({ camera, size }) => {
    const g = group.current
    if (!g) return
    g.visible = J.t > 12.9
    beacon.k = 0
    if (!g.visible) return
    const t = U.time.value
    if (globe.current) {
      globe.current.rotation.set(THREE.MathUtils.degToRad(-37), THREE.MathUtils.degToRad(-46) + Math.sin(t * 0.05) * 0.05 + (14 - J.t) * 0.35, 0.06, 'XYZ')
      globe.current.updateMatrixWorld()
      m.earth.uniforms.uRot.value.setFromMatrix4(globe.current.matrixWorld)
      const e = m.earth.uniforms.uRot.value.elements as number[]
      for (let i = 0; i < 9; i++) e[i] /= R
    }
    if (moonRef.current) {
      moonRef.current.rotation.y = 1.9 + t * 0.004
      moonRef.current.updateMatrixWorld()
      m4.extractRotation(moonRef.current.matrixWorld)
      m.moon.uniforms.uRot.value.setFromMatrix4(m4)
    }
    const on = smooth(13.72, 13.97, J.t)
    m.k.value = on
    if (home.current) home.current.visible = on > 0.01
    if (on > 0.01 && globe.current) {
      v.copy(HOME).applyMatrix4(globe.current.matrixWorld)
      n.copy(v).sub(C.earth).normalize()
      const facing = n.dot(z.copy(camera.position).sub(v).normalize())
      const p = x.copy(v).addScaledVector(n, 0.02).project(camera)
      beacon.x = (p.x * 0.5 + 0.5) * size.width
      beacon.y = (0.5 - p.y * 0.5) * size.height
      beacon.k = facing > 0.12 ? on : 0
      if (beamRef.current) {
        // el haz es un plano que gira sobre su eje para mirar a cámara
        const cam = globe.current.worldToLocal(camera.position.clone())
        z.copy(cam).sub(HOME)
        z.addScaledVector(HOME, -z.dot(HOME)).normalize()
        x.crossVectors(HOME, z)
        beamRef.current.quaternion.setFromRotationMatrix(m4.makeBasis(x, HOME, z))
      }
    }
  })

  const pinQ = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), HOME), [])
  return (
    <group ref={group}>
      <mesh ref={moonRef} position={C.moon} material={m.moon} scale={2.3}><sphereGeometry args={[1, 96, 64]} /></mesh>
      <group ref={globe} position={C.earth} scale={R}>
        <mesh material={m.earth}><sphereGeometry args={[1, 160, 112]} /></mesh>
        <group ref={home}>
          <mesh material={m.pin} position={HOME.clone().multiplyScalar(1.003)} quaternion={pinQ} renderOrder={6}><planeGeometry args={[0.2, 0.2]} /></mesh>
          <mesh ref={beamRef} material={m.beam} position={HOME.clone().multiplyScalar(1.16)} renderOrder={6}><planeGeometry args={[0.022, 0.32]} /></mesh>
        </group>
      </group>
      <mesh position={C.earth} material={m.air} scale={R * 1.075} renderOrder={5}><sphereGeometry args={[1, 96, 64]} /></mesh>
    </group>
  )
}
