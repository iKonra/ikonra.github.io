import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { hash, noise3 } from '../glsl'
import { ATLAS_STEP, J, atlasStop, smooth } from '../journey'
import { U } from '../shared'
import { atlasSky, lens, shellVertex } from './glsl'
import { atlasPos } from './layout'
import { AS, inAtlas } from './Sky'

/** Presencia de un objeto: `k` sube al acercarse a su parada; `d` es la distancia en paradas. */
export type StopState = { k: number; d: number }

/** Ubica un objeto del atlas y lo apaga cuando la cámara está lejos de su parada. */
export function Stop({ i, state, children }: { i: number; state: StopState; children: ReactNode }) {
  const g = useRef<THREE.Group>(null)
  useFrame(() => {
    const d = (J.t - atlasStop(i)) / ATLAS_STEP
    state.d = d
    state.k = 1 - smooth(0.5, 0.88, Math.abs(d))
    if (g.current) g.current.visible = inAtlas(J.t) && Math.abs(d) < 0.92
  }, -5)
  return <group ref={g} position={atlasPos[i]} visible={false}>{children}</group>
}

/** Cabecera de todo shader que mira el cielo del atlas. */
export const skyHead = /* glsl */ `
${hash}
${noise3}
${atlasSky}
${lens}
`

/** Material de lienzo: una esfera del lado de adentro, con el rayo de la cámara calculado en el fragmento.
 *  Sale con alfa premultiplicado: tapa lo de atrás donde redibuja el cielo desviado y suma luz donde solo brilla. */
export function useShell(fragment: string, uniforms: Record<string, THREE.IUniform>, defines: Record<string, number> = {}) {
  const key = JSON.stringify(defines)
  return useMemo(() => new THREE.ShaderMaterial({
    vertexShader: shellVertex, fragmentShader: fragment, defines, side: THREE.BackSide,
    transparent: true, premultipliedAlpha: true, depthWrite: false, depthTest: true,
    uniforms: { ...AS, uTime: U.time, uFade: { value: 0 }, ...uniforms },
  // los uniforms propios se pasan por referencia: no hace falta rehacer el material si cambian sus valores
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [fragment, key])
}

const spheres = new Map<string, THREE.SphereGeometry>()
/** Esferas compartidas: alcanza con pocas caras para un lienzo. */
export function sphere(w = 24, h = 16) {
  const k = `${w}x${h}`
  if (!spheres.has(k)) spheres.set(k, new THREE.SphereGeometry(1, w, h))
  return spheres.get(k)!
}

/** Celdas de Voronoi en 3D: distancia a la primera y segunda semilla, y la posición de la primera. Necesita `hash`. */
export const worley = /* glsl */ `
vec3 worleyId;
vec2 worley(vec3 p){
  vec3 i = floor(p), f = fract(p); float d1 = 9., d2 = 9.;
  for(int z = -1; z <= 1; z++) for(int y = -1; y <= 1; y++) for(int x = -1; x <= 1; x++){
    vec3 g = vec3(float(x), float(y), float(z)), r = g + hash33(i + g) - f; float d = dot(r, r);
    if(d < d1){ d2 = d1; d1 = d; worleyId = i + g; } else if(d < d2) d2 = d;
  }
  return sqrt(vec2(d1, d2));
}`
