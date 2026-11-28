import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { fsVertex, hash, noise3 } from './glsl'
import { C, J, T, damp, pose, win } from './journey'
import type { Quality } from './quality'
import { compilePass, warmStart } from './warm'

// Render propio en vez de una librería de postproceso: escena HDR → bloom por mips → composición final
// (warp, aberración, ondas en la tela del espacio-tiempo, curva fílmica, viñeta y grano) en una sola pasada.

export const tri = (() => {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3))
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2))
  return g
})()

const down = /* glsl */ `
uniform sampler2D tIn; uniform vec2 uTexel; uniform float uFirst; varying vec2 vUv;
vec3 s(vec2 o){ vec3 c = texture2D(tIn, vUv + o * uTexel).rgb; return c.r + c.g + c.b >= 0. ? min(c, vec3(40.)) : vec3(0.); }
float lum(vec3 c){ return dot(c, vec3(.2126, .7152, .0722)); }
vec3 knee(vec3 c){ float b = max(c.r, max(c.g, c.b)); float soft = clamp(b - .62, 0., .7); soft = soft * soft / 1.4; return c * max(soft, b - .98) / max(b, 1e-4); }
void main(){
  vec3 a = s(vec2(-2., 2.)), b = s(vec2(0., 2.)), c = s(vec2(2., 2.)), d = s(vec2(-2., 0.)), e = s(vec2(0.)), f = s(vec2(2., 0.)), g = s(vec2(-2., -2.)), h = s(vec2(0., -2.)), i = s(vec2(2., -2.));
  vec3 j = s(vec2(-1., 1.)), k = s(vec2(1., 1.)), l = s(vec2(-1., -1.)), m = s(vec2(1., -1.));
  vec3 col;
  if(uFirst > .5){
    // promedio de Karis: evita que una estrella de un pixel titile con un halo enorme
    vec3 q0 = (j + k + l + m) * .25, q1 = (a + b + d + e) * .25, q2 = (b + c + e + f) * .25, q3 = (d + e + g + h) * .25, q4 = (e + f + h + i) * .25;
    float w0 = .5 / (1. + lum(q0)), w1 = .125 / (1. + lum(q1)), w2 = .125 / (1. + lum(q2)), w3 = .125 / (1. + lum(q3)), w4 = .125 / (1. + lum(q4));
    col = knee((q0 * w0 + q1 * w1 + q2 * w2 + q3 * w3 + q4 * w4) / (w0 + w1 + w2 + w3 + w4));
  } else col = e * .125 + (a + c + g + i) * .03125 + (b + d + f + h) * .0625 + (j + k + l + m) * .125;
  gl_FragColor = vec4(max(col, 0.), 1.);
}`

const up = /* glsl */ `
uniform sampler2D tIn; uniform vec2 uTexel; uniform float uAmt; varying vec2 vUv;
vec3 t(float x, float y){ return texture2D(tIn, vUv + vec2(x, y) * uTexel).rgb; }
void main(){
  vec3 c = t(0., 0.) * 4. + (t(-1., 0.) + t(1., 0.) + t(0., -1.) + t(0., 1.)) * 2. + t(-1., -1.) + t(1., -1.) + t(-1., 1.) + t(1., 1.);
  gl_FragColor = vec4(c / 16. * uAmt, 1.);
}`

// Tela del espacio-tiempo: ecuación de onda en una grilla chica. r = altura ahora, g = altura en el paso anterior.
// El cursor la hunde por donde pasa, el click la golpea, y las ondas se propagan y se apagan solas.
const trail = /* glsl */ `
uniform sampler2D tIn; uniform vec2 uA, uB, uTexel, uHit; uniform float uAmt, uAspect, uRad, uHitAmt; varying vec2 vUv;
void main(){
  vec4 c = texture2D(tIn, vUv);
  float h = c.r;
  float lap = texture2D(tIn, vUv + vec2(uTexel.x, 0.)).r + texture2D(tIn, vUv - vec2(uTexel.x, 0.)).r
            + texture2D(tIn, vUv + vec2(0., uTexel.y)).r + texture2D(tIn, vUv - vec2(0., uTexel.y)).r - 4. * h;
  float next = (2. * h - c.g + .42 * lap) * .982;
  // los bordes absorben: nada rebota contra el marco de la pantalla
  vec2 e = min(vUv, 1. - vUv);
  next *= smoothstep(0., .04, min(e.x, e.y));
  vec2 asp = vec2(uAspect, 1.), q = vUv * asp, a = uA * asp, ba = uB * asp - a;
  float t = clamp(dot(q - a, ba) / max(dot(ba, ba), 1e-6), 0., 1.), d = length(q - a - ba * t);
  next -= exp(-d * d / (uRad * uRad)) * uAmt;
  vec2 hq = (vUv - uHit) * asp;
  next -= exp(-dot(hq, hq) / .0016) * uHitAmt;
  gl_FragColor = vec4(clamp(next, -4., 4.), h, 0., 1.);
}`

