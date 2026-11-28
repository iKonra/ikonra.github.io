import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import { U } from '../shared'
import type { Quality } from '../quality'
import { Stop, skyHead, sphere, useShell, type StopState } from './common'

// Estrella de quarks en el corazón de un resto de supernova (como la Nebulosa del Cangrejo):
// filamentos rojos y verdes en la cáscara, el resplandor violeta del sincrotrón adentro, un anillo y un chorro del viento
// de la estrella, y sus dos haces de faro que giran. En el centro, tres destellos rojo, verde y azul que juntos dan blanco:
// la "carga de color" de los quarks.

const R = 24

const fragment = /* glsl */ `
uniform float uFade, uTime; uniform mat3 uSpin; uniform vec3 uMag, uAxis;
varying vec3 vW, vC;
${skyHead}
/** Distancia entre el rayo y una recta por el centro; u = posición sobre la recta. */
float axisDist(vec3 o, vec3 rd, vec3 ax, out float u, out float t){
  float bb = dot(rd, ax), dd = dot(rd, o), ee = dot(ax, o), den = max(1. - bb * bb, 1e-4);
  t = (bb * ee - dd) / den; u = (ee - bb * dd) / den;
  return length(o + rd * t - ax * u);
}
void main(){
  vec3 rd = normalize(vW - cameraPosition), o = cameraPosition - vC;
  float b; vec3 d = bend(o, rd, .05, 2.5, b);
  vec3 col = atlasSkyAt(normalize(d));
  // ---- la nebulosa: un elipsoide de filamentos
  vec3 S = vec3(1. / 1.35, 1., 1. / 1.12) / 16.;
  vec3 os = o * S, ds = rd * S;
  float A = dot(ds, ds), Bq = dot(os, ds), h = Bq * Bq - A * (dot(os, os) - 1.);
  vec3 em = vec3(0.); float tr = 1.;
  if(h > 0.){
    float sq = sqrt(h), t0 = max((-Bq - sq) / A, 0.), t1 = (-Bq + sq) / A;
    if(t1 > 0.){
      float dt = (t1 - t0) / float(STEPS), j = hash21(gl_FragCoord.xy + fract(uTime * 3.) * 31.);
      for(int i = 0; i < STEPS; i++){
        vec3 p = o + rd * (t0 + (float(i) + j) * dt), q = p * S;
        float r = length(q);
        vec3 w = q * 2.6 + vec3(vnoise(q * 1.7), vnoise(q * 1.7 + 5.2), vnoise(q * 1.7 + 9.4)) * .9;
        float n1 = 1. - abs(vnoise(w * 1.9)), n2 = 1. - abs(vnoise(w * 4.3 + 3.));
        float fil = pow(n1, 20.) * 1.5 + pow(n2, 26.) * 1.;
        float shell = smoothstep(.36, .8, r) * smoothstep(1., .85, r);
        float fd = fil * (shell + .07 * smoothstep(.9, .3, r));
        // filamentos: verdes y amarillos hacia adentro, rojo y naranja en la cáscara
        vec3 fc = mix(vec3(.55, 1., .35), vec3(1., .16, .05), smoothstep(.35, .75, r + n2 * .2));
        fc = mix(fc, vec3(1., .55, .16), smoothstep(.75, 1., n1) * .5);
        // el sincrotrón: velo azulado y fibroso, más blanco cerca de la estrella
        float wisp = pow(1. - abs(vnoise(w * 1.2 + vec3(0., uTime * .015, 0.))), 4.);
        float syn = exp(-r * r * 3.2) * (.25 + .75 * wisp);
        vec3 sc = mix(vec3(.24, .36, 1.), vec3(.72, .78, 1.), exp(-r * r * 14.));
        em += (fc * fd * 4.6 + sc * syn * .75) * dt * tr * .028;
        tr *= exp(-fd * dt * .05);
      }
    }
  }
  col = col * tr + em;
  // ---- el viento de la estrella: un anillo en su ecuador y un chorro por el eje
  vec3 lo = uSpin * o, ld = uSpin * rd;
  float tp = -lo.y / ld.y;
  if(tp > 0.){
    vec3 p = lo + ld * tp; float rr = length(p.xz), ang = atan(p.z, p.x);
    float knots = .55 + .45 * pow(.5 + .5 * sin(ang * 9. + uTime * .8), 3.);
    col += vec3(.75, .86, 1.) * (exp(-pow((rr - 2.4) / .22, 2.)) * 1.3 * knots + exp(-pow((rr - 3.6) / .5, 2.)) * .25);
  }
  float u, t;
  float jd = axisDist(o, rd, uAxis, u, t);
  float jet = exp(-pow(jd / (.09 + .03 * abs(u)), 2.)) * exp(-abs(u) / 4.5) * step(0., t) * smoothstep(.3, 1., abs(u));
  col += vec3(.6, .72, 1.) * jet * (.8 + .4 * sin(abs(u) * 4. - uTime * 6.));
  // ---- los haces de faro: siguen el eje magnético, que gira alrededor del de rotación
  float bd = axisDist(o, rd, uMag, u, t);
  float beam = exp(-pow(bd / (.04 + .07 * abs(u)), 2.)) * exp(-abs(u) / 7.) * step(0., t) * smoothstep(16., 10., abs(u));
  col += vec3(.62, .7, 1.) * beam * 1.6;
  // ---- la estrella: cuando un haz apunta a la cámara, destella
  vec3 to = normalize(o);
  float flash = pow(max(abs(dot(uMag, to)), 0.), 60.) * 6.;
  col += vec3(.85, .92, 1.) * (exp(-b * b / .004) * 18. + exp(-b / .22) * 1.4) * (1. + flash);
  // carga de color: rojo, verde y azul que giran y se suman en blanco
  vec3 rgb[3]; rgb[0] = vec3(1., .12, .1); rgb[1] = vec3(.15, 1., .2); rgb[2] = vec3(.15, .3, 1.);
  for(int k = 0; k < 3; k++){
    float a = uTime * 2.2 + float(k) * 2.094;
    vec3 c = vec3(cos(a), sin(a * .5) * .4, sin(a)) * .16;
    vec3 oc = o - c; float bk = length(oc - rd * dot(oc, rd));
    col += rgb[k] * exp(-bk * bk / .0035) * 4.;
  }
  float cover = smoothstep(${R.toFixed(1)} * .97, ${R.toFixed(1)} * .86, b);
  gl_FragColor = vec4(col * cover * uFade, cover * uFade);
}`

