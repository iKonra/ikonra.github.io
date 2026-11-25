// Estado del viaje y traducción de scroll a t. Sin three.js: lo usan tanto la escena 3D como la interfaz.

/* ------------------------------------------------------------------ escalas de t
   0 inicio · 1→2 Sobre mí · 3→4 agujero negro · 5…9 un mundo por proyecto · 10→11 Stack · 12→13 Trayectoria · 14 Contacto */
export const T = { top: 0, about: 1, aboutEnd: 2, hole: 3, horizon: 4, worlds: 5, stack: 10, stackEnd: 11, journey: 12, journeyEnd: 13, contact: 14 } as const
export const WORLD_COUNT = 5

/** Colores de cada mundo: tiñen el polvo, las luces, la grieta y la interfaz. */
export const worldColors = ['#ff7a3c', '#4aa3ff', '#5b7cff', '#ff5a1f', '#7c86ff'] as const

/* ------------------------------------------------------------------ estado compartido */
export const J = {
  /** t del scroll y t suavizado que usa la cámara. */
  target: 0,
  t: 0,
  /** Velocidad suavizada de t, y la misma en 0…1 para los efectos de warp. */
  v: 0,
  warp: 0,
  /** Intensidad del túnel (0…1) en los dos grandes saltos. */
  tunnel: 0,
  /** Puntero en NDC, suavizado. `active` baja a 0 cuando el mouse se queda quieto. */
  px: 0, py: 0, mx: 0, my: 0,
  /** Big Bang: 0 = singularidad, 1 = galaxia formada. */
  birth: 0,
  narrow: false,
  /** Modo explorar: giro libre de la cámara (radianes). */
  yaw: 0, pitch: 0, yawT: 0, pitchT: 0,
  explore: false,
  /** Solo para depurar: fija t sin scrollear. */
  force: null as number | null,
  /** Corrimiento de lente aplicado en este frame. */
  shift: { x: 0, y: 0 },
  /** Explosión al tocar la galaxia (decae solo) y tipo de galaxia elegido. */
  kick: 0,
  galaxy: 0,
  /** Golpe de la grieta: posición en UV y edad en segundos. */
  hit: { x: 0.5, y: 0.5, age: 99 },
  ready: false,
  /** Los shaders del inicio ya están compilados: se puede dibujar. */
  warm: false,
  /** Color de la zona en sRGB (0…255): cursor, polvo de estrellas. */
  tint: [157, 184, 255] as [number, number, number],
}

/** Cantidad de tipos de galaxia y baliza de la Tierra en pantalla (px; k = visibilidad). */
export const GALAXIES = 5
export const beacon = { x: 0, y: 0, k: 0 }

/** Golpe en el espacio: onda de choque en ese punto de la pantalla. */
export function strike(clientX: number, clientY: number) {
  J.hit.x = clientX / innerWidth
  J.hit.y = 1 - clientY / innerHeight
  J.hit.age = 0
}
/** La galaxia explota y se rearma como otro tipo. */
export function burst() {
  J.galaxy = (J.galaxy + 1) % GALAXIES
  J.kick = 1
  return J.galaxy
}

/* ------------------------------------------------------------------ DOM → t */
type Anchor = { y: number; t: number }
let anchors: Anchor[] = [{ y: 0, t: 0 }, { y: 1, t: 14 }]
let worldsTop = 0, worldsLen = 1

const rect = (id: string) => {
  const el = document.getElementById(id)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.top + scrollY, bottom: r.bottom + scrollY }
}

export const layout = { vh: 1, max: 1 }

