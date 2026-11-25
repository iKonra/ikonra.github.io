// El viaje: convierte el scroll en un parámetro t y, a partir de t, decide dónde está la cámara y cómo es el espacio.
// El estado y la traducción de scroll viven en state.ts (sin three.js).
import * as THREE from 'three'
import { J, anchorsNow, scrollToT, tToScroll, worldColors } from './state'

export * from './state'

/** Centro de cada etapa, en unidades de mundo. */
export const C = {
  galaxy: new THREE.Vector3(0, 0, 0),
  nebula: new THREE.Vector3(-14, 0.4, 22),
  hole: new THREE.Vector3(0, 0, -1000),
  worlds: [
    new THREE.Vector3(0, 0, -2000),
    new THREE.Vector3(26, 7, -2120),
    new THREE.Vector3(-8, -5, -2250),
    new THREE.Vector3(-34, 4, -2380),
    new THREE.Vector3(2, 0, -2510),
  ],
  belt: new THREE.Vector3(0, 0, -2790),
  saturn: new THREE.Vector3(34, -4, -3230),
  moon: new THREE.Vector3(9.5, 2.2, -3712),
  earth: new THREE.Vector3(0, 0, -3800),
}

const LAT = THREE.MathUtils.degToRad(-31.63), LON = THREE.MathUtils.degToRad(-60.7)
/** Argentina (la baliza) en coordenadas de la esfera, giro del globo al llegar y dirección resultante en el mundo. */
export const HOME = new THREE.Vector3(Math.cos(LAT) * Math.cos(LON), Math.sin(LAT), -Math.cos(LAT) * Math.sin(LON))
export const EARTH_R = 6.4
export const globeTurn: [number, number, number] = [THREE.MathUtils.degToRad(-37), THREE.MathUtils.degToRad(-46), 0.06]
const homeDir = HOME.clone().applyEuler(new THREE.Euler(...globeTurn))
/** Punto sobre la baliza: a `k` radios del centro, corrido `x`, `y`. */
const over = (k: number, x = 0, y = 0): [number, number, number] => [C.earth.x + homeDir.x * EARTH_R * k + x, C.earth.y + homeDir.y * EARTH_R * k + y, C.earth.z + homeDir.z * EARTH_R * k]

/** Pantalla del monitor: centrada en el origen del mundo, en metros. El píxel elegido está en la galaxia de la captura. */
export const SCREEN = { w: 0.598, h: 0.336, px: 1920, py: 1080, u: 0.62, v: 0.36 }
export const PIXEL: [number, number] = [((Math.floor(SCREEN.u * SCREEN.px) + 0.5) / SCREEN.px - 0.5) * SCREEN.w, ((Math.floor(SCREEN.v * SCREEN.py) + 0.5) / SCREEN.py - 0.5) * SCREEN.h]

export type Key = {
  t: number
  pos: [number, number, number]
  look: [number, number, number]
  fov?: number
  roll?: number
  /** Desplazamiento del encuadre en pantalla (−1…1): corre el sujeto sin girar la cámara. */
  shift?: [number, number]
  shiftN?: [number, number]
  /** En pantallas angostas la cámara se aleja del objetivo esta cantidad de veces. */
  farN?: number
  sky?: number
  stars?: number
  bloom?: number
  light?: [number, number, number]
  lightColor?: string
  tint?: string
  /** Posición de la nave en pantalla: x, y (−1…1 del alto) y escala. Escala 0 = fuera de cuadro. */
  ship?: [number, number, number]
  shipN?: [number, number, number]
  /** Esta clave arranca después de un corte (salto): no se interpola con la anterior. */
  cut?: boolean
}

const add = (c: THREE.Vector3, x: number, y: number, z: number): [number, number, number] => [c.x + x, c.y + y, c.z + z]
const W = C.worlds

