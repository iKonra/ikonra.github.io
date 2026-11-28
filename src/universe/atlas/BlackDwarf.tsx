import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import { U } from '../shared'
import { AS } from './Sky'
import { Stop, skyHead, sphere, worley, type StopState } from './common'

// Enana negra: lo que queda de una estrella como el Sol cuando se apaga del todo. No brilla.
// Su interior de carbono y oxígeno se cristaliza: acá, una esfera oscura facetada como un diamante que apenas refleja
// el cielo, con algún destello en las caras. Se la nota más por lo que tapa que por lo que muestra.

const RAD = 2

const vertex = /* glsl */ `
varying vec3 vN, vW, vC;
void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vC = modelMatrix[3].xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`
const fragment = /* glsl */ `
uniform float uFade, uTime; uniform vec3 uKey;
varying vec3 vN, vW, vC;
${skyHead}
${worley}
void main(){
  vec3 V = normalize(cameraPosition - vW), n = normalize(vN);
  vec3 q = n; float cr = cos(uTime * .02), sr = sin(uTime * .02); q.xz = mat2(cr, -sr, sr, cr) * q.xz;
  vec2 w = worley(q * 7.);
  vec3 jitter = hash33(worleyId) - .5;
  vec3 nf = normalize(n + jitter * .5);
  float mu = max(dot(nf, V), 0.);
  vec3 R = reflect(-V, nf);
  float fres = .035 + .965 * pow(1. - mu, 5.);
  vec3 env = atlasSkyAt(R);
  vec3 col = env * fres * .9;
  // destellos: alguna cara que justo refleja una luz lejana
  col += vec3(.75, .8, 1.) * pow(max(dot(R, uKey), 0.), 220.) * 3.;
  // aristas del cristal, apenas
  col += vec3(.18, .2, .3) * smoothstep(.06, .0, w.y - w.x) * (.15 + fres) * .5;
  // borde: el cielo de atrás se curva un poco alrededor
  col += vec3(.25, .3, .5) * pow(1. - max(dot(n, V), 0.), 6.) * .4;
  gl_FragColor = vec4(col * uFade, 1.);
}`

export default function BlackDwarf({ i }: { i: number }) {
  const state = useMemo<StopState>(() => ({ k: 0, d: 9 }), [])
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: vertex, fragmentShader: fragment,
    uniforms: { ...AS, uTime: U.time, uFade: { value: 0 }, uKey: { value: new THREE.Vector3(-0.5, 0.6, 0.6).normalize() } },
  }), [])
  useFrame(() => { mat.uniforms.uFade.value = state.k })
  return (
    <Stop i={i} state={state}>
      <mesh geometry={sphere(96, 64)} material={mat} scale={RAD} renderOrder={4} />
    </Stop>
  )
}