function measure() {
  const vh = innerHeight
  layout.vh = vh
  layout.max = Math.max(1, document.documentElement.scrollHeight - vh)
  const a = rect('about'), h = rect('projects-head'), w = rect('worlds'), s = rect('stack'), j = rect('journey')
  const out: Anchor[] = [{ y: 0, t: 0 }]
  const push = (y: number, t: number) => { const last = out[out.length - 1]; out.push({ y: Math.max(y, last.y + 1), t }) }
  if (a) { push(a.top - vh * 0.1, T.about); push(a.bottom - vh * 1.05, T.aboutEnd) }
  if (h) { push(h.top, T.hole); push(h.bottom - vh, T.horizon) }
  if (w) { worldsTop = w.top; worldsLen = Math.max(1, w.bottom - vh - w.top); push(w.top, T.worlds); push(w.bottom - vh, T.worlds + WORLD_COUNT - 1) }
  if (s) { push(s.top - vh * 0.25, T.stack); push(s.bottom - vh * 0.8, T.stackEnd) }
  if (j) { push(j.top - vh * 0.15, T.journey); push(j.bottom - vh * 0.75, T.journeyEnd) }
  push(layout.max, T.contact)
  anchors = out
}

/** Cada proyecto se queda quieto un rato antes de pasar al siguiente. */
export function hold(raw: number, last: number) {
  const k = Math.min(Math.floor(raw), last)
  const f = raw - k
  const u = Math.min(Math.max((f - 0.22) / 0.56, 0), 1)
  return Math.min(k + u * u * (3 - 2 * u), last)
}

export function scrollToT(y: number) {
  const last = WORLD_COUNT - 1
  if (y > worldsTop && y < worldsTop + worldsLen && worldsLen > 1) return T.worlds + hold(((y - worldsTop) / worldsLen) * last, last)
  let i = 0
  while (i < anchors.length - 2 && y > anchors[i + 1].y) i++
  const a = anchors[i], b = anchors[i + 1]
  const f = Math.min(Math.max((y - a.y) / (b.y - a.y), 0), 1)
  return a.t + (b.t - a.t) * f
}

/** Inversa aproximada: a qué scroll corresponde un t (para la barra de viaje del HUD). */
export function tToScroll(t: number) {
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i], b = anchors[i + 1]
    if (t <= b.t) return a.y + ((b.y - a.y) * (t - a.t)) / Math.max(b.t - a.t, 1e-4)
  }
  return layout.max
}

export const anchorsNow = () => anchors

export function watchLayout() {
  measure()
  const ro = new ResizeObserver(measure)
  ro.observe(document.documentElement)
  const main = document.querySelector('main')
  if (main) ro.observe(main)
  addEventListener('resize', measure)
  document.fonts?.ready.then(measure)
  return () => { ro.disconnect(); removeEventListener('resize', measure) }
}

/* ------------------------------------------------------------------ utilidades de escena */
export const smooth = (a: number, b: number, v: number) => {
  const u = Math.min(Math.max((v - a) / (b - a), 0), 1)
  return u * u * (3 - 2 * u)
}
/** Ventana suave: sube entre a0 y a1, baja entre b0 y b1. */
export const win = (t: number, a0: number, a1: number, b0: number, b1: number) => smooth(a0, a1, t) * (1 - smooth(b0, b1, t))
export const damp = (a: number, b: number, lambda: number, dt: number) => a + (b - a) * (1 - Math.exp(-lambda * dt))

/** Los dos saltos: entre Sobre mí y el agujero negro, y el agujero de gusano hacia los mundos. */
export const tunnelAt = (t: number) => Math.max(win(t, 2.14, 2.44, 2.56, 2.86), win(t, 4.04, 4.3, 4.66, 4.96))

/** Distancia a la Tierra (en años luz) según el punto del viaje: escala logarítmica entre hitos reales. */
const LY_KM = 9.4607e12
const marks: [number, number][] = [
  [0, 100000], [1, 30000], [2, 28000], [3, 26700], [4, 26000], [5, 7500], [6, 1344], [7, 520], [8, 88], [9, 4.24],
  [10, 6e9 / LY_KM], [11, 4.5e9 / LY_KM], [12, 1.4e9 / LY_KM], [13, 1.2e9 / LY_KM], [13.5, 384400 / LY_KM], [13.85, 36000 / LY_KM], [14, 408 / LY_KM],
]
export function distanceLy(t: number) {
  let i = 0
  while (i < marks.length - 2 && t > marks[i + 1][0]) i++
  const [t0, a] = marks[i], [t1, b] = marks[i + 1]
  const u = Math.min(Math.max((t - t0) / (t1 - t0), 0), 1)
  return Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * u)
}
export const lyToKm = (ly: number) => ly * LY_KM

