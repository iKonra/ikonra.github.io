import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { fsVertex, hash, noise3 } from './glsl'
import { J, pose, smooth } from './journey'
import { tri } from './Pipeline'
import { U } from './shared'
import { compileObject, started } from './warm'

// Los dos grandes saltos: velocidad de la luz hacia el centro de la galaxia y agujero de gusano hacia los mundos.
// El scroll mueve el túnel: si se detiene a mitad de camino, se queda adentro.

const fragment = /* glsl */ `
varying vec2 vUv;
uniform float uTime, uA, uMode, uPhase; uniform vec2 uRes, uMouse; uniform vec3 uTint, uTint2;
${hash}
${noise3}
void main(){
  vec2 asp = vec2(uRes.x / uRes.y, 1.);
  vec2 c = (vUv - .5) * asp + uMouse * .06;
  // el tubo se curva
  float bend = uMode * .16;
  c += vec2(sin(uTime * .5 + uPhase * 5.), cos(uTime * .42 + uPhase * 4.)) * bend * smoothstep(.9, 0., length(c));
  float r = length(c), a = atan(c.y, c.x);
  float z = .42 / max(r, .004);
  vec3 col = vec3(0.);
  if(uMode < .5){
    float f = uPhase * 26. + uTime * 2.4;
    for(int i = 0; i < 3; i++){
      float k = float(i), dens = 26. + k * 24.;
      vec2 ca = vec2(cos(a), sin(a)) * dens * .16;
      float n = vnoise(vec3(ca, z * (.16 + k * .05) + f * (.5 + k * .22)));
      float l = smoothstep(.24, .7, n); l *= l;
      float w = vnoise(vec3(ca * 3.1, floor(k) * 9.));
      col += l * mix(vec3(.42, .68, 1.), vec3(1., .96, .9), smoothstep(-.1, .4, w)) * (1.1 - k * .25);
    }
    col *= smoothstep(.02, .34, r) * 1.5;
    col += vec3(.75, .88, 1.) * exp(-r * 11.) * 1.2 + vec3(.10, .22, .62) * exp(-r * 2.6) * .42;
  } else {
    float f = uPhase * 13. + uTime * 1.1, tw = a + z * .12 + uTime * .12;
    vec3 q = vec3(cos(tw) * 1.5, sin(tw) * 1.5, z * .55 + f);
    float n = fbm(q + fbm(q * 1.4 + 3., 3) * 1.1, 5);
    float fil = ridged(vec3(cos(tw) * 2.6, sin(tw) * 2.6, z * .8 + f * 1.2), 4);
    vec3 warm = vec3(1., .62, .3), cool = vec3(.35, .5, 1.);
    col = mix(cool * .1, mix(warm, cool, smoothstep(-.35, .35, n)), smoothstep(-.18, .75, n + .18)) * .85;
    col += pow(max(fil - .55, 0.), 2.) * mix(vec3(1., .86, .66), uTint, .45) * 4.2;
    // anillos: pliegues del espacio
    col += uTint2 * pow(max(sin(z * 2.2 + f * 2.6), 0.), 24.) * .9;
    col *= smoothstep(.02, .42, r);
    // al fondo se ve el otro lado
    vec3 exitC = uTint * 1.6 + .25;
    col += exitC * (exp(-r * r * 150.) * 1.6 + exp(-r * 7.) * .34);
    col *= .9 + .4 * exp(-z * .05);
  }
  gl_FragColor = vec4(col, uA);
}`

export default function Tunnel() {
  const mesh = useRef<THREE.Mesh>(null)
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: fsVertex, fragmentShader: fragment, transparent: true, depthTest: false, depthWrite: false,
    uniforms: { uTime: U.time, uA: { value: 0 }, uMode: { value: 0 }, uPhase: { value: 0 }, uRes: U.res, uMouse: { value: new THREE.Vector2() }, uTint: U.tint, uTint2: { value: new THREE.Color('#ffb066') } },
  }), [])
  const ready = useRef(false)
  // es pesado y hace falta enseguida: se compila antes que el resto
  useEffect(() => { void started.then(() => mesh.current && compileObject(mesh.current)).then(() => { ready.current = true }) }, [])
  useFrame(() => {
    const me = mesh.current
    if (!me) return
    const a = smooth(0, 0.85, J.tunnel)
    me.visible = a > 0.002 && ready.current
    if (!me.visible) return
    const u = mat.uniforms
    u.uA.value = a
    // el agujero de gusano lleva a los mundos y al atlas; la vuelta del atlas es a la velocidad de la luz
    u.uMode.value = J.t > 3.6 && J.t < 9.5 ? 1 : 0
    u.uPhase.value = J.t
    u.uMouse.value.set(-J.mx, -J.my)
    void pose
  })
  return <mesh ref={mesh} geometry={tri} material={mat} frustumCulled={false} renderOrder={40} />
}
