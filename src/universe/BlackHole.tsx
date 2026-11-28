import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { tex } from './assets'
import { fsVertex, hash, noise3 } from './glsl'
import { C, J, pose, smooth, win } from './journey'
import { tri } from './Pipeline'
import { U } from './shared'
import { skyLookup, skyQuaternion } from './Sky'
import type { Quality } from './quality'
import { beforeStart, compilePass, gpuDone } from './warm'

// Sagitario A*: cada píxel sigue la trayectoria de un rayo de luz en la métrica de Schwarzschild (radio = 1).
// El cielo, el disco y el título "Proyectos" (que flota detrás) se ven deformados por la gravedad de verdad, sin trucos.
// Los rayos se calculan a menor resolución y guardan a dónde llegan; el título y las estrellas se leen después, a resolución completa.

const fragment = /* glsl */ `
layout(location = 0) out vec4 oCol; layout(location = 1) out vec4 oMap;
varying vec2 vUv;
uniform mat4 uInvProj, uCamWorld; uniform mat3 uSkyInv;
uniform vec3 uCam; uniform float uTime, uDisk;
uniform vec3 uTextPos; uniform vec2 uTextSize;
${hash}
${noise3}
vec2 oct(vec3 n){ n /= abs(n.x) + abs(n.y) + abs(n.z); vec2 e = n.z >= 0. ? n.xy : (1. - abs(n.yx)) * vec2(n.x >= 0. ? 1. : -1., n.y >= 0. ? 1. : -1.); return e; }
const float R = 26.;
vec4 diskAt(vec3 p, vec3 v){
  float r = length(p.xz);
  if(r < 2.5 || r > 11.5) return vec4(0.);
  float phi = atan(p.z, p.x);
  float w = 2.4 * pow(r, -1.5);
  // dos fases cruzadas: el gas gira a distinta velocidad según el radio sin enrollarse para siempre
  float T = 9., t1 = mod(uTime, T), t2 = mod(uTime + T * .5, T);
  float k = abs(t1 / T * 2. - 1.);
  float a1 = phi + w * t1 * 2.2, a2 = phi + w * t2 * 2.2;
  float n1 = fbm(vec3(cos(a1) * r * .42, r * 1.7, sin(a1) * r * .42), 4), n2 = fbm(vec3(cos(a2) * r * .42, r * 1.7 + 7., sin(a2) * r * .42), 4);
  float n = mix(n1, n2, k);
  float rings = .5 + .5 * sin(r * 9. + n * 7.);
  float edge = smoothstep(2.5, 3.1, r) * smoothstep(11.5, 6.2, r);
  float dens = edge * smoothstep(-.42, .42, n + (rings - .5) * .22);
  // efecto Doppler y corrimiento al rojo gravitatorio
  vec3 vel = normalize(vec3(p.z, 0., -p.x)) * sqrt(.5 / max(r - 1., .3));
  float g = sqrt(max(1. - 1. / r, .02)) / (1. + dot(vel, normalize(v)));
  float heat = pow(3. / r, 1.15) * g;
  vec3 col = mix(vec3(.75, .13, .02), vec3(1., .5, .16), smoothstep(.12, .5, heat));
  col = mix(col, vec3(1., .86, .66), smoothstep(.45, 1., heat));
  col = mix(col, vec3(.86, .93, 1.), smoothstep(1., 1.7, heat));
  return vec4(col * (.25 + 2.7 * heat * heat) * g * g, dens * .93);
}
void main(){
  vec2 ndc = vUv * 2. - 1.;
  vec4 q = uInvProj * vec4(ndc, 1., 1.);
  vec3 v = normalize(mat3(uCamWorld) * (q.xyz / q.w));
  vec3 p = uCam;
  vec3 col = vec3(0.); float T = 1.; bool captured = false;
  float r = length(p), b = dot(p, v);
  bool go = true;
  if(r > R){
    float d = b * b - (r * r - R * R);
    if(d < 0. || b > 0.){
      // lejos: alcanza con la deflexión de campo débil
      vec3 c = p - v * b; float bb = length(c);
      if(b < 0.) v = normalize(v - c / bb * 2. / bb);
      go = false;
    } else p += v * (-b - sqrt(d));
  }
  float glow = 0., photon = 0.; vec2 tuv = vec2(-9.); float tt = 0.;
  if(go){
    vec3 h = cross(p, v); float h2 = dot(h, h);
    float jitter = hash21(gl_FragCoord.xy + fract(uTime) * 37.);
    for(int i = 0; i < STEPS; i++){
      float r2 = dot(p, p); r = sqrt(r2);
      if(r < 1.){ captured = true; break; }
      float dt = clamp((r - .85) * .13, .022, 1.5);
      // paso fino al cruzar el plano del disco
      if(abs(p.y) < 1.2 && r < 13.) dt = min(dt, max(abs(p.y) * .8 + .05, .05));
      if(i == 0) dt *= .4 + jitter * .6;
      vec3 a = -1.5 * h2 * p / (r2 * r2 * r);
      vec3 np = p + v * dt + a * dt * dt * .5;
      vec3 nv = v + a * dt;
      if(p.y * np.y < 0.){
        float f = p.y / (p.y - np.y); vec3 x = mix(p, np, f);
        vec4 d = diskAt(x, v);
        d.a *= uDisk;
        col += T * d.rgb * d.a; T *= 1. - d.a;
      }
      // halo de polvo tenue cerca del disco
      float rr = length(p.xz);
      photon += dt * exp(-pow(abs((r - 1.5) * 7.), 2.));
      glow += dt * exp(-abs(p.y) * 3.2) * smoothstep(12., 3., rr) * smoothstep(1.6, 3., rr) * .011 * T;
      float za = p.z - uTextPos.z, zb = np.z - uTextPos.z;
      if(za * zb < 0.){
        vec3 x = mix(p, np, za / (za - zb));
        tuv = (x.xy - uTextPos.xy) / uTextSize + .5;
      }
      p = np; v = nv;
      if(T < .01) break;
      if(r > R && dot(p, v) > 0.) break;
    }
  }
  if(!captured && T > .01){
    v = normalize(v);
    if(!go){
      float s = (uTextPos.z - p.z) / v.z;
      if(s > 0.) tuv = ((p + v * s).xy - uTextPos.xy) / uTextSize + .5;
    }
  } else T = 0.;
  col += vec3(1., .55, .22) * glow * uDisk + vec3(1., .72, .45) * smoothstep(1., 6., photon) * (captured ? .25 : 1.6) * T;
  oCol = vec4(col, T);
  oMap = vec4(oct(uSkyInv * normalize(v)), tuv);
}`

