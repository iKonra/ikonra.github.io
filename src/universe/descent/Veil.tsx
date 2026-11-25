import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { fsVertex, hash, noise3 } from '../glsl'
import { J, win } from '../journey'
import { tri } from '../Pipeline'
import { U } from '../shared'
import { compileObject, started } from '../warm'

// Las nubes que se atraviesan al caer. Cada capa crece hacia la cámara y se renueva al fondo: el scroll las mueve.

const fragment = /* glsl */ `
varying vec2 vUv;
uniform float uTime, uA, uPhase; uniform vec2 uRes, uMouse;
${hash}
${noise3}
void main(){
  vec2 c = (vUv - .5) * vec2(uRes.x / uRes.y, 1.) + uMouse * .04;
  float a = 0.; vec3 col = vec3(0.);
  // de lejos a cerca
  for(int i = 0; i < 4; i++){
    float k = fract(float(i) / 4. + uPhase), z = mix(3.4, .28, k);
    vec2 p = c * z + vec2(float(i) * 7.3, float(i) * 3.1 + floor(float(i) / 4. + uPhase) * 5.7);
    float n = fbm(vec3(p * 1.5, uTime * .05 + float(i)), 5);
    float d = smoothstep(mix(.28, -.34, uA), .42, n) * smoothstep(0., .25, k) * smoothstep(1., .72, k);
    // relieve: la luna por arriba, la ciudad por abajo
    float r = fbm(vec3(p * 1.5 + vec2(.05, .16), uTime * .05 + float(i)), 4) - n;
    vec3 cc = vec3(.030, .042, .075) + vec3(.16, .21, .34) * max(-r * 2.2, 0.) + vec3(.34, .17, .06) * max(r * 1.6, 0.) * exp(-dot(c, c) * 1.6);
    col = mix(col, cc, d); a = a + (1. - a) * d;
  }
  // en el medio de la nube no se ve nada más
  float full = smoothstep(.72, 1., uA);
  vec3 mist = vec3(.030, .042, .075) + vec3(.05, .032, .018) * exp(-dot(c, c) * 2.);
  col = mix(mist, col / max(a, .001), mix(a, .55 * a, full));
  a = mix(a * smoothstep(0., .25, uA), 1., full);
  gl_FragColor = vec4(col, a);
}`

export default function Veil() {
  const mesh = useRef<THREE.Mesh>(null)
  const ready = useRef(false)
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: fsVertex, fragmentShader: fragment, transparent: true, depthTest: false, depthWrite: false,
    uniforms: { uTime: U.time, uA: { value: 0 }, uPhase: { value: 0 }, uRes: U.res, uMouse: { value: new THREE.Vector2() } },
  }), [])
  useEffect(() => { void started.then(() => mesh.current && compileObject(mesh.current)).then(() => { ready.current = true }) }, [])
  useFrame(() => {
    const me = mesh.current
    if (!me) return
    const a = win(J.raw, 14.6, 14.95, 15.04, 15.62)
    me.visible = a > 0.002 && ready.current
    if (!me.visible) return
    mat.uniforms.uA.value = a
    mat.uniforms.uPhase.value = (J.raw - 14.5) * 2.6
    mat.uniforms.uMouse.value.set(-J.mx, -J.my)
  })
  return <mesh ref={mesh} geometry={tri} material={mat} frustumCulled={false} renderOrder={38} visible={false} />
}
