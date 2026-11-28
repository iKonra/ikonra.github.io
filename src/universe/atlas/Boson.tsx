import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import type { Quality } from '../quality'
import { Stop, skyHead, sphere, useShell, type StopState } from './common'

// Estrella de bosones: sin superficie y transparente, una sola onda cuántica del tamaño de un astro.
// Se dibuja la densidad |ψ|² de esa onda (capas = nodos de la parte radial, lóbulos = la parte angular)
// y el color es su fase, que gira en el tiempo aunque la densidad casi no cambie.

const R = 5.2, RV = 4.1

const fragment = /* glsl */ `
uniform float uFade, uTime;
varying vec3 vW, vC;
${skyHead}
vec3 phaseColor(float x){
  // turquesa → violeta → magenta → dorado
  return .52 + .48 * cos(6.2832 * (x + vec3(.47, .67, .87)));
}
void main(){
  vec3 rd = normalize(vW - cameraPosition), o = cameraPosition - vC;
  float b; vec3 d = bend(o, rd, .1, ${R.toFixed(1)} * .92, b);
  vec3 col = atlasSkyAt(normalize(d));
  float B = dot(o, rd), h = B * B - dot(o, o) + ${(RV * RV).toFixed(2)};
  vec3 em = vec3(0.);
  if(h > 0.){
    float sq = sqrt(h), t0 = max(-B - sq, 0.), t1 = -B + sq;
    if(t1 > 0.){
      float dt = (t1 - t0) / float(STEPS), j = hash21(gl_FragCoord.xy + fract(uTime) * 17.);
      float cr = cos(uTime * .11), sr = sin(uTime * .11), w = uTime * 1.25, cw = cos(w), sw = sin(w);
      for(int i = 0; i < STEPS; i++){
        vec3 p = o + rd * (t0 + (float(i) + j) * dt);
        p.xz = mat2(cr, -sr, sr, cr) * p.xz;
        p.xy = mat2(.92, -.39, .39, .92) * p.xy;
        float r = length(p) + 1e-4, ct = p.y / r, st2 = 1. - ct * ct, phi = atan(p.z, p.x);
        float kr = 2.95 * r;
        float radial = sin(kr) / kr * exp(-r * r / 7.5);
        // un modo con simetría de eje y otro que rota: la superposición dibuja anillos y lóbulos
        vec2 m2 = vec2(cos(2. * phi - uTime * .7), sin(2. * phi - uTime * .7));
        vec2 psi = radial * (vec2(3. * ct * ct - 1., 0.) * .5 + st2 * m2 * .95);
        psi = vec2(psi.x * cw - psi.y * sw, psi.x * sw + psi.y * cw);
        float rho = dot(psi, psi);
        em += phaseColor(atan(psi.y, psi.x) / 6.2832) * rho * dt;
      }
    }
  }
  col += em * 3.4;
  float cover = smoothstep(${R.toFixed(1)} * .95, ${R.toFixed(1)} * .7, b);
  gl_FragColor = vec4(col * cover * uFade, cover * uFade);
}`

export default function Boson({ i, q }: { i: number; q: Quality }) {
  const state = useMemo<StopState>(() => ({ k: 0, d: 9 }), [])
  const mat = useShell(fragment, {}, { STEPS: q.detail >= 5 ? 44 : 26 })
  useFrame(() => { mat.uniforms.uFade.value = state.k })
  return (
    <Stop i={i} state={state}>
      <mesh geometry={sphere()} material={mat} scale={R} renderOrder={6} />
    </Stop>
  )
}
