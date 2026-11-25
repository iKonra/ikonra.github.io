import * as THREE from 'three'

// Uniforms comunes: se pasan por referencia a todos los shaders y los actualiza el Rig una vez por frame.
export const U = {
  time: { value: 0 },
  /** Dirección hacia la luz principal (mundo) y su color. */
  light: { value: new THREE.Vector3(0, 0, 1) },
  lightColor: { value: new THREE.Color('#ffffff') },
  tint: { value: new THREE.Color('#9db8ff') },
  /** Tamaño del buffer en píxeles. */
  res: { value: new THREE.Vector2(1, 1) },
  pr: { value: 1 },
}

/** Números al azar repetibles: la escena es siempre la misma. */
export function mulberry(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