const final = /* glsl */ `
uniform sampler2D tScene, tBloom, tTrail;
uniform vec2 uRes;
uniform float uTime, uBloom, uWarp, uTunnel, uGrain, uRift, uCells, uFlash, uExposure, uLens, uStir;
uniform vec3 uTint, uFlashCol;
uniform vec2 uMouse, uFlashAt, uSim;
varying vec2 vUv;
${hash}
${noise3}
vec3 aces(vec3 v){
  v = mat3(.59719, .07600, .02840, .35458, .90834, .13383, .04823, .01566, .83777) * v;
  vec3 a = v * (v + .0245786) - .000090537, b = v * (.983729 * v + .4329510) + .238081;
  return clamp(mat3(1.60475, -.10208, -.00327, -.53108, 1.10813, -.07276, -.07367, -.00605, 1.07602) * (a / b), 0., 1.);
}
vec3 toSrgb(vec3 c){ return mix(c * 12.92, 1.055 * pow(max(c, vec3(1e-5)), vec3(1. / 2.4)) - .055, step(vec3(.0031308), c)); }
void main(){
  vec2 uv = vUv, asp = vec2(uRes.x / uRes.y, 1.);
  vec3 extra = vec3(0.);

  // ---- ondas gravitacionales: la tela se hunde bajo el cursor y las ondas curvan la luz que pasa
  float k = 0.; vec2 disp = vec2(0.);
  if(uRift > 0.){
    vec2 st = 1. / uSim;
    float h = texture2D(tTrail, vUv).r * uRift;
    vec2 gw = vec2(texture2D(tTrail, vUv + vec2(st.x, 0.)).r - texture2D(tTrail, vUv - vec2(st.x, 0.)).r,
                   texture2D(tTrail, vUv + vec2(0., st.y)).r - texture2D(tTrail, vUv - vec2(0., st.y)).r) * uRift;
    uv += gw * .05;
    // cada color se desvía distinto en el frente de onda
    disp = gw * .03;
    k = min(length(gw) * 20., 1.);
    // la tela solo se ve donde está alterada: una grilla fina que siguen las ondas y que se hunde hacia el cursor
    vec2 md = (vUv - uMouse) * asp;
    float m2 = dot(md, md), lens = uLens / .34;
    float cells = uCells * 2.2;
    // pozo: cerca del cursor la grilla se junta hacia el centro, como una tela hundida por una masa
    vec2 well = -md * exp(-m2 * 70.) * lens * .55;
    // la onda la corre como mucho un tercio de celda: más, y las líneas se enrulan
    vec2 sh = gw * cells * .9;
    vec2 gp = (vUv * asp + well) * cells + sh * min(1., .33 / max(length(sh), 1e-4));
    vec2 gl = abs(fract(gp + .5) - .5) / max(fwidth(gp), vec2(1e-4));
    float line = 1. - smoothstep(.15, 1.15, min(gl.x, gl.y));
    // con el mouse quieto el pozo queda apenas insinuado
    float act = min(smoothstep(.006, .05, abs(h)) + exp(-m2 * 22.) * lens * (.2 + .7 * uStir), 1.);
    vec3 fab = mix(uTint, vec3(1.), .4);
    extra += fab * line * act * act * .2;
    // brillo de la cresta, del lado de donde viene la luz: fino, solo donde la pendiente es fuerte
    float crest = max(dot(gw, vec2(-.55, .83)), 0.) * 12.;
    extra += fab * min(crest * crest, 1.) * .07;
  }

  // ---- el cursor curva la luz a su alrededor, como una lente gravitacional
  if(uLens > .001){
    vec2 ld = (vUv - uMouse) * asp; float l2 = dot(ld, ld);
    uv -= ld / asp * exp(-l2 * 150.) * uLens;
    extra += uTint * exp(-pow(abs((sqrt(l2) - .085) * 46.), 2.)) * uLens * .05;
  }

  // ---- warp: desenfoque radial con separación de color
  vec2 c = uv - .5; float r2 = dot(c * asp, c * asp);
  float ca = .0006 + r2 * .0022 + uWarp * .006 + uTunnel * .006 + k * .003;
  vec3 col;
  float blur = uWarp * .11 + uTunnel * .16;
  if(blur > .004){
    col = vec3(0.); float tot = 0., j = hash21(vUv * uRes + fract(uTime) * 61.);
    for(int i = 0; i < 12; i++){
      float f = (float(i) + j) / 12., s = 1. - f * blur * smoothstep(0., .5, r2 * 1.6 + .12), w = 1. - f * .6;
      vec2 p = .5 + c * s;
      col += vec3(texture2D(tScene, p + c * ca * f * 2.).r, texture2D(tScene, p).g, texture2D(tScene, p - c * ca * f * 2.).b) * w; tot += w;
    }
    col /= tot;
  } else col = vec3(texture2D(tScene, uv + c * ca + disp).r, texture2D(tScene, uv).g, texture2D(tScene, uv - c * ca - disp).b);

  col += texture2D(tBloom, uv).rgb * uBloom;
  col += extra;
  // el fogonazo nace en un punto: los bordes conservan el color del lugar
  if(uFlash > .001){ vec2 fd = (vUv - uFlashAt) * asp; col += uFlash * mix(uFlashCol, vec3(1.), .4) * (.1 + 2.2 * exp(-dot(fd, fd) * 7.)); }
  col *= uExposure;
  col *= mix(1., .34, smoothstep(.18, .95, r2));
  col = toSrgb(aces(col));
  col += (hash21(vUv * uRes + fract(uTime * 7.) * 191.) - .5) * uGrain;
  gl_FragColor = vec4(col, 1.);
}`

