import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { fsVertex, hash, noise3 } from '../glsl'
import { J, T } from '../journey'
import { tri } from '../Pipeline'
import { U, mulberry } from '../shared'
import type { Quality } from '../quality'
import { compilePass, started } from '../warm'
import { atlasSky, equirect } from './glsl'
import { atlasViews } from './layout'

// El cielo del atlas: una nebulosa que se calcula una sola vez en la GPU (en pasadas chicas, una por frame) y queda en una
// textura equirectangular. Cada rincón del cielo tiene su paleta: detrás de cada objeto hay una nebulosa distinta.
// Arriba de eso, detalle fino calculado en vivo, estrellas nítidas y las brillantes con los destellos del James Webb.

/** Uniforms del cielo, compartidos con los objetos que curvan la luz. */
export const AS = {
  uAtlasSky: { value: null as THREE.Texture | null },
  uSkyDetail: { value: 1 },
  /** Hacia dónde mira la portada: ahí están los pilares de polvo. */
  uPortal: { value: atlasViews[0].clone() },
}

/** Está la cámara en el atlas. */
export const inAtlas = (t: number) => t >= T.atlas - 1e-4 && t < T.atlasOut

const noise = /* glsl */ `
varying vec2 vUv; uniform sampler2D uWx, uWy; uniform float uWarp, uFreq, uRidge; uniform vec3 uOff; uniform int uOct;
${hash}
${noise3}
${equirect}
void main(){
  vec3 d = eqDir(vUv);
  if(uWarp > 0.){
    // deformación a lo largo del cielo: este y norte del punto
    vec3 e = normalize(cross(vec3(0., 1., 0.), d) + vec3(1e-4, 0., 0.)), n = cross(d, e);
    d += (e * texture2D(uWx, vUv).r + n * texture2D(uWy, vUv).r) * uWarp;
  }
  vec3 q = d * uFreq + uOff;
  float a = .5, s = 0.;
  for(int i = 0; i < 8; i++){
    if(i >= uOct) break;
    float v = vnoise(q), c = 1. - abs(v) * 2.;
    s += a * mix(v, c * c, uRidge);
    q = q * 2.03 + 17.17; a *= .5;
  }
  gl_FragColor = vec4(s, 0., 0., 1.);
}`