const tilt = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.42, 0.3, -0.25))

export default function QuarkStar({ i, q }: { i: number; q: Quality }) {
  const state = useMemo<StopState>(() => ({ k: 0, d: 9 }), [])
  const spin = useMemo(() => new THREE.Matrix3().setFromMatrix4(tilt).transpose(), [])
  const mag = useMemo(() => new THREE.Vector3(), [])
  const axis = useMemo(() => new THREE.Vector3(0, 1, 0).applyMatrix4(tilt), [])
  const mat = useShell(fragment, { uSpin: { value: spin }, uMag: { value: mag }, uAxis: { value: axis } }, { STEPS: q.detail >= 5 ? 48 : 28 })
  const ref = useMemo(() => new THREE.Vector3(1, 0, 0).applyMatrix4(tilt), [])
  useFrame(() => {
    mat.uniforms.uFade.value = state.k
    // eje magnético inclinado 40° respecto del de rotación; una vuelta cada 2,6 s
    const a = U.time.value * (Math.PI * 2 / 2.6)
    mag.copy(ref).applyAxisAngle(axis, a).multiplyScalar(Math.sin(0.7)).addScaledVector(axis, Math.cos(0.7)).normalize()
  })
  return (
    <Stop i={i} state={state}>
      <mesh geometry={sphere(32, 20)} material={mat} scale={R} renderOrder={6} />
    </Stop>
  )
}