function mat(fragmentShader: string, uniforms: Record<string, THREE.IUniform>, blending: THREE.Blending = THREE.NoBlending) {
  return new THREE.ShaderMaterial({ vertexShader: fsVertex, fragmentShader, uniforms, blending, depthTest: false, depthWrite: false, transparent: blending !== THREE.NoBlending })
}

/** La tela se adapta al lugar: grilla fina y densa entre el hielo, ancha en la nebulosa, casi nula en pleno salto. */
const riftLevel = () => (1 - J.tunnel * 0.8) * (J.explore ? 0.6 : 1) * (1 - 0.6 * win(J.raw, 16.5, 17.2, 19, 19.2))
function riftCells() {
  const t = J.t
  if (t > T.atlas && t < T.atlasOut) return 8
  if (t > 9.6 && t < 11.6) return 15
  if (t > 2.6 && t < 4.6) return 6.5
  if (t > 0.6 && t < 2.6) return 7.5
  return 10
}

const core = new THREE.Vector3()
const hyper = new THREE.Color('#5f8dff')

/** Fogonazo del Big Bang y de la salida de cada salto. */
function flash() {
  const b = J.birth > 0 && J.birth < 0.5 ? Math.exp(-J.birth * 12) * 0.8 : 0
  const s = (c: number) => Math.exp(-Math.pow((J.raw - c) / 0.05, 2))
  return b + s(19) * 0.5 + (s(2.5) * 0.3 + s(4.5) * 0.42 + s(T.atlas) * 0.45 + s(T.atlasOut) * 0.3) * Math.min(1, 0.25 + J.tunnel)
}