const worldKeys: Key[] = W.flatMap((w, i): Key[] => {
  const tint = worldColors[i]
  const side = i % 2 ? -1 : 1
  const light: [number, number, number] = i === 1 ? [0.2, 0.15, -1] : [-0.75, 0.4 * side, 0.55]
  const base = { tint, sky: 0.5, stars: 0.9, light, lightColor: i === 1 ? '#bfe0ff' : '#fff1dd', bloom: i === 1 ? 0.9 : 0.95 }
  return [
    { t: 5 + i, pos: add(w, 0, 0.35, 8.2), look: add(w, 0, 0, 0), fov: 40, shift: [0.46, 0], shiftN: [0, 0.4], farN: 1.28, ship: [0.12, -0.6, 0.62], shipN: [0.5, 0.2, 0.36], ...base },
    ...(i < W.length - 1
      ? [{ t: 5 + i + 0.42, pos: add(w, -4.6, 0.9, -1.2), look: add(W[i + 1], 0, 0, 0), fov: 52, shift: [0, 0] as [number, number], ship: [0, -0.42, 0.85] as [number, number, number], shipN: [0, -0.1, 0.55] as [number, number, number], ...base }]
      : []),
  ]
})

const start: Key =
  { t: 0, pos: [-4, 30, 92], look: [0, -1, 0], fov: 42, roll: -0.16, shift: [0.4, 0.02], shiftN: [0.04, -0.42], farN: 1.35, sky: 0.0, stars: 0.55, bloom: 0.9, light: [0.3, 0.6, -0.7], lightColor: '#ffe9c9', tint: '#9db8ff', ship: [0.5, -0.5, 1], shipN: [0.62, -0.42, 0.5] }