const show = /* glsl */ `
layout(location = 0) out vec4 oCol;
uniform sampler2D uMap, uRay, uSky, uText; uniform vec2 uTexel; uniform float uScale, uA, uSkyI, uTextI; varying vec2 vUv;
${hash}
${skyLookup}
vec3 deoct(vec2 e){ vec3 n = vec3(e, 1. - abs(e.x) - abs(e.y)); float t = max(-n.z, 0.); n.xy += vec2(n.x >= 0. ? -t : t, n.y >= 0. ? -t : t); return normalize(n); }
// Catmull-Rom en 5 muestras: agranda sin escalones
vec4 sharp(vec2 uv){
  vec2 sp = uv / uTexel, c = floor(sp - .5) + .5, f = sp - c;
  vec2 w0 = f * (-.5 + f * (1. - .5 * f)), w1 = 1. + f * f * (-2.5 + 1.5 * f), w2 = f * (.5 + f * (2. - 1.5 * f)), w3 = f * f * (-.5 + .5 * f), w12 = w1 + w2;
  vec2 a = (c - 1.) * uTexel, b = (c + w2 / w12) * uTexel, d = (c + 2.) * uTexel;
  float ws = w12.x * w0.y + w0.x * w12.y + w12.x * w12.y + w3.x * w12.y + w12.x * w3.y;
  vec4 r = texture2D(uMap, vec2(b.x, a.y)) * w12.x * w0.y + texture2D(uMap, vec2(a.x, b.y)) * w0.x * w12.y + texture2D(uMap, b) * w12.x * w12.y + texture2D(uMap, vec2(d.x, b.y)) * w3.x * w12.y + texture2D(uMap, vec2(b.x, d.y)) * w12.x * w3.y;
  return max(r / ws, vec4(0.));
}
void main(){
  vec4 c = sharp(vUv);
  ivec2 sz = textureSize(uRay, 0);
  vec2 sp = vUv * vec2(sz) - .5; ivec2 i = ivec2(floor(sp)); vec2 f = sp - floor(sp);
  vec4 r[4];
  for(int k = 0; k < 4; k++) r[k] = texelFetch(uRay, clamp(i + ivec2(k & 1, k >> 1), ivec2(0), sz - 1), 0);
  vec4 w = vec4((1. - f.x) * (1. - f.y), f.x * (1. - f.y), (1. - f.x) * f.y, f.x * f.y);
  vec3 d[4]; vec3 sd = vec3(0.);
  for(int k = 0; k < 4; k++){ d[k] = deoct(r[k].xy); sd += d[k] * w[k]; }
  // donde la luz da vueltas, los vecinos apuntan a cualquier lado: ahí no se mezclan
  float spread = max(max(distance(d[0], d[1]), distance(d[0], d[2])), distance(d[0], d[3]));
  vec3 s;
  vec3 near = d[(f.x > .5 ? 1 : 0) + (f.y > .5 ? 2 : 0)];
  if(spread > .5) sd = near;
  s = skyTex(uSky, sd) * uSkyI + vec3(.0022, .0027, .0045);
  if(spread < .12){
    // estrellas lejanas, también deformadas
    vec3 g = normalize(sd) * 190., id = floor(g), rnd = hash33(id);
    float aa = min(fwidth(g.x) + fwidth(g.y) + fwidth(g.z), .5) * .3;
    float st = smoothstep(.22 + aa, 0., length(fract(g) - .5 - (rnd - .5) * .5)) * step(.9915, rnd.x);
    s += st * mix(vec3(.7, .82, 1.), vec3(1., .8, .6), rnd.y) * (.35 + rnd.z * rnd.z * 2.4);
  }
  float ta = 0.;
  if(uTextI > .001){
    vec2 t = r[0].zw * w.x + r[1].zw * w.y + r[2].zw * w.z + r[3].zw * w.w;
    vec2 lo = min(min(r[0].zw, r[1].zw), min(r[2].zw, r[3].zw)), hi = max(max(r[0].zw, r[1].zw), max(r[2].zw, r[3].zw));
    float jump = max(hi.x - lo.x, (hi.y - lo.y) * .35);
    if(t.x > 0. && t.x < 1. && t.y > 0. && t.y < 1. && lo.x > -4.){
      // el borde se suaviza según cuánto abarca este píxel del título
      vec2 px = max((hi - lo) * uScale, vec2(1e-5));
      ta = textureGrad(uText, t, vec2(px.x, 0.), vec2(0., px.y)).r * smoothstep(.16, .05, jump) * uTextI;
    }
  }
  oCol = vec4(c.rgb + c.a * mix(s, vec3(1.05, 1., .925), ta), uA);
}`