const compose = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uWx, uWy, uG, uR, uF; uniform vec2 uTexel;
uniform vec3 uC[9]; uniform vec4 uP[9];
${equirect}
/** Paleta de cada rincón: f.x = mezcla de color, f.y = gas, f.z = detalle. */
vec3 palette(float id, vec3 f){
  vec3 a, b, c, d;
  if(id < .5){ a = vec3(.02, .07, .30); b = vec3(.08, .28, .80); c = vec3(.30, .62, 1.0); d = vec3(.75, .85, 1.); }        // vivero: azul con velos cian
  else if(id < 1.5){ a = vec3(.12, .03, .34); b = vec3(.62, .07, .48); c = vec3(1.0, .26, .52); d = vec3(.30, .42, 1.); }  // magenta y azul
  else if(id < 2.5){ a = vec3(.07, .03, .26); b = vec3(.28, .10, .66); c = vec3(.08, .62, .72); d = vec3(.6, .9, 1.); }    // violeta y turquesa
  else if(id < 3.5){ a = vec3(.05, .006, .006); b = vec3(.42, .04, .03); c = vec3(.95, .26, .07); d = vec3(1., .62, .3); } // rojo profundo: el universo joven
  else if(id < 4.5){ a = vec3(.01, .02, .07); b = vec3(.05, .09, .28); c = vec3(.28, .16, .50); d = vec3(.4, .6, 1.); }    // azul tenue
  else if(id < 5.5){ a = vec3(.02, .10, .12); b = vec3(.04, .38, .44); c = vec3(1.0, .58, .18); d = vec3(1., .86, .5); }   // dorado y turquesa
  else if(id < 6.5){ a = vec3(.03, .03, .20); b = vec3(.22, .12, .72); c = vec3(.52, .36, 1.0); d = vec3(1., .62, 1.); }   // azul y púrpura
  else if(id < 7.5){ a = vec3(.01, .025, .07); b = vec3(.04, .14, .32); c = vec3(.2, .46, .82); d = vec3(.9, .74, .5); }   // azul profundo, contra el dorado de la esfera
  else { a = vec3(0.); b = vec3(.03, .008, .015); c = vec3(.14, .03, .03); d = vec3(.3, .1, .05); }                      // futuro lejano
  vec3 col = mix(a, b, smoothstep(-.32, .32, f.x));
  col = mix(col, c, smoothstep(.05, .55, f.x * .55 + f.z * .9));
  return col + d * pow(max(f.y - .32, 0.), 2.) * 2.4;
}
void main(){
  vec3 d = eqDir(vUv);
  float wx = texture2D(uWx, vUv).r, wy = texture2D(uWy, vUv).r, g = texture2D(uG, vUv).r, r = texture2D(uR, vUv).r, f = texture2D(uF, vUv).r;
  float rUp = texture2D(uR, vUv + vec2(0., uTexel.y * 3.)).r;
  // gas tenue en todo el cielo
  vec3 E = vec3(.004, .005, .013) * (1. + 3. * smoothstep(-.1, .6, g + wy * .4));
  float D = 0.; vec3 tintD = vec3(0.);
  for(int i = 0; i < 9; i++){
    vec4 P = uP[i];
    float ang = acos(clamp(dot(d, uC[i]), -1., 1.));
    float w = exp(-pow(ang / P.y, 2.) * (1. + wx * .7));
    if(w < .002) continue;
    float gas = smoothstep(-.42, .55, g + wy * .7 + (w - .5) * .45);
    E += palette(P.x, vec3(wx + wy * .5, g, f)) * gas * gas * w * P.z * 1.6;
    float dd = w * P.w * smoothstep(.48, .84, r * .9 + g * .32 + wx * .25);
    D += dd;
    tintD += palette(P.x, vec3(-.4, .0, -.3)) * dd;
  }
  D = clamp(D, 0., 1.);
  // polvo: oscuro, con el borde de arriba encendido por las estrellas jóvenes
  float rim = clamp((r - rUp) * 9., 0., 1.) * smoothstep(.05, .5, D);
  vec3 dust = vec3(.035, .016, .009) + tintD * .35 + vec3(.3, .13, .05) * smoothstep(-.2, .6, f + g * .5) * D * .6;
  vec3 col = E * (1. - D * .93) + dust * D + vec3(1., .66, .38) * rim * .55;

  gl_FragColor = vec4(col, D);
}`

/** Rincones del cielo: dirección y [paleta, radio, brillo, polvo]. Uno por parada; el primero es la portada. */
const corners: [number, number, number, number][] = [
  [0, 0.78, 1.05, 0.22], [1, 0.62, 1.15, 0.45], [2, 0.6, 0.95, 0.35], [3, 0.66, 0.6, 0.55], [4, 0.6, 0.55, 0.2],
  [5, 0.62, 1.05, 0.6], [6, 0.6, 1, 0.38], [7, 0.6, 0.95, 0.32], [8, 0.62, 0.7, 0.12],
]

const maps: { warp: number; freq: number; oct: number; ridge: number; off: [number, number, number] }[] = [
  { warp: 0, freq: 1.4, oct: 5, ridge: 0, off: [3.1, 3.1, 3.1] },
  { warp: 0, freq: 1.4, oct: 5, ridge: 0, off: [9.7, 9.7, 9.7] },
  { warp: 0.42, freq: 2.6, oct: 7, ridge: 0, off: [1.3, 0.2, 5.4] },
  { warp: 0.5, freq: 2.2, oct: 6, ridge: 1, off: [4.2, 7.1, 2.2] },
  { warp: 0.3, freq: 7.5, oct: 5, ridge: 0, off: [8.8, 1.7, 3.9] },
]

const domeVertex = /* glsl */ `
varying vec3 vDir;
void main(){ vDir = position; vec4 p = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); gl_Position = p.xyww; }`
const domeFragment = /* glsl */ `
uniform float uI; varying vec3 vDir;
${hash}
${noise3}
${atlasSky}
void main(){ gl_FragColor = vec4(atlasSkyAt(normalize(vDir)) * uI, 1.); }`

// Estrellas brillantes: núcleo, halo y los seis destellos del espejo hexagonal (más dos chicos horizontales)
const starVertex = /* glsl */ `
attribute vec4 aS; uniform float uPR, uScale;
varying vec3 vC; varying float vSize, vF;
void main(){
  vec4 p = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
  gl_Position = p.xyww;
  vF = aS.w;
  vSize = uPR * uScale * (5. + 170. * pow(aS.w, .75));
  gl_PointSize = vSize;
  vC = aS.rgb;
}`
const starFragment = /* glsl */ `
uniform float uI; varying vec3 vC; varying float vSize, vF;
void main(){
  vec2 q = (gl_PointCoord - .5) * vSize; float r = length(q);
  float core = exp(-r * r / 2.6) * 2.4 + exp(-r / (1.2 + vF * 7.)) * (.35 + vF);
  float sp = 0.;
  for(int k = 0; k < 3; k++){
    float a = 1.5708 + float(k) * 1.0472;
    vec2 dir = vec2(cos(a), sin(a));
    float along = abs(dot(q, dir)), perp = abs(dot(q, vec2(-dir.y, dir.x)));
    sp += exp(-perp / (.55 + vF * .6)) * exp(-along / (vSize * .12));
  }
  sp += exp(-abs(q.y) / .5) * exp(-abs(q.x) / (vSize * .05)) * .45;
  float fade = smoothstep(.5 * vSize, .3 * vSize, r);
  vec3 c = mix(vC, vec3(1.), min(core * .25, .7));
  gl_FragColor = vec4(c * (core + sp * (.4 + vF * 1.6)) * fade * uI, 1.);
}`

export default function AtlasSky({ q }: { q: Quality }) {
  const { gl, camera, viewport, invalidate } = useThree()
  const root = useRef<THREE.Group>(null)
  const baked = useRef(0)

  const p = useMemo(() => {
    const W = q.bigTex ? 2048 : 1024, H = W / 2
    const opt = { depthBuffer: false, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, type: THREE.HalfFloatType } as const
    const out = new THREE.WebGLRenderTarget(W, H, opt)
    out.texture.wrapS = THREE.RepeatWrapping
    const tmp = maps.map(() => new THREE.WebGLRenderTarget(W, H, { ...opt, format: THREE.RedFormat }))
    const common = { vertexShader: fsVertex, depthTest: false, depthWrite: false, blending: THREE.NoBlending } as const
    const nm = new THREE.ShaderMaterial({ ...common, fragmentShader: noise, uniforms: { uWx: { value: null }, uWy: { value: null }, uWarp: { value: 0 }, uFreq: { value: 1 }, uRidge: { value: 0 }, uOff: { value: new THREE.Vector3() }, uOct: { value: 5 } } })
    const cm = new THREE.ShaderMaterial({
      ...common, fragmentShader: compose,
      uniforms: {
        uWx: { value: tmp[0].texture }, uWy: { value: tmp[1].texture }, uG: { value: tmp[2].texture }, uR: { value: tmp[3].texture }, uF: { value: tmp[4].texture },
        uTexel: { value: new THREE.Vector2(1 / W, 1 / H) },
        uC: { value: atlasViews.map(v => v.clone()) },
        uP: { value: corners.map(c => new THREE.Vector4(...c)) },
      },
    })
    const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), quad = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(tri, nm)
    quad.frustumCulled = false
    scene.add(quad)
    return { out, tmp, nm, cm, quad, scene, cam, ready: false }
  }, [q.bigTex])

  const dome = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: domeVertex, fragmentShader: domeFragment, side: THREE.BackSide, depthWrite: false, depthTest: false,
    uniforms: { ...AS, uI: { value: 0 } },
  }), [])

  const stars = useMemo(() => {
    const rnd = mulberry(77), n = q.bigTex ? 300 : 160
    const pos = new Float32Array(n * 3), s = new Float32Array(n * 4)
    const v = new THREE.Vector3(), c = new THREE.Color()
    for (let i = 0; i < n; i++) {
      // un tercio se agrupa en los rincones con nebulosa (cúmulos jóvenes); el resto, al azar
      if (i % 3 === 0) {
        const k = atlasViews[(i / 3) % 6 | 0]
        v.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.9).add(k).normalize()
      } else v.set(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize()
      pos.set([v.x, v.y, v.z], i * 3)
      const hue = rnd()
      c.setRGB(...((hue < 0.55 ? [0.72, 0.82, 1] : hue < 0.85 ? [1, 0.93, 0.82] : [1, 0.7, 0.45]) as [number, number, number]))
      s.set([c.r, c.g, c.b, Math.pow(rnd(), 5.5)], i * 4)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aS', new THREE.BufferAttribute(s, 4))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 2)
    const m = new THREE.ShaderMaterial({
      vertexShader: starVertex, fragmentShader: starFragment, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
      uniforms: { uPR: U.pr, uScale: { value: 1 }, uI: { value: 0 } },
    })
    return { g, m }
  }, [q.bigTex])

  useEffect(() => {
    // acá y no en el useMemo: en desarrollo React puede crear el memo dos veces y quedarse con uno solo
    AS.uAtlasSky.value = p.out.texture
    baked.current = 0
    void started.then(() => Promise.all([[p.nm, p.tmp[0]], [p.cm, p.out]].map(([m, t]) => {
      p.quad.material = m as THREE.Material
      return compilePass(gl, p.scene, p.cam, t as THREE.WebGLRenderTarget)
    }))).then(() => { p.ready = true; invalidate() })
    return () => { p.out.dispose(); p.tmp.forEach(t => t.dispose()); p.nm.dispose(); p.cm.dispose() }
  }, [p, gl, invalidate])

  useFrame(() => {
    // un mapa por frame, para no trabar la página
    if (p.ready && baked.current <= maps.length) {
      const k = baked.current++
      const keep = gl.getRenderTarget()
      if (k < maps.length) {
        const m = maps[k], u = p.nm.uniforms
        u.uWx.value = m.warp ? p.tmp[0].texture : null
        u.uWy.value = m.warp ? p.tmp[1].texture : null
        u.uWarp.value = m.warp
        u.uFreq.value = m.freq
        u.uOct.value = m.oct
        u.uRidge.value = m.ridge
        u.uOff.value.set(...m.off)
        p.quad.material = p.nm
        gl.setRenderTarget(p.tmp[k])
      } else {
        p.quad.material = p.cm
        gl.setRenderTarget(p.out)
      }
      gl.render(p.scene, p.cam)
      gl.setRenderTarget(keep)
      if (baked.current > maps.length) p.tmp.forEach(t => t.dispose())
      else invalidate()
    }
    const g = root.current
    if (!g) return
    const on = inAtlas(J.t) ? 1 : 0
    g.visible = on > 0
    if (!on) return
    g.position.copy(camera.position)
    dome.uniforms.uI.value = 1 - J.tunnel * 0.6
    stars.m.uniforms.uI.value = 1 - J.tunnel
    stars.m.uniforms.uScale.value = Math.min(1.2, Math.max(0.7, window.innerHeight / 900))
    void viewport
  })

  return (
    <group ref={root} visible={false}>
      <mesh material={dome} renderOrder={-19} frustumCulled={false}><sphereGeometry args={[1, 48, 32]} /></mesh>
      <points geometry={stars.g} material={stars.m} renderOrder={-18.5} frustumCulled={false} />
    </group>
  )
}