export const keys: Key[] = [
  start,
  { t: 0.55, pos: [-9, 14, 64], look: [-8, 0, 20], fov: 50, roll: -0.07, shift: [0.18, 0], shiftN: [0, -0.1], sky: 0.1, stars: 0.7, bloom: 1, light: [0.2, 0.5, -0.8], lightColor: '#ffe3c0', tint: '#8fb0ff', ship: [0.25, -0.42, 1.1], shipN: [0.1, -0.5, 0.7] },
  { t: 1, pos: [-11, 3.2, 44], look: [-14, 0.6, 22], fov: 52, roll: 0, shift: [0.3, 0.05], shiftN: [0.1, 0.35], sky: 0.4, stars: 0.9, bloom: 1.1, light: [0.6, 0.3, -0.7], lightColor: '#bfe2ff', tint: '#5fd0d6', ship: [0.66, -0.42, 0.8], shipN: [0.5, 0.55, 0.42] },
  { t: 2, pos: [-13.6, 1.0, 27], look: [-14.6, 0.6, 4], fov: 54, roll: 0.06, shift: [0.22, 0.02], shiftN: [0.1, 0.35], sky: 0.55, stars: 0.9, bloom: 1.15, light: [0.6, 0.3, -0.7], lightColor: '#bfe2ff', tint: '#ff8f5a', ship: [0.62, -0.4, 0.78], shipN: [0.5, 0.55, 0.42] },
  { t: 2.5, pos: [-14, 0.8, 8], look: [-14.4, 0.6, -20], fov: 76, sky: 0.5, stars: 1, bloom: 1.2, light: [0.2, 0.2, -1], lightColor: '#cfe4ff', tint: '#9cc6ff', ship: [0, -0.3, 1], shipN: [0, -0.2, 0.7] },
  // ---- salto: agujero negro
  { t: 2.5, cut: true, pos: add(C.hole, 0, 9, 78), look: add(C.hole, 0, 0, 0), fov: 76, sky: 1, stars: 1, bloom: 1, light: [0, 0.25, -1], lightColor: '#ffc27d', tint: '#ffb066', ship: [0, -0.3, 1], shipN: [0, -0.2, 0.7] },
  { t: 3, pos: add(C.hole, 0, 3.2, 27), look: add(C.hole, 0, 0, 0), fov: 46, roll: 0.16, shift: [0, 0.05], shiftN: [0, 0.1], farN: 1.6, sky: 1, stars: 1, bloom: 1, light: [0, 0.3, -1], lightColor: '#ffc27d', tint: '#ffb066', ship: [0.5, -0.62, 0.6], shipN: [0.4, -0.5, 0.4] },
  { t: 3.55, pos: add(C.hole, 0, 2.1, 17), look: add(C.hole, 0, 0, 0), fov: 48, roll: 0.22, shift: [0, 0], farN: 1.25, sky: 1, stars: 1, bloom: 1.05, light: [0, 0.3, -1], lightColor: '#ffc27d', tint: '#ffb066', ship: [0.14, -0.3, 0.36], shipN: [0.1, -0.2, 0.24] },
  { t: 4, pos: add(C.hole, 0, 0.5, 4.2), look: add(C.hole, 0, 0, 0), fov: 62, roll: 0.5, sky: 1, stars: 1, bloom: 1.1, light: [0, 0.3, -1], lightColor: '#ffc27d', tint: '#ffb066', ship: [0, 0, 0.0], shipN: [0, 0, 0] },
  { t: 4.5, pos: add(C.hole, 0, 0.1, 1.6), look: add(C.hole, 0, 0, 0), fov: 86, roll: 0.9, sky: 1, stars: 1, bloom: 1.2, light: [0, 0.3, -1], lightColor: '#cfe0ff', tint: '#ffb066', ship: [0, -0.2, 0.9], shipN: [0, -0.1, 0.6] },
  // ---- salida del agujero de gusano: los mundos
  { t: 4.5, cut: true, pos: add(W[0], -2, 3, 70), look: add(W[0], 0, 0, 0), fov: 86, roll: 0.3, sky: 0.5, stars: 1, bloom: 1.1, light: [-0.75, 0.4, 0.55], lightColor: '#fff1dd', tint: worldColors[0], ship: [0, -0.3, 1], shipN: [0, -0.2, 0.6] },
  ...worldKeys,
  { t: 9.5, pos: add(W[4], -5, 1.4, -14), look: add(C.belt, 0, 0, 0), fov: 54, sky: 0.7, stars: 1, bloom: 0.9, light: [-0.8, 0.45, 0.3], lightColor: '#e8f0ff', tint: '#9fb6cf', ship: [0, -0.42, 0.85], shipN: [0, -0.1, 0.55] },
  { t: 10, pos: add(C.belt, 0, 1.4, 34), look: add(C.belt, -2, -1, -60), fov: 50, roll: -0.05, sky: 0.8, stars: 1, bloom: 0.85, light: [-0.8, 0.45, 0.3], lightColor: '#e8f0ff', tint: '#9fb6cf', ship: [0.72, -0.5, 0.6], shipN: [0.6, 0.7, 0.3] },
  { t: 11, pos: add(C.belt, 6, -1.5, -92), look: add(C.belt, 4, 0, -190), fov: 50, roll: 0.06, sky: 0.85, stars: 1, bloom: 0.85, light: [-0.8, 0.45, 0.3], lightColor: '#f3eee2', tint: '#b7b39f', ship: [0.8, 0.5, 0.5], shipN: [0.6, 0.7, 0.3] },
  { t: 12, pos: add(C.saturn, -30, 12, 62), look: add(C.saturn, 0, 0, 0), fov: 42, roll: -0.1, shift: [0.36, 0.12], shiftN: [0.3, 0.42], farN: 1.25, sky: 0.6, stars: 1, bloom: 0.85, light: [-0.75, 0.42, 0.5], lightColor: '#fff0d6', tint: '#e6cfa0', ship: [0.8, -0.5, 0.5], shipN: [0.6, 0.7, 0.3] },
  { t: 12.62, pos: add(C.saturn, -23, 2.1, 26), look: add(C.saturn, 2, -1, -4), fov: 46, roll: -0.02, shift: [0.3, 0.1], shiftN: [0.3, 0.4], sky: 0.6, stars: 1, bloom: 0.9, light: [-0.75, 0.42, 0.5], lightColor: '#fff0d6', tint: '#e6cfa0', ship: [0.74, -0.46, 0.55], shipN: [0.6, 0.7, 0.32] },
  { t: 13, pos: add(C.saturn, -19, -2.9, 10), look: add(C.saturn, -6, -2, -30), fov: 50, roll: 0.12, shift: [0.2, 0], sky: 0.6, stars: 1, bloom: 0.9, light: [-0.75, 0.42, 0.5], lightColor: '#fff0d6', tint: '#e6cfa0', ship: [0.6, -0.4, 0.7], shipN: [0.4, 0.5, 0.4] },
  { t: 13.5, pos: add(C.moon, -3.4, 0.7, 10), look: add(C.moon, -5, -0.4, -30), fov: 48, roll: 0.04, sky: 0.5, stars: 1, bloom: 0.95, light: [-0.85, 0.32, 0.3], lightColor: '#fff6ea', tint: '#b9c6d6', ship: [-0.15, -0.35, 0.85], shipN: [0, -0.2, 0.5] },
  { t: 14, pos: add(C.earth, -1, 4.6, 24.5), look: add(C.earth, 0, 1.2, 0), fov: 40, roll: 0, shift: [0.42, -0.16], shiftN: [0.1, -0.62], farN: 1.12, sky: 0.03, stars: 1, bloom: 1, light: [-0.9, 0.3, -0.12], lightColor: '#fff6ea', tint: '#6fb4ff', ship: [0.02, 0.2, 0.42], shipN: [0.55, 0.45, 0.28] },
  ...descentKeys(),
]

