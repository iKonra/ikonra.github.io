import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { image, tex } from './assets'
import { hash } from './glsl'
import { C, J, T, damp, smooth } from './journey'
import type { Quality } from './quality'

// La Vía Láctea: cada punto se ubica según el brillo de la reconstrucción de NASA/JPL-Caltech/ESO (R. Hurt).
// Nace de una singularidad (Big Bang), gira, el cursor la perturba y al tocarla explota y se rearma como otro tipo de galaxia.

export const R = 60

const vertex = /* glsl */ `
attribute vec3 aColor; attribute vec4 aRand;
uniform float uFrom, uTo, uMorph, uBirth, uKick, uTime, uSize, uFade, uSpin;
uniform vec3 uMouse;
varying vec3 vCol; varying float vA;
${hash}
const float R = ${R.toFixed(1)};
// Otros tipos de galaxia, calculados acá mismo a partir de los números al azar de cada punto
void shapeOf(float k, out vec3 p, out vec3 c){
  p = position; c = aColor;
  if(k < .5) return;
  float g1 = sqrt(-2. * log(max(aRand.x, 1e-4))) * cos(6.2832 * aRand.y), g2 = sqrt(-2. * log(max(aRand.x, 1e-4))) * sin(6.2832 * aRand.y), g3 = (aRand.z + aRand.w + hash11(aRand.x * 91.7) - 1.5) * 1.4;
  vec3 warm = vec3(1., .72, .42), blue = vec3(.42, .62, 1.), pink = vec3(1., .32, .5);
  if(k < 1.5){
    // Remolino (M51): dos brazos muy marcados y una compañera
    if(aRand.w < .07){ p = vec3(g1, g3, g2) * 2.6 + vec3(R * .86, 1., -R * .52); c = warm * 1.1; return; }
    float r = pow(aRand.x, .62), arm = floor(aRand.y * 2.) * 3.14159;
    float sp = (aRand.z + hash11(aRand.y * 57.) - 1.) * mix(.95, .3, r);
    float a = arm + log(1. + r * 11.) * 2.05 + sp;
    p = vec3(cos(a), 0., sin(a)) * r * R * .92; p.y = g3 * mix(4., .7, smoothstep(0., .3, r));
    c = mix(warm * 1.3, mix(blue, pink, step(.9, hash11(aRand.z * 33.))), smoothstep(.08, .42, r)) * mix(1., .45, abs(sp));
  } else if(k < 2.5){
    // Anillo (Objeto de Hoag)
    if(aRand.w < .34){ p = vec3(g1, g3 * 1.1, g2) * 4.4; c = warm * 1.25; return; }
    float r = .66 + (aRand.x + aRand.z - 1.) * .15, a = aRand.y * 6.2832;
    r += sin(a * 5. + r * 22.) * .012;
    p = vec3(cos(a), 0., sin(a)) * r * R; p.y = g3 * 1.1;
    c = mix(vec3(.8, .9, 1.), blue, smoothstep(.58, .8, r)) * (hash11(aRand.z * 71.) > .93 ? 1.8 : .8);
  } else if(k < 3.5){
    // Sombrero (M104): bulbo enorme y anillo fino
    if(aRand.w < .55){ float s = pow(aRand.z, 1.7) * 20. + 1.; vec3 d = normalize(vec3(g1, g3 * 2., g2) + 1e-3); p = d * s * vec3(1.35, .78, 1.35); c = mix(vec3(1., .86, .68), vec3(.75, .62, .55), s / 22.); return; }
    float r = .5 + pow(aRand.x, .5) * .42, a = aRand.y * 6.2832;
    p = vec3(cos(a), 0., sin(a)) * r * R; p.y = g3 * .5;
    c = mix(vec3(.62, .36, .24), vec3(.95, .88, 1.), smoothstep(.72, .9, r));
  } else {
    // Elíptica gigante con chorro (M87)
    if(aRand.w < .07){ float z = pow(aRand.x, .6); p = vec3(.62, .3, -.72) * z * R * 1.05 + vec3(g3, g3, -g3) * (.25 + z * 2.2) * (aRand.z - .5); c = vec3(.5, .72, 1.4) * mix(2.2, .5, z); return; }
    float s = pow(aRand.z, 2.1); vec3 d = normalize(vec3(g1, g3 * 2., g2) + 1e-3);
    p = d * s * R * .8 * vec3(1.1, .9, 1.); c = mix(vec3(1., .84, .6), vec3(.95, .6, .38), s) * mix(1.4, .7, s);
  }
}
void main(){
  vec3 pa, ca, pb, cb;
  shapeOf(uFrom, pa, ca); shapeOf(uTo, pb, cb);
  float m = clamp(uMorph * 1.5 - aRand.w * .5, 0., 1.); m = m * m * (3. - 2. * m);
  vec3 p = mix(pa, pb, m); vec3 col = mix(ca, cb, m);
  p += (hash33(aRand.xyz * 77.) - .5) * 22. * sin(m * 3.14159);

  // giro: rígido para que los brazos no se enrollen, con una oscilación propia por estrella
  float r = length(p.xz);
  float a = uTime * uSpin + sin(uTime * .25 + aRand.x * 40.) * .01;
  p.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xz;
  p.y += sin(uTime * .35 + aRand.y * 40.) * .12;

  // Big Bang
  float b = clamp(uBirth * 1.35 - aRand.x * .35, 0., 1.);
  float e = 1. - pow(max(1. - b, 0.), 4.);
  float tw = (1. - e) * (5. + 60. / (r + 8.));
  p.xz = mat2(cos(tw), -sin(tw), sin(tw), cos(tw)) * p.xz;
  vec3 seed = normalize(hash33(aRand.yzw * 51.) - .5);
  p = mix(seed * (.4 + aRand.z * 1.4), p, e) + seed * sin(e * 3.14159) * 16. * (aRand.w - .25);

  // golpe: onda de choque que recorre el disco
  float kr = (1. - uKick) * R * 1.5, w = exp(-pow(abs((r - kr) / 5.), 2.)) * uKick * step(.001, uKick);
  p.y += w * (6. + aRand.y * 10.) * (aRand.x > .5 ? 1. : -1.);
  col += w * vec3(1.6, 1.1, .8);

  // el cursor aparta las estrellas, como una masa que pasa
  vec3 d = p - uMouse; float dist = length(d);
  float push = smoothstep(13., 0., dist);
  p += normalize(d + 1e-4) * push * 5.; p.y += push * 2.5 * (aRand.z - .5);
  col *= 1. + push * .9;

  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  float z = -mv.z;
  float s = uSize * (.35 + aRand.w * aRand.w * 1.25) / max(z, .1);
  gl_PointSize = clamp(s, 1.1, 30.);
  vCol = col;
  // conserva la energía cuando el punto ya no puede achicarse, y se apaga al pasar pegado a la cámara
  vA = min(1., s / 1.1) * smoothstep(.25, 2.2, z) * uFade * mix(2.6, 1., e) * mix(1., .34, smoothstep(5., 30., s));
}`

