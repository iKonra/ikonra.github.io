import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import type { Quality } from '../quality'
import { Stop, skyHead, sphere, useShell, worley, type StopState } from './common'

// Cuasiestrella: en el universo joven, una envoltura de gas más grande que la órbita de Neptuno alrededor de un agujero negro.
// Por fuera es "fría" (unos 4000 K): roja y anaranjada, con celdas de convección gigantes que hierven, y protuberancias en el borde.

const RAD = 30, R = 37

const fragment = /* glsl */ `
uniform float uFade, uTime;
varying vec3 vW, vC;
${skyHead}
${worley}
vec3 ramp(float x){
  vec3 c = mix(vec3(.16, .012, .004), vec3(.95, .2, .04), smoothstep(.0, .45, x));
  c = mix(c, vec3(1., .55, .16), smoothstep(.4, .75, x));
  return mix(c, vec3(1., .86, .6), smoothstep(.75, 1.1, x));
}
void main(){
  vec3 rd = normalize(vW - cameraPosition), o = cameraPosition - vC;
  float B = dot(o, rd), h = B * B - dot(o, o) + ${(RAD * RAD).toFixed(1)};
  vec3 cp = o + rd * max(-B, 0.);
  float b = length(cp) / ${RAD.toFixed(1)};
  vec3 col = vec3(0.); float a = 0.;
  if(h > 0. && -B - sqrt(h) > 0.){
    vec3 n = (o + rd * (-B - sqrt(h))) / ${RAD.toFixed(1)};
    float mu = max(dot(n, -rd), 0.);
    vec3 q = n; float cr = cos(uTime * .012), sr = sin(uTime * .012); q.xz = mat2(cr, -sr, sr, cr) * q.xz;
    // celdas de convección enormes: el centro sube caliente, los bordes bajan fríos
    vec2 v = worley(q * 6.5 + vec3(0., uTime * .015, 0.));
    float lanes = smoothstep(.02, .32, v.y - v.x);
    float boil = fbm(q * 15. + vec3(uTime * .03), DETAIL);
    float big = fbm(q * 2.6 + vec3(0., 0., uTime * .008), 3);
    float T = .32 + lanes * .34 + boil * .3 + big * .42 - v.x * .18;
    float limb = .22 + .78 * pow(mu, .55);
    col = ramp(T * (.55 + .45 * limb)) * (1.2 + 3.2 * T * T) * limb;
    // manchas oscuras donde el gas se enfría
    col *= 1. - smoothstep(.3, .62, big * -1. + .25) * .55;
    a = 1.;
  } else {
    // corona y protuberancias que asoman por el borde
    float x = max(b - 1., 0.);
    vec3 dir = normalize(cp);
    float pr = fbm(dir * 3.5 + vec3(0., 0., uTime * .02), 4);
    float arcs = smoothstep(.12, .55, pr + .25 * vnoise(dir * 11. + uTime * .05)) * exp(-x * 16.);
    col = vec3(1., .3, .07) * (exp(-x * 11.) * .8 + exp(-x * 3.2) * .14 + arcs * 1.8);
  }
  gl_FragColor = vec4(col * uFade, a * uFade);
}`

export default function QuasiStar({ i, q }: { i: number; q: Quality }) {
  const state = useMemo<StopState>(() => ({ k: 0, d: 9 }), [])
  const mat = useShell(fragment, {}, { DETAIL: q.detail >= 5 ? 4 : 3 })
  useFrame(() => { mat.uniforms.uFade.value = state.k })
  return (
    <Stop i={i} state={state}>
      <mesh geometry={sphere(32, 20)} material={mat} scale={R} renderOrder={5} />
    </Stop>
  )
}