/** La caída: de la órbita a la ciudad, a una ventana, al monitor y a un píxel. Se cierra con la misma pose del inicio. */
function descentKeys(): Key[] {
  const night = { light: [-0.35, 0.35, -0.9] as [number, number, number], lightColor: '#fff6ea', tint: '#7fb0ff', sky: 0.03, stars: 1, bloom: 1.05, ship: [0.05, 0.1, 0] as [number, number, number], shipN: [0.2, 0.1, 0] as [number, number, number] }
  const city = { light: [-0.3, 0.6, -0.7] as [number, number, number], lightColor: '#9db8ff', tint: '#7f9cff', sky: 0.1, stars: 0.85, bloom: 1.25, ship: [0, 0, 0] as [number, number, number], shipN: [0, 0, 0] as [number, number, number] }
  const room = { ...city, tint: '#ff8a4a', bloom: 1 }
  const screen = { ...city, tint: '#9db8ff', bloom: 0.95 }
  const [px, py] = PIXEL
  const zoom: Key[] = []
  const N = 14, z0 = 0.62, z1 = 4.2e-4
  for (let i = 0; i <= N; i++) {
    const u = i / N, z = z0 * Math.pow(z1 / z0, u)
    const c = Math.min(1, 1 - Math.pow((z - z1) / (z0 - z1), 1.7))
    zoom.push({ t: 18.35 + u * 0.65, pos: [px * c, py * c, z], look: [px * c, py * c, 0], fov: 38, ...screen, sky: 0, stars: 0 })
  }
  return [
    { t: 14.42, pos: over(2.35, -0.6, 0.9), look: over(1), fov: 42, ...night },
    { t: 14.75, pos: over(1.3, -0.1, 0.25), look: over(1), fov: 46, ...night },
    { t: 15, pos: over(1.06), look: over(1), fov: 50, ...night },
    { t: 15, cut: true, pos: [-420, 2500, 1500], look: [-190, -24, 420], fov: 54, roll: 0.1, ...city },
    { t: 15.5, pos: [-270, 860, 930], look: [-30, -24, 60], fov: 52, roll: 0.06, ...city },
    { t: 16, pos: [-120, 250, 520], look: [0, -14, -60], fov: 48, roll: 0.02, ...city },
    { t: 16.5, pos: [-34, 58, 186], look: [0, 3, 0], fov: 44, ...city },
    { t: 16.9, pos: [-6, 10, 50], look: [0, 0.5, 0], fov: 42, ...city },
    { t: 17.3, pos: [-0.7, 1.15, 11], look: [0, 0.3, 0], fov: 44, ...room },
    { t: 17.6, pos: [-0.12, 0.42, 3.7], look: [0, 0.12, 0], fov: 54, farN: 1, ...room },
    { t: 18, pos: [0.02, 0.2, 1.55], look: [0, 0.05, 0], fov: 50, ...room },
    ...zoom,
    { t: 19, cut: true, pos: [-1, 6, 30], look: [0, 0, 0], fov: 38, roll: 0, shift: [0, 0], shiftN: [0, 0], sky: 0, stars: 0, bloom: 1, light: [0.3, 0.6, -0.7], lightColor: '#ffe9c9', tint: '#9db8ff', ship: [0.5, -0.9, 0], shipN: [0.62, -0.9, 0] },
    { t: 19.45, pos: [-2.5, 20, 64], look: [0, -0.4, 0], fov: 41, roll: -0.08, shift: [0.16, 0.01], shiftN: [0.02, -0.2], farN: 1.35, sky: 0, stars: 0.3, bloom: 0.95, light: [0.3, 0.6, -0.7], lightColor: '#ffe9c9', tint: '#9db8ff', ship: [0.5, -0.7, 0.5], shipN: [0.62, -0.6, 0.2] },
    { ...start, t: 19.94 },
    { ...start, t: 20 },
  ]
}

