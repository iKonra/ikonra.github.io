import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { tex } from './assets'
import { fsVertex, hash, noise3 } from './glsl'
import { C, J, pose, smooth, win } from './journey'
import { tri } from './Pipeline'
import { U } from './shared'
import { skyLookup, skyQuaternion } from './Sky'
import type { Quality } from './quality'
import { compilePass, started } from './warm'

// Sagitario A*: cada píxel sigue la trayectoria de un rayo de luz en la métrica de Schwarzschild (radio = 1).
// El cielo, el disco y el título "Proyectos" (que flota detrás) se ven deformados por la gravedad de verdad, sin trucos.

const fragment = /* glsl */ `
varying vec2 vUv;
uniform mat4 uInvProj, uCamWorld; uniform mat3 uSkyInv;
uniform vec3 uCam; uniform sampler2D uSky, uText; uniform float uTime, uSkyI, uTextI, uDisk, uAspect;
uniform vec3 uTextPos; uniform vec2 uTextSize;
${hash}
${noise3}
${skyLookup}
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
  float glow = 0., photon = 0.;
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
      if(uTextI > .001){
        float za = p.z - uTextPos.z, zb = np.z - uTextPos.z;
        if(za * zb < 0.){
          vec3 x = mix(p, np, za / (za - zb));
          vec2 tuv = (x.xy - uTextPos.xy) / uTextSize + .5;
          if(tuv.x > 0. && tuv.x < 1. && tuv.y > 0. && tuv.y < 1.){
            float ta = texture2D(uText, tuv).r * uTextI;
            col += T * vec3(1., .95, .88) * ta * 1.05; T *= 1. - ta;
          }
        }
      }
      p = np; v = nv;
      if(T < .01) break;
      if(r > R && dot(p, v) > 0.) break;
    }
  }
  if(!captured && T > .01){
    v = normalize(v);
    if(!go && uTextI > .001){
      float s = (uTextPos.z - p.z) / v.z;
      if(s > 0.){
        vec3 x = p + v * s; vec2 tuv = (x.xy - uTextPos.xy) / uTextSize + .5;
        if(tuv.x > 0. && tuv.x < 1. && tuv.y > 0. && tuv.y < 1.){ float ta = texture2D(uText, tuv).r * uTextI; col += T * vec3(1., .95, .88) * ta * 1.05; T *= 1. - ta; }
      }
    }
    vec3 sd = uSkyInv * v;
    vec3 s = skyTex(uSky, sd) * uSkyI + vec3(.0022, .0027, .0045);
    // estrellas lejanas, también deformadas
    vec3 g = sd * 190.; vec3 id = floor(g); vec3 rnd = hash33(id);
    float st = smoothstep(.24, 0., length(fract(g) - .5 - (rnd - .5) * .5)) * step(.9915, rnd.x);
    s += st * mix(vec3(.7, .82, 1.), vec3(1., .8, .6), rnd.y) * (.35 + rnd.z * rnd.z * 2.4);
    col += T * s;
  }
  col += vec3(1., .55, .22) * glow * uDisk + vec3(1., .72, .45) * smoothstep(1., 6., photon) * (captured ? .25 : 1.6) * T;
  gl_FragColor = vec4(col, 1.);
}`

const show = /* glsl */ `
uniform sampler2D uMap; uniform float uA; varying vec2 vUv;
void main(){ gl_FragColor = vec4(texture2D(uMap, vUv).rgb, uA); }`

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
    const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthBuffer: false, generateMipmaps: false })
    const canvas = document.createElement('canvas')
    const text = new THREE.CanvasTexture(canvas)
    text.generateMipmaps = true
    text.minFilter = THREE.LinearMipmapLinearFilter
    text.anisotropy = 8
    const mat = new THREE.ShaderMaterial({
      defines: { STEPS: q.holeSteps },
      vertexShader: fsVertex, fragmentShader: fragment, depthTest: false, depthWrite: false, blending: THREE.NoBlending,
      uniforms: {
        uInvProj: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() }, uSkyInv: { value: new THREE.Matrix3() }, uCam: { value: new THREE.Vector3() },
        uSky: { value: tex(q.bigTex ? 'milkyway-4k.webp' : 'milkyway-2k.webp', { mip: false, aniso: 1 }) }, uText: { value: text }, uTime: U.time,
        uSkyI: { value: 0 }, uTextI: { value: 0 }, uDisk: { value: 1 }, uAspect: { value: 1 }, uTextPos: { value: new THREE.Vector3(0, 2.6, -10) }, uTextSize: { value: new THREE.Vector2(38, 9.5) },
      },
    })
    const out = new THREE.ShaderMaterial({ vertexShader: fsVertex, fragmentShader: show, uniforms: { uMap: { value: rt.texture }, uA: { value: 1 } }, transparent: true, depthTest: false, depthWrite: false })
    const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), quad = new THREE.Mesh(tri, mat)
    quad.frustumCulled = false
    scene.add(quad)
    return { rt, canvas, text, mat, out, scene, cam, warm: 0, ready: false }
  }, [q.holeSteps, q.bigTex])

  useEffect(() => {
    void started.then(() => compilePass(gl, p.scene, p.cam, p.rt)).then(() => { p.ready = true })
    return () => { p.rt.dispose(); p.mat.dispose(); p.out.dispose(); p.text.dispose() }
  }, [p, gl])

  useEffect(() => {
    p.rt.setSize(Math.max(2, Math.floor(size.width * viewport.dpr * q.holeScale)), Math.max(2, Math.floor(size.height * viewport.dpr * q.holeScale)))
  }, [p, size, viewport.dpr, q.holeScale])

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
    u.uSkyI.value = pose.sky * 1.15
    // el título aparece al llegar y lo traga el horizonte
    u.uTextI.value = smooth(2.62, 2.95, t) * (1 - smooth(3.72, 3.98, t)) * (J.explore ? 0.25 : 1)
    const n = J.narrow
    u.uTextPos.value.set(n ? -0.5 : 0, n ? 7.2 : 3.1, n ? -12 : -10)
    u.uTextSize.value.set(n ? 15.4 : 36, n ? 3.85 : 9)
    p.out.uniforms.uA.value = a
    const keep = gl.getRenderTarget(), auto = gl.autoClear
    gl.autoClear = true
    gl.setRenderTarget(p.rt)
    gl.render(p.scene, p.cam)
    gl.setRenderTarget(keep)
    gl.autoClear = auto
  })

  return <mesh ref={mesh} geometry={tri} material={p.out} frustumCulled={false} renderOrder={-16} />
}