/** Título en una textura: lo deforma la gravedad. */
function drawTitle(text: string, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!
  canvas.width = 2048
  canvas.height = 512
  const font = (px: number) => `800 ${px}px "Bricolage Grotesque Variable", "Helvetica Neue", sans-serif`
  let px = 420
  ctx.font = font(px)
  ctx.letterSpacing = '-0.05em'
  const w = ctx.measureText(text).width
  px = Math.min(420, (px * 1960) / w)
  ctx.clearRect(0, 0, 2048, 512)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, 2048, 512)
  ctx.font = font(px)
  ctx.letterSpacing = `${-px * 0.05}px`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  ctx.fillText(text, 1024, 262)
}

const m4 = new THREE.Matrix4(), m3 = new THREE.Matrix3()

export default function BlackHole({ q, title }: { q: Quality; title: string }) {
  const { gl, camera, size, viewport } = useThree()
  const mesh = useRef<THREE.Mesh>(null)

  const p = useMemo(() => {
    const rt = new THREE.WebGLRenderTarget(4, 4, { count: 2, type: THREE.HalfFloatType, depthBuffer: false, generateMipmaps: false })
    const ray = rt.textures[1]
    ray.minFilter = ray.magFilter = THREE.NearestFilter
    if (gl.extensions.has('EXT_color_buffer_float')) ray.type = THREE.FloatType
    const canvas = document.createElement('canvas')
    const text = new THREE.CanvasTexture(canvas)
    text.generateMipmaps = true
    text.minFilter = THREE.LinearMipmapLinearFilter
    text.anisotropy = 8
    const mat = new THREE.ShaderMaterial({
      defines: { STEPS: q.holeSteps }, glslVersion: THREE.GLSL3,
      vertexShader: fsVertex, fragmentShader: fragment, depthTest: false, depthWrite: false, blending: THREE.NoBlending,
      uniforms: {
        uInvProj: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() }, uSkyInv: { value: new THREE.Matrix3() }, uCam: { value: new THREE.Vector3() },
        uTime: U.time, uDisk: { value: 1 }, uTextPos: { value: new THREE.Vector3(0, 2.6, -10) }, uTextSize: { value: new THREE.Vector2(38, 9.5) },
      },
    })
    const out = new THREE.ShaderMaterial({
      vertexShader: fsVertex, fragmentShader: show, glslVersion: THREE.GLSL3,
      uniforms: {
        uMap: { value: rt.textures[0] }, uRay: { value: ray }, uText: { value: text }, uTexel: { value: new THREE.Vector2(1, 1) }, uScale: { value: 1 }, uA: { value: 1 }, uSkyI: { value: 0 }, uTextI: { value: 0 },
        uSky: { value: tex(q.bigTex ? 'milkyway-4k.webp' : 'milkyway-2k.webp', { mip: false, aniso: 1 }) },
      },
      transparent: true, depthTest: false, depthWrite: false,
    })
    const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), quad = new THREE.Mesh(tri, mat)
    quad.frustumCulled = false
    scene.add(quad)
    return { rt, canvas, text, mat, out, scene, cam, warm: 0, ready: false }
  }, [gl, q.holeSteps, q.bigTex])

  useLayoutEffect(() => {
    // compilar no alcanza: en Windows el primer dibujo en este destino doble recompila el shader (~1 s con la GPU parada).
    // Se hace antes de mostrar el inicio, no cuando ya se está mirando.
    beforeStart(compilePass(gl, p.scene, p.cam, p.rt).then(() => {
      const keep = gl.getRenderTarget()
      gl.setRenderTarget(p.rt)
      gl.render(p.scene, p.cam)
      gl.setRenderTarget(keep)
      return gpuDone(gl)
    }).then(() => { p.ready = true }))
    return () => { p.rt.dispose(); p.mat.dispose(); p.out.dispose(); p.text.dispose() }
  }, [p, gl])

  useEffect(() => {
    // nunca menos de lo necesario para que los bordes salgan limpios
    const px = size.width * size.height * viewport.dpr * viewport.dpr
    const k = Math.min(1, Math.max(q.holeScale, Math.sqrt(q.holeMin / px)))
    const w = Math.max(2, Math.floor(size.width * viewport.dpr * k)), h = Math.max(2, Math.floor(size.height * viewport.dpr * k))
    p.rt.setSize(w, h)
    p.out.uniforms.uTexel.value.set(1 / w, 1 / h)
    p.out.uniforms.uScale.value = k
  }, [p, size, viewport.dpr, q.holeScale, q.holeMin])

  useEffect(() => {
    let live = true
    const draw = () => { if (live) { drawTitle(title, p.canvas); p.text.needsUpdate = true } }
    draw()
    document.fonts?.load('800 100px "Bricolage Grotesque Variable"').then(draw).catch(() => {})
    return () => { live = false }
  }, [title, p])

  useFrame(() => {
    const me = mesh.current
    if (!me) return
    const t = J.t
    const a = win(t, 2.42, 2.52, 4.46, 4.56)
    me.visible = a > 0.002 && p.ready
    // una pasada en frío apenas compila: deja listos el destino y el título antes de que hagan falta
    if (!p.ready || (!me.visible && p.warm > 1)) return
    p.warm++
    const u = p.mat.uniforms, cam = camera as THREE.PerspectiveCamera
    u.uInvProj.value.copy(cam.projectionMatrixInverse)
    u.uCamWorld.value.copy(cam.matrixWorld)
    u.uCam.value.copy(cam.position).sub(C.hole)
    u.uSkyInv.value.copy(m3.setFromMatrix4(m4.makeRotationFromQuaternion(skyQuaternion))).transpose()
    const o = p.out.uniforms
    o.uSkyI.value = pose.sky * 1.15
    // el título aparece al llegar y lo traga el horizonte
    o.uTextI.value = smooth(2.62, 2.95, t) * (1 - smooth(3.72, 3.98, t)) * (J.explore ? 0.25 : 1)
    const n = J.narrow
    u.uTextPos.value.set(n ? -0.5 : 0, n ? 7.2 : 3.1, n ? -12 : -10)
    u.uTextSize.value.set(n ? 15.4 : 36, n ? 3.85 : 9)
    o.uA.value = a
    const keep = gl.getRenderTarget(), auto = gl.autoClear
    gl.autoClear = true
    gl.setRenderTarget(p.rt)
    gl.render(p.scene, p.cam)
    gl.setRenderTarget(keep)
    gl.autoClear = auto
  })

  return <mesh ref={mesh} geometry={tri} material={p.out} frustumCulled={false} renderOrder={-16} />
}