/* ------------------------------------------------------------------ interpolación */
export type Pose = {
  pos: THREE.Vector3; dir: THREE.Vector3; fov: number; roll: number; shift: THREE.Vector2
  sky: number; stars: number; bloom: number; light: THREE.Vector3; lightColor: THREE.Color; tint: THREE.Color; ship: THREE.Vector3
  /** Distancia al objetivo: pivote del modo explorar. */
  dist: number
}
export const pose: Pose = {
  pos: new THREE.Vector3(), dir: new THREE.Vector3(0, 0, -1), fov: 45, roll: 0, shift: new THREE.Vector2(),
  sky: 0, stars: 1, bloom: 1, light: new THREE.Vector3(0, 0, 1), lightColor: new THREE.Color(), tint: new THREE.Color(), ship: new THREE.Vector3(), dist: 10,
}

type Track = { t: number[]; v: number[][]; m: number[][] }

/** Cúbica monótona por componente (Fritsch–Carlson): llega suave a cada parada y nunca se pasa de largo. */
function track(ts: number[], vals: number[][]): Track {
  const n = ts.length, d = vals[0].length
  const m: number[][] = vals.map(() => Array(d).fill(0))
  for (let c = 0; c < d; c++) {
    const s: number[] = []
    for (let i = 0; i < n - 1; i++) s.push((vals[i + 1][c] - vals[i][c]) / Math.max(ts[i + 1] - ts[i], 1e-5))
    for (let i = 0; i < n; i++) {
      if (i === 0) m[i][c] = s[0] ?? 0
      else if (i === n - 1) m[i][c] = s[n - 2] ?? 0
      else if (s[i - 1] * s[i] <= 0) m[i][c] = 0
      else {
        const h0 = ts[i] - ts[i - 1], h1 = ts[i + 1] - ts[i]
        const w1 = 2 * h1 + h0, w2 = h1 + 2 * h0
        m[i][c] = (w1 + w2) / (w1 / s[i - 1] + w2 / s[i])
      }
    }
  }
  return { t: ts, v: vals, m }
}