export default function Pipeline({ q }: { q: Quality }) {
  const { gl, size, viewport } = useThree()

  const p = useMemo(() => {
    const type = gl.extensions.has('EXT_color_buffer_float') || gl.extensions.has('EXT_color_buffer_half_float') ? THREE.HalfFloatType : THREE.UnsignedByteType
    const opt = { type, depthBuffer: false, stencilBuffer: false, generateMipmaps: false }
    const scene = new THREE.WebGLRenderTarget(4, 4, { ...opt, depthBuffer: true, samples: q.msaa })
    const mips = Array.from({ length: q.bloomLevels }, () => new THREE.WebGLRenderTarget(4, 4, opt))
    // la onda necesita valores negativos: sin texturas de punto flotante no hay tela
    const sim = type !== THREE.UnsignedByteType
    const trails = [0, 1].map(() => new THREE.WebGLRenderTarget(384, 216, opt))
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const quad = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(tri)
    quad.frustumCulled = false
    const qs = new THREE.Scene()
    qs.add(quad)
    const mDown = mat(down, { tIn: { value: null }, uTexel: { value: new THREE.Vector2() }, uFirst: { value: 0 } })
    const mUp = mat(up, { tIn: { value: null }, uTexel: { value: new THREE.Vector2() }, uAmt: { value: 1 } }, THREE.AdditiveBlending)
    const mTrail = mat(trail, {
      tIn: { value: null }, uA: { value: new THREE.Vector2() }, uB: { value: new THREE.Vector2() }, uTexel: { value: new THREE.Vector2(1 / 384, 1 / 216) },
      uAmt: { value: 0 }, uAspect: { value: 1 }, uRad: { value: 0.03 }, uHit: { value: new THREE.Vector2(0.5, 0.5) }, uHitAmt: { value: 0 },
    })
    const mFinal = mat(final, {
      tScene: { value: scene.texture }, tBloom: { value: mips[0].texture }, tTrail: { value: trails[0].texture }, uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 }, uBloom: { value: 1 }, uWarp: { value: 0 }, uTunnel: { value: 0 }, uGrain: { value: 0.045 }, uRift: { value: 0 }, uLens: { value: 0 }, uCells: { value: 9 },
      uFlash: { value: 0 }, uExposure: { value: 1 }, uTint: { value: new THREE.Color() }, uMouse: { value: new THREE.Vector2(0.5, 0.5) }, uStir: { value: 0 }, uSim: { value: new THREE.Vector2(384, 216) },
      uFlashAt: { value: new THREE.Vector2(0.5, 0.5) }, uFlashCol: { value: new THREE.Color() },
    })
    const pass = (m: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget | null) => { quad.material = m; gl.setRenderTarget(target); gl.render(qs, cam) }
    return { scene, mips, trails, sim, mDown, mUp, mTrail, mFinal, quad, qs, cam, pass, flip: 0 }
  }, [gl, q.msaa, q.bloomLevels])

  useEffect(() => () => {
    p.scene.dispose()
    p.mips.forEach(m => m.dispose())
    p.trails.forEach(m => m.dispose())
    ;[p.mDown, p.mUp, p.mTrail, p.mFinal].forEach(m => m.dispose())
  }, [p])

  useEffect(() => {
    const w = Math.max(2, Math.floor(size.width * viewport.dpr)), h = Math.max(2, Math.floor(size.height * viewport.dpr))
    p.scene.setSize(w, h)
    let mw = w, mh = h
    p.mips.forEach((m, i) => {
      const k = i === 0 ? q.bloomStart : 2
      mw = Math.max(2, Math.floor(mw / k))
      mh = Math.max(2, Math.floor(mh / k))
      m.setSize(mw, mh)
    })
    p.mFinal.uniforms.uRes.value.set(w, h)
    p.mTrail.uniforms.uAspect.value = w / h
    // celdas cuadradas en pantalla: si no, las ondas viajarían más rápido de costado
    const sh = 216, sw = Math.min(520, Math.max(120, Math.round((sh * w) / h)))
    p.trails.forEach(t => t.setSize(sw, sh))
    p.mTrail.uniforms.uTexel.value.set(1 / sw, 1 / sh)
    p.mFinal.uniforms.uSim.value.set(sw, sh)
  }, [p, size, viewport.dpr, q.bloomStart])

  const last = useRef({ x: 0.5, y: 0.5, amt: 0, acc: 0, age: 99, hit: false })
  const moved = useRef(false)
  const started = useRef(false)

  useFrame(({ scene, camera, invalidate }, delta) => {
    if (!J.warm) {
      if (started.current) return
      started.current = true
      // lo que se ve al entrar: se espera a que compile (en otro hilo) antes del primer dibujo
      const first: THREE.Object3D[] = []
      scene.traverseVisible(o => { if ((o as THREE.Mesh).material) first.push(o) })
      const own = ([[p.mDown, p.mips[0]], [p.mUp, p.mips[0]], [p.mTrail, p.trails[0]], [p.mFinal, null]] as const).map(([m, t]) => { p.quad.material = m; return compilePass(gl, p.qs, p.cam, t) })
      void warmStart({ gl, scene, camera }, first, own).then(() => { J.warm = true; invalidate() })
      return
    }
    const dt = Math.min(delta, 0.05)
    const u = p.mFinal.uniforms
    gl.autoClear = true
    gl.setRenderTarget(p.scene)
    gl.render(scene, camera)

    // bloom
    let src: THREE.WebGLRenderTarget = p.scene
    p.mips.forEach((m, i) => {
      p.mDown.uniforms.tIn.value = src.texture
      p.mDown.uniforms.uTexel.value.set(1 / src.width, 1 / src.height)
      p.mDown.uniforms.uFirst.value = i === 0 ? 1 : 0
      p.pass(p.mDown, m)
      src = m
    })
    gl.autoClear = false
    for (let i = p.mips.length - 1; i > 0; i--) {
      p.mUp.uniforms.tIn.value = p.mips[i].texture
      p.mUp.uniforms.uTexel.value.set(1 / p.mips[i].width, 1 / p.mips[i].height)
      p.mUp.uniforms.uAmt.value = 0.86
      p.pass(p.mUp, p.mips[i - 1])
    }

    // tela del espacio-tiempo: pasos fijos de 1/60 s, así las ondas viajan igual a 60 o a 144 fps
    const rift = q.rift && p.sim
    if (rift) {
      const l = last.current
      const x = J.px * 0.5 + 0.5, y = J.py * 0.5 + 0.5
      const sp = Math.hypot(x - l.x, y - l.y) / Math.max(dt, 1e-3)
      if (sp > 0) moved.current = true
      l.amt = damp(l.amt, Math.min(1, sp * 0.8), sp > 0.05 ? 14 : 5, dt)
      const tu = p.mTrail.uniforms
      // el golpe espera al próximo paso: a más de 60 fps hay cuadros sin paso
      if (J.hit.age < l.age) l.hit = true
      l.age = J.hit.age
      l.acc = Math.min(l.acc + dt * 60, 3)
      let first = true
      while (l.acc >= 1) {
        l.acc -= 1
        const a = p.trails[p.flip], b = p.trails[1 - p.flip]
        tu.tIn.value = a.texture
        tu.uA.value.set(l.x, l.y)
        tu.uB.value.set(x, y)
        tu.uAmt.value = first && sp > 0.02 ? l.amt * 0.014 : 0
        tu.uRad.value = 0.022 + l.amt * 0.02
        tu.uHit.value.set(J.hit.x, J.hit.y)
        tu.uHitAmt.value = first && l.hit ? 0.6 : 0
        if (first) l.hit = false
        p.pass(p.mTrail, b)
        p.flip = 1 - p.flip
        first = false
      }
      if (!first) { l.x = x; l.y = y }
      u.tTrail.value = p.trails[p.flip].texture
      u.uMouse.value.set(x, y)
      // sube rápido al mover el mouse y baja despacio al soltarlo
      u.uStir.value = damp(u.uStir.value, Math.min(1, l.amt * 1.6), l.amt * 1.6 > u.uStir.value ? 8 : 0.9, dt)
    }
    u.uRift.value = rift ? riftLevel() : 0
    u.uLens.value = damp(u.uLens.value, rift && moved.current && !J.narrow ? 0.34 * (1 - J.tunnel) : 0, 3, dt)
    u.uCells.value = riftCells()
    J.hit.age += dt
    u.uTime.value += dt
    u.uBloom.value = pose.bloom * (1 - J.tunnel * 0.5)
    // el ojo se acostumbra: dentro de los túneles y pegado al disco, menos exposición
    u.uExposure.value = damp(u.uExposure.value, (1 - J.tunnel * 0.36) * (1 - 0.34 * win(J.t, 3.62, 3.95, 4.5, 4.6)) * (1 + 0.35 * win(J.raw, 15, 15.3, 16.7, 17.3)), 5, dt)
    u.uWarp.value = q.warp ? J.warp : 0
    u.uTunnel.value = q.warp ? J.tunnel : 0
    u.uFlash.value = flash()
    if (J.birth < 0.5) { core.copy(C.galaxy).project(camera); u.uFlashAt.value.set(core.x * 0.5 + 0.5, core.y * 0.5 + 0.5) } else u.uFlashAt.value.set(0.5, 0.5)
    u.uFlashCol.value.copy(J.t > 2 && J.t < 3 ? hyper : pose.tint)
    u.uTint.value.copy(pose.tint)
    p.pass(p.mFinal, null)
    gl.autoClear = true
  }, 1)

  return null
}
