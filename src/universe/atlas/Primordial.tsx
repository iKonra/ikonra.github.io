import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import { U } from '../shared'
import { Stop, skyHead, sphere, useShell, type StopState } from './common'

// Agujeros negros primordiales: un enjambre de agujeros chicos nacidos en el primer segundo del universo.
// Cada uno curva la luz de la nebulosa de atrás (anillos de Einstein que se cruzan); el más chico está tan caliente
// por la radiación de Hawking que brilla, se encoge y termina en un destello.

const R = 15

const fragment = /* glsl */ `
uniform vec4 uL[6]; uniform float uFade, uTime, uBoom, uHeat;
varying vec3 vW, vC;
${skyHead}
void main(){
  vec3 rd = normalize(vW - cameraPosition), ro = cameraPosition - vC;
  vec3 d = rd; float shadow = 0., ring = 0., cover = 0., hb = 1e3, hs = 0.;
  for(int i = 0; i < 6; i++){
    vec3 o = ro - uL[i].xyz; float rs = uL[i].w;
    float s = max(-dot(o, rd), 0.), ok = step(1e-4, s);
    vec3 c = o + rd * s; float b = length(c);
    float reach = min(sqrt(2. * rs * max(length(o), 1.)) * 2.8, ${R.toFixed(1)} * .97 - length(uL[i].xyz));
    float a = min(2. * rs / max(b, 1e-4), 1.3) * smoothstep(reach, reach * .4, b) * ok;
    d -= c / max(b, 1e-4) * a;
    shadow = max(shadow, smoothstep(2.62 * rs, 2.45 * rs, b) * ok * step(.001, rs));
    ring += exp(-pow((b - 2.68 * rs) / (.06 * rs + .002), 2.)) * ok * step(.001, rs);
    cover = max(cover, smoothstep(reach, reach * .62, b));
    if(i == 5){ hb = b; hs = ok; }
  }
  vec3 col = atlasSkyAt(normalize(d)) * (1. - shadow);
  col += vec3(1., .82, .64) * ring * .55;
  // el más chico: cuanto menos masa, más caliente
  float rs5 = max(uL[5].w, .004);
  float flick = 1. + .3 * sin(uTime * 9.1) + .2 * sin(uTime * 15.7);
  col += vec3(.72, .84, 1.) * (exp(-hb * hb / (rs5 * rs5 * 40.)) * 3. + exp(-hb / (rs5 * 14.)) * .4) * uHeat * flick * hs;
  // el último instante: un fogonazo de rayos gamma y una onda que se aleja
  if(uBoom < 1.){
    float R = uBoom * 10., w = .2 + uBoom * .9, k = 1. - uBoom;
    col += vec3(.62, .78, 1.) * exp(-pow((hb - R) / w, 2.)) * k * k * 2.2 * hs;
    col += vec3(1.) * exp(-hb * hb / .05) * pow(k, 5.) * 30. * hs;
    cover = max(cover, smoothstep(R + w * 2., R - w * 2., hb) * k);
  }
  gl_FragColor = vec4(col * cover * uFade, cover * uFade);
}`

/** Órbitas del enjambre: radio, inclinación, nodo, fase, velocidad y radio de Schwarzschild. */
const orbits: [number, number, number, number, number, number][] = [
  [0.8, 0.2, 0, 0, 0.05, 0.46],
  [4.4, 0.5, 1.2, 2.1, 0.11, 0.25],
  [3.1, -0.4, 2.6, 4.2, -0.14, 0.17],
  [5.6, 0.9, 4.1, 1.1, 0.08, 0.11],
  [2.4, -0.9, 0.7, 5.3, 0.2, 0.065],
  [3.7, 0.3, 3.3, 0.4, -0.17, 0.035],
]
const CYCLE = 13

export default function Primordial({ i }: { i: number }) {
  const state = useMemo<StopState>(() => ({ k: 0, d: 9 }), [])
  const L = useMemo(() => orbits.map(() => new THREE.Vector4()), [])
  const mat = useShell(fragment, { uL: { value: L }, uBoom: { value: 1 }, uHeat: { value: 0 } })
  const v = useMemo(() => new THREE.Vector3(), [])
  const e = useMemo(() => new THREE.Euler(), [])

  useFrame(() => {
    const time = U.time.value, u = mat.uniforms
    u.uFade.value = state.k
    // cada ciclo, el más chico se calienta, se evapora y aparece otro en otro lugar
    const n = Math.floor(time / CYCLE), p = (time % CYCLE) / CYCLE
    orbits.forEach(([r, inc, node, ph, sp, rs], k) => {
      const a = ph + time * sp + (k === 5 ? n * 2.3 : 0)
      v.set(Math.cos(a) * r, 0, Math.sin(a) * r).applyEuler(e.set(inc, node + (k === 5 ? n * 1.7 : 0), 0))
      const size = k === 5 ? rs * (1 - Math.pow(Math.min(p / 0.86, 1), 3) * 0.7) * (p > 0.86 ? 0 : 1) : rs
      L[k].set(v.x, v.y, v.z, size)
    })
    u.uHeat.value = p > 0.86 ? 0 : 0.35 + Math.pow(p / 0.86, 4) * 2.4
    u.uBoom.value = p > 0.86 ? Math.min((p - 0.86) / 0.12, 1) : 1
  })

  return (
    <Stop i={i} state={state}>
      <mesh geometry={sphere()} material={mat} scale={R} renderOrder={6} />
    </Stop>
  )
}
