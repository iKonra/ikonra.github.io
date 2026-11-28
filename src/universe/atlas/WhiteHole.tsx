import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import { Stop, skyHead, sphere, useShell, type StopState } from './common'

// Agujero blanco: un agujero negro con el tiempo al revés. Nada entra; todo sale.
// El disco no cae en espiral sino que se abre hacia afuera, dos chorros disparan nudos de materia por los polos
// y cada tanto una onda de choque esférica se aleja. Por fuera, la gravedad curva la luz igual que un agujero negro.

const R = 19, RS = 0.7

const fragment = /* glsl */ `
uniform float uFade, uTime; uniform mat3 uTilt; uniform vec3 uAxis;
varying vec3 vW, vC;
${skyHead}
void main(){
  vec3 rd = normalize(vW - cameraPosition), o = cameraPosition - vC;
  float reach = min(sqrt(2. * ${RS} * length(o)) * 2.4, ${R.toFixed(1)} * .96);
  float b; vec3 d = bend(o, rd, ${RS}, reach, b);
  float s = -dot(o, rd), Rc = ${(2.6 * RS).toFixed(3)};
  vec3 col = atlasSkyAt(normalize(d)) * smoothstep(Rc * .8, Rc * 1.4, b);
  // ---- disco que expulsa
  vec3 lo = uTilt * o, ld = uTilt * rd;
  float tp = -lo.y / ld.y;
  if(tp > 0.){
    vec3 p = lo + ld * tp; float r = length(p.xz);
    if(r > Rc && r < 17.){
      float phi = atan(p.z, p.x), sp = phi + log(r) * 1.9;
      float n = fbm(vec3(cos(sp) * 2.3, r * .5 - uTime * .85, sin(sp) * 2.3), 4);
      float streak = pow(.5 + .5 * sin(sp * 6. + n * 5. - uTime * .3), 2.);
      float dens = smoothstep(-.3, .45, n) * (.35 + .65 * streak) * smoothstep(Rc, Rc * 2.4, r) * smoothstep(17., 6., r);
      float heat = pow(Rc * 2.6 / r, 1.25);
      vec3 dc = mix(vec3(.85, .28, .75), vec3(.42, .3, 1.), smoothstep(.12, .4, heat));
      dc = mix(dc, vec3(.62, .82, 1.), smoothstep(.4, 1., heat));
      dc = mix(dc, vec3(1.), smoothstep(1., 2., heat));
      float dop = 1. + .45 * dot(normalize(vec3(-p.z, 0., p.x)), -ld);
      float a = clamp(dens * .85, 0., 1.) * (tp < s || b > Rc ? 1. : 0.);
      col = col * (1. - a) + dc * dens * (.4 + heat * 2.2) * dop * dop * (tp < s || b > Rc ? 1. : 0.);
    }
  }
  // ---- chorros por los polos: nudos que salen disparados
  float bb = dot(rd, uAxis), dd = dot(rd, o), ee = dot(uAxis, o), den = max(1. - bb * bb, 1e-4);
  float tj = (bb * ee - dd) / den, u = (ee - bb * dd) / den, jd = length(o + rd * tj - uAxis * u);
  float jet = exp(-pow(jd / (.1 + .045 * abs(u)), 2.)) * exp(-abs(u) / 9.) * step(0., tj) * smoothstep(Rc, Rc * 2., abs(u));
  float knots = .35 + .65 * pow(.5 + .5 * sin(abs(u) * 1.25 - uTime * 3.2), 5.);
  col += vec3(.58, .68, 1.) * jet * knots * 2.2;
  // ---- ondas de choque que se alejan
  for(int k = 0; k < 3; k++){
    float f = fract(uTime * .055 + float(k) / 3.), Rk = Rc + f * 16.;
    float limb = smoothstep(Rk, Rk - .35, b) * exp(-(Rk - b) * .7) * step(0., s);
    col += vec3(.55, .62, 1.) * limb * (1. - f) * (1. - f) * .55;
  }
  // ---- el núcleo: luz que solo puede salir
  col += vec3(.9, .95, 1.) * (exp(-b * b / (Rc * Rc * .7)) * 9. + exp(-b / (Rc * 1.3)) * 1.1) * step(0., s);
  float cover = smoothstep(reach, reach * .7, b);
  gl_FragColor = vec4(col * cover * uFade, cover * uFade);
}`

const tilt = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.38, 0, -0.22))

export default function WhiteHole({ i }: { i: number }) {
  const state = useMemo<StopState>(() => ({ k: 0, d: 9 }), [])
  const toLocal = useMemo(() => new THREE.Matrix3().setFromMatrix4(tilt).transpose(), [])
  const axis = useMemo(() => new THREE.Vector3(0, 1, 0).applyMatrix4(tilt), [])
  const mat = useShell(fragment, { uTilt: { value: toLocal }, uAxis: { value: axis } })
  useFrame(() => { mat.uniforms.uFade.value = state.k })
  return (
    <Stop i={i} state={state}>
      <mesh geometry={sphere()} material={mat} scale={R} renderOrder={6} />
    </Stop>
  )
}