function sample(tr: Track, t: number, out: number[]) {
  const n = tr.t.length
  let i = 0
  while (i < n - 2 && t > tr.t[i + 1]) i++
  const t0 = tr.t[i], t1 = tr.t[Math.min(i + 1, n - 1)], h = Math.max(t1 - t0, 1e-5)
  const u = Math.min(Math.max((t - t0) / h, 0), 1), u2 = u * u, u3 = u2 * u
  const a = 2 * u3 - 3 * u2 + 1, b = u3 - 2 * u2 + u, c = -2 * u3 + 3 * u2, e = u3 - u2
  const v0 = tr.v[i], v1 = tr.v[Math.min(i + 1, n - 1)], m0 = tr.m[i], m1 = tr.m[Math.min(i + 1, n - 1)]
  for (let k = 0; k < v0.length; k++) out[k] = a * v0[k] + b * h * m0[k] + c * v1[k] + e * h * m1[k]
  return out
}

type Segment = { from: number; to: number; main: Track; cols: Track }
const segments: { wide: Segment[]; narrow: Segment[] } = { wide: [], narrow: [] }

function build(narrow: boolean): Segment[] {
  const groups: Key[][] = []
  for (const k of keys) { if (k.cut || !groups.length) groups.push([]); groups[groups.length - 1].push(k) }
  const col = new THREE.Color(), p = new THREE.Vector3(), l = new THREE.Vector3(), d = new THREE.Vector3()
  return groups.map(g => {
    const ts = g.map(k => k.t)
    const main = g.map(k => {
      p.fromArray(k.pos); l.fromArray(k.look)
      if (narrow && k.farN) p.sub(l).multiplyScalar(k.farN).add(l)
      d.copy(l).sub(p).normalize()
      const sh = (narrow ? k.shiftN ?? [0, 0] : k.shift) ?? [0, 0]
      const ship = (narrow ? k.shipN : k.ship) ?? [0, -0.4, 0]
      const li = k.light ?? [0, 0, 1]
      return [p.x, p.y, p.z, d.x, d.y, d.z, k.fov ?? 45, k.roll ?? 0, sh[0], sh[1], k.sky ?? 0.5, k.stars ?? 1, k.bloom ?? 1, li[0], li[1], li[2], ship[0], ship[1], ship[2], Math.min(p.distanceTo(l), 110)]
    })
    const cols = g.map(k => {
      const a = col.set(k.lightColor ?? '#ffffff').toArray(), b = col.set(k.tint ?? '#9db8ff').toArray()
      return [...a, ...b]
    })
    return { from: ts[0], to: ts[ts.length - 1], main: track(ts, main), cols: track(ts, cols) }
  })
}
segments.wide = build(false)
segments.narrow = build(true)

const buf: number[] = []
/** Posición completa del viaje para un t dado. Devuelve en qué tramo está (para detectar cortes). */
export function poseAt(t: number, out: Pose = pose, narrow = J.narrow) {
  const list = narrow ? segments.narrow : segments.wide
  let i = list.length - 1
  while (i > 0 && t < list[i].from) i--
  const s = list[i]
  const m = sample(s.main, t, buf)
  out.pos.set(m[0], m[1], m[2])
  out.dir.set(m[3], m[4], m[5]).normalize()
  out.fov = m[6]; out.roll = m[7]; out.shift.set(m[8], m[9])
  out.sky = m[10]; out.stars = m[11]; out.bloom = m[12]
  out.light.set(m[13], m[14], m[15]).normalize()
  out.ship.set(m[16], m[17], m[18])
  out.dist = m[19]
  const c = sample(s.cols, t, buf)
  out.lightColor.setRGB(c[0], c[1], c[2]); out.tint.setRGB(c[3], c[4], c[5])
  return i
}

if (import.meta.env.DEV || location.search.includes('debug')) (window as unknown as { __J: unknown }).__J = { J, pose, scrollToT, tToScroll, anchors: anchorsNow }
