import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import { Stop, skyHead, sphere, useShell, type StopState } from './common'

// Gravastar: por fuera, la misma lente que un agujero negro (el cielo se curva igual y hay anillo de fotones).
// Donde un agujero negro tendría su sombra hay una cáscara finísima de materia ultradensa, y adentro, vacío con energía
// oscura que empuja hacia afuera. Interpretación artística: la cáscara como una película iridiscente y, a través de ella,
// el cielo invertido y corrido al azul.

const R = 15, RS = 0.85

const fragment = /* glsl */ `
uniform float uFade, uTime;
varying vec3 vW, vC;
${skyHead}
void main(){
  vec3 rd = normalize(vW - cameraPosition), o = cameraPosition - vC;
  float reach = min(sqrt(2. * ${RS} * length(o)) * 2.5, ${R.toFixed(1)} * .96);
  float b; vec3 d = bend(o, rd, ${RS}, reach, b);
  float s = -dot(o, rd), Rsh = ${(2.7 * RS).toFixed(3)};
  vec3 col;
  if(b < Rsh && s > 0.){
    float x = b / Rsh, mu = sqrt(1. - x * x);
    vec3 c = o + rd * s, cn = c / max(b, 1e-4);
    // adentro: la luz que cruza el vacío sale abierta hacia afuera (imagen invertida) y más azul
    vec3 din = normalize(rd + cn * (1.7 - x * .6));
    vec3 inner = atlasSkyAt(din) * vec3(.5, .78, 1.35) * .7;
    vec3 sp = o + rd * (s - Rsh * mu);
    float foam = fbm(sp * 1.6 + vec3(0., uTime * .18, uTime * .1), 4);
    inner += vec3(.2, .42, 1.) * pow(max(foam + .15, 0.), 2.) * .9 * mu;
    inner += vec3(.55, .3, 1.) * pow(max(fbm(sp * 4. - uTime * .25, 3), 0.), 3.) * .7 * mu;
    // la cáscara: película delgada, el color depende del espesor y del ángulo
    float th = 1.6 + 1.4 * vnoise(sp * 1.2 + vec3(0., uTime * .12, 0.)) + (1. - mu) * 1.8;
    vec3 film = .5 + .5 * cos(6.2832 * (th + vec3(0., .33, .67)));
    float fres = pow(1. - mu, 2.5);
    col = inner * (1. - fres * .55) + film * (fres * 1.5 + .06);
  } else col = atlasSkyAt(normalize(d));
  // anillo de fotones, apenas afuera de la cáscara
  col += vec3(1., .9, .74) * (exp(-pow((b - Rsh * 1.035) / (.025 * Rsh), 2.)) * .9 + exp(-pow((b - Rsh * 1.035) / (.12 * Rsh), 2.)) * .12);
  float cover = smoothstep(reach, reach * .7, b);
  gl_FragColor = vec4(col * cover * uFade, cover * uFade);
}`

export default function Gravastar({ i }: { i: number }) {
  const state = useMemo<StopState>(() => ({ k: 0, d: 9 }), [])
  const mat = useShell(fragment, {})
  useFrame(() => { mat.uniforms.uFade.value = state.k })
  return (
    <Stop i={i} state={state}>
      <mesh geometry={sphere()} material={mat} scale={R} renderOrder={6} />
    </Stop>
  )
}