const fragment = /* glsl */ `
varying vec3 vCol; varying float vA;
void main(){
  float d = length(gl_PointCoord - .5) * 2.;
  float a = exp(-d * d * 4.) * smoothstep(1., .7, d);
  gl_FragColor = vec4(vCol * a * vA, 1.);
}`

const gasFragment = /* glsl */ `
uniform sampler2D uMap; uniform float uI, uLayer, uTime; varying vec2 vUv;
void main(){
  vec2 c = vUv - .5;
  vec3 t = texture2D(uMap, vUv, abs(uLayer) < .05 ? .4 : 2.7 + abs(uLayer) * 1.8).rgb;
  float l = dot(t, vec3(.33));
  float r = length(c) * 2.;
  float edge = smoothstep(1., .72, r);
  // las capas altas solo conservan el bulbo
  float h = mix(1., smoothstep(.34, .0, r), smoothstep(.2, 1., abs(uLayer)));
  gl_FragColor = vec4(pow(t, vec3(1.25)) * (.5 + l) * edge * h * uI, 1.);
}`
const planeVertex = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`

const coreFragment = /* glsl */ `
varying vec2 vUv; uniform float uI;
void main(){
  float d = length(vUv - .5) * 2.;
  float g = exp(-d * d * 9.) * 1.1 + exp(-d * 4.2) * .42;
  gl_FragColor = vec4(mix(vec3(1., .62, .3), vec3(1., .93, .78), exp(-d * d * 14.)) * g * uI * smoothstep(1., .6, d), 1.);
}`

/** Ubica los puntos eligiendo píxeles del mapa con probabilidad proporcional a su brillo. */
function sampleMap(img: HTMLImageElement, n: number) {
  const S = img.width
  const cv = document.createElement('canvas')
  cv.width = cv.height = S
  const ctx = cv.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0)
  const px = ctx.getImageData(0, 0, S, S).data
  const cdf = new Float32Array(S * S)
  let acc = 0
  for (let i = 0; i < S * S; i++) {
    const l = (px[i * 4] + px[i * 4 + 1] + px[i * 4 + 2]) / 765
    acc += Math.pow(l, 1.45)
    cdf[i] = acc
  }
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3)
  for (let k = 0; k < n; k++) {
    const u = Math.random() * acc
    let lo = 0, hi = S * S - 1
    while (lo < hi) { const mid = (lo + hi) >> 1; if (cdf[mid] < u) lo = mid + 1; else hi = mid }
    const x = (lo % S) + Math.random(), y = Math.floor(lo / S) + Math.random()
    const X = (x / S - 0.5) * 2 * R, Z = (y / S - 0.5) * 2 * R
    const r = Math.hypot(X, Z) / R
    const thick = 0.55 + 7.5 * Math.exp(-r * r * 46) + 0.5 * r
    const g = (Math.random() + Math.random() + Math.random() - 1.5) * 1.1
    pos.set([X, g * thick, Z], k * 3)
    const c = new THREE.Color(px[lo * 4] / 255, px[lo * 4 + 1] / 255, px[lo * 4 + 2] / 255).convertSRGBToLinear()
    const l = (c.r + c.g + c.b) / 3
    const sat = 1.35, b = 0.55 + Math.random() * 0.75 + (Math.random() > 0.985 ? 2.2 : 0)
    col.set([(l + (c.r - l) * sat) * b, (l + (c.g - l) * sat) * b, (l + (c.b - l) * sat) * b], k * 3)
  }
  return { pos, col }
}

export default function Galaxy({ q }: { q: Quality }) {
  const { camera, size, viewport, raycaster } = useThree()
  const root = useRef<THREE.Group>(null)
  const gasRefs = useRef<(THREE.Mesh | null)[]>([])
  const core = useRef<THREE.Mesh>(null)
  const st = useRef({ to: 0, spin: 0 })
  const tmp = useMemo(() => ({ plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit: new THREE.Vector3(), ndc: new THREE.Vector2() }), [])
  const geo = useMemo(() => new THREE.BufferGeometry(), [])

  const m = useMemo(() => {
    const pts = new THREE.ShaderMaterial({
      vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: {
        uFrom: { value: 0 }, uTo: { value: 0 }, uMorph: { value: 1 }, uBirth: { value: 0 }, uKick: { value: 0 }, uTime: { value: 0 }, uSize: { value: 100 },
        uFade: { value: 1 }, uSpin: { value: -0.018 }, uMouse: { value: new THREE.Vector3(999, 0, 0) },
      },
    })
    const map = tex('galaxy.webp', { aniso: 8 })
    const layers = Array.from({ length: q.gas }, (_, i) => (i - (q.gas - 1) / 2) / Math.max(1, (q.gas - 1) / 2))
    const gas = layers.map(l => new THREE.ShaderMaterial({
      vertexShader: planeVertex, fragmentShader: gasFragment, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      uniforms: { uMap: { value: map }, uI: { value: 0 }, uLayer: { value: l }, uTime: { value: 0 } },
    }))
    const glow = new THREE.ShaderMaterial({
      vertexShader: planeVertex, fragmentShader: coreFragment, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, uniforms: { uI: { value: 0 } },
    })
    return { pts, gas, layers, glow }
  }, [q.gas])

  useEffect(() => {
    let live = true
    image('galaxy-map.webp').then(img => {
      if (!live) return
      const n = q.galaxy
      const { pos, col } = sampleMap(img, n)
      const rnd = new Float32Array(n * 4)
      for (let i = 0; i < rnd.length; i++) rnd[i] = Math.random()
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
      geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 4))
      geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), R * 1.4)
      J.ready = true
    }).catch(() => { J.ready = true })
    return () => { live = false }
  }, [geo, q.galaxy])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const g = root.current
    if (!g) return
    const t = J.t
    const vis = 1 - smooth(2.2, 2.5, t)
    g.visible = vis > 0.001
    if (!g.visible) return
    const u = m.pts.uniforms, s = st.current
    u.uTime.value += dt
    // al cerrar el bucle el nacimiento lo maneja el scroll (Rig)
    if (J.ready && J.warm && J.raw < T.bang) J.birth = Math.min(1, J.birth + dt / 3.6)
    u.uBirth.value = J.birth
    J.kick = Math.max(0, J.kick - dt / 1.5)
    u.uKick.value = J.kick
    if (J.galaxy !== s.to) {
      u.uFrom.value = u.uMorph.value > 0.5 ? s.to : u.uFrom.value
      u.uTo.value = J.galaxy
      u.uMorph.value = 0
      s.to = J.galaxy
    }
    u.uMorph.value = Math.min(1, u.uMorph.value + dt / 2.2)
    u.uSize.value = size.height * viewport.dpr * 0.16 * (J.narrow ? 0.8 : 1)
    // al llegar a la nebulosa, la galaxia queda como un telón tenue
    u.uFade.value = vis * (0.62 - 0.3 * smooth(0.6, 1.1, t)) * (q.galaxy > 100000 ? 1 : 1.6)

    // gas: solo con la Vía Láctea formada, y se apaga al meternos en el plano del disco
    const milky = s.to === 0 ? smooth(0.55, 1, u.uMorph.value) : u.uFrom.value === 0 ? 1 - smooth(0, 0.3, u.uMorph.value) : 0
    const above = smooth(1.5, 13, Math.abs(camera.position.y))
    const formed = smooth(0.35, 1, J.birth)
    const spin = u.uTime.value * u.uSpin.value
    m.gas.forEach((gm, i) => {
      gm.uniforms.uI.value = (Math.abs(m.layers[i]) < 0.05 ? 0.42 : ((1.25 - Math.abs(m.layers[i]) * 0.7) * 1.15) / m.gas.length) * milky * above * formed * vis
      const me = gasRefs.current[i]
      if (me) me.rotation.z = spin
    })
    m.glow.uniforms.uI.value = (0.35 + 1.1 * formed) * vis * (1 - smooth(0.8, 1.4, t) * 0.8)
    if (core.current) {
      core.current.quaternion.copy(camera.quaternion)
      const b = J.birth < 0.35 ? 0.25 + Math.sin((J.birth / 0.35) * Math.PI) * 1.2 : 1
      core.current.scale.set(34 * b, 24 * b, 1)
    }

    // cursor sobre el plano del disco
    tmp.ndc.set(J.mx, J.my)
    raycaster.setFromCamera(tmp.ndc, camera)
    if (!J.narrow && t < 0.8 && raycaster.ray.intersectPlane(tmp.plane, tmp.hit)) u.uMouse.value.lerp(tmp.hit, 1 - Math.pow(0.002, dt))
    else u.uMouse.value.x = damp(u.uMouse.value.x, 999, 2, dt)
  })

  return (
    <group ref={root} position={C.galaxy}>
      <points geometry={geo} material={m.pts} frustumCulled={false} />
      {m.gas.map((gm, i) => (
        <mesh key={i} ref={el => { gasRefs.current[i] = el }} material={gm} rotation={[-Math.PI / 2, 0, 0]} position={[0, m.layers[i] * 2.6, 0]} renderOrder={-5}>
          <planeGeometry args={[R * 2, R * 2]} />
        </mesh>
      ))}
      <mesh ref={core} material={m.glow} renderOrder={-4}><planeGeometry args={[1, 1]} /></mesh>
    </group>
  )
}
