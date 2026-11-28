import * as THREE from 'three'
import { ATLAS_COUNT } from '../state'

// Dónde está cada objeto del atlas. Lejos de todo lo demás: la cámara llega y se va por un salto.
// Cada parada mira hacia otro rincón del cielo, y el cielo se pinta con una nebulosa distinta en cada rincón:
// la cámara gira hacia el próximo objeto y vuela derecho hacia él.

export const ATLAS_ORIGIN = new THREE.Vector3(6000, 0, -2600)

const dirOf = (az: number, el: number) => new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el))

/** Dirección de la mirada: [0] la portada, [i + 1] el objeto i. Separadas al menos ~45°: ningún fondo se repite. */
export const atlasViews = ([
  [0, 0.05], [-0.95, 0.1], [-0.25, -0.72], [0.85, -0.3], [1.7, 0.35], [2.55, -0.2], [-2.85, 0.45], [-2.05, -0.3], [-1.6, 0.68],
] as [number, number][]).map(([a, e]) => dirOf(a, e))

/** Distancia de la cámara al objeto en su parada y largo del vuelo desde la parada anterior. */
export const atlasDist = [17, 13, 96, 54, 16, 26, 25, 8.2]
const legs = [120, 120, 150, 140, 130, 120, 125, 110]

/** Centro de cada objeto y posición de la cámara en su parada. */
export const atlasPos: THREE.Vector3[] = []
export const atlasCam: THREE.Vector3[] = []
{
  let from = ATLAS_ORIGIN.clone()
  for (let i = 0; i < ATLAS_COUNT; i++) {
    const d = atlasViews[i + 1]
    const cam = from.clone().addScaledVector(d, legs[i])
    atlasCam.push(cam)
    atlasPos.push(cam.clone().addScaledVector(d, atlasDist[i]))
    from = cam
  }
}
export const atlasLegs = legs
