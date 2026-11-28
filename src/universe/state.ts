// Estado del viaje y traducción de scroll a t. Sin three.js: lo usan tanto la escena 3D como la interfaz.

/* ------------------------------------------------------------------ escalas de t
   0 inicio · 1→2 Sobre mí · 3→4 agujero negro · 5…9 un mundo por proyecto · 9.1→9.9 atlas de objetos exóticos
   10→11 Stack · 12→13 Trayectoria · 14 Contacto
   14→15 caída a la Tierra · 15→17 ciudad · 17→18.4 habitación · 18.4→19 píxel · 19→20 Big Bang: 20 es otra vez el inicio */
export const T = { top: 0, about: 1, aboutEnd: 2, hole: 3, horizon: 4, worlds: 5, atlas: 9.1, atlasFirst: 9.18, atlasOut: 9.9, stack: 10, stackEnd: 11, journey: 12, journeyEnd: 13, contact: 14, bang: 19, end: 20 } as const
export const WORLD_COUNT = 5

/** Colores de cada mundo: tiñen el polvo, las luces, la grieta y la interfaz. */
export const worldColors = ['#ff7a3c', '#4aa3ff', '#5b7cff', '#ff5a1f', '#7c86ff'] as const

/* ------------------------------------------------------------------ atlas
   Un salto fuera de lo conocido: ocho objetos que la física permite y nadie vio todavía (o casi).
   Comparten el tramo 9.1…9.9 de t; cada uno tiene su parada, como los mundos. */
export const ATLAS_COUNT = 8
export const ATLAS_STEP = 0.09
export const atlasStop = (i: number) => T.atlasFirst + i * ATLAS_STEP
export const ATLAS_LAST = atlasStop(ATLAS_COUNT - 1)
export const atlasIds = ['pbh', 'boson', 'quasi', 'quark', 'gravastar', 'white', 'dyson', 'dwarf'] as const
export const atlasColors = ['#b98aff', '#4fe3c8', '#ff7a45', '#ff62c6', '#7fd4ff', '#c9d6ff', '#ffc55a', '#8f9bff'] as const
/** Índice del objeto más cercano (o -1 fuera del atlas). */
export function atlasIndex(t: number) {
  if (t < T.atlasFirst - ATLAS_STEP * 0.2 || t > ATLAS_LAST + ATLAS_STEP * 0.55) return -1
  return Math.min(ATLAS_COUNT - 1, Math.max(0, Math.round((t - T.atlasFirst) / ATLAS_STEP)))
}

/* ------------------------------------------------------------------ estado compartido */
export const J = {
  /** t del scroll y t suavizado que usa la cámara. */
  target: 0,
  /** t sin plegar: llega a 20. `t` vuelve a 0 en el Big Bang final, así la galaxia es la misma del inicio. */
  raw: 0,
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
  /** Cuántas veces se cerró el bucle. */
  loops: 0,
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
let worldsTop = 0, worldsLen = 1, atlasTop = 0, atlasLen = 0

const rect = (id: string) => {
  const el = document.getElementById(id)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.top + scrollY, bottom: r.bottom + scrollY }
}

/** `loop`: la página sigue después de Contacto y se cierra en un bucle. `contact`: scroll donde frena Contacto. */
export const layout = { vh: 1, max: 1, loop: false, contact: 1 }

/** Ritmo de la caída: fracción del tramo → t. Más lento donde hay algo para mirar o leer. */
const descent: [number, number][] = [[0.1, 15], [0.4, 16.9], [0.53, 17.75], [0.66, 18.2], [0.71, 18.35], [0.86, 19], [0.965, 19.94], [1, 20]]

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
  // atlas: un tramo del viaje, sin paradas: salto, vivero de estrellas, los ocho objetos de pasada y salto al cinturón de Kuiper
  const at = rect('atlas-track')
  atlasLen = 0
  if (at) {
    const len = Math.max(1, at.bottom - vh - at.top)
    push(at.top, T.atlas - 0.03)
    atlasTop = at.top + len * 0.18
    atlasLen = len * 0.7
    push(atlasTop, T.atlasFirst)
    push(atlasTop + atlasLen, ATLAS_LAST)
    push(at.bottom - vh, T.atlasOut + 0.04)
  }
  if (s) { push(s.top - vh * 0.25, T.stack); push(s.bottom - vh * 0.8, T.stackEnd) }
  if (j) { push(j.top - vh * 0.15, T.journey); push(j.bottom - vh * 0.75, T.journeyEnd) }
  const c = rect('contact'), d = rect('descent')
  layout.loop = !!c && !!d && d.bottom - d.top > vh
  layout.contact = layout.loop ? Math.min(c!.bottom - vh, layout.max) : layout.max
  push(layout.contact, T.contact)
  if (layout.loop) {
    // Contacto se va por arriba mientras empieza la caída
    push(layout.contact + vh * 0.12, T.contact)
    push(layout.contact + vh, 14.34)
    const a = layout.contact + vh, len = layout.max - a
    descent.forEach(([f, t]) => push(a + len * f, t))
  }
  anchors = out
}

/** Cada proyecto se queda quieto un rato antes de pasar al siguiente. */
export function hold(raw: number, last: number) {
  const k = Math.min(Math.floor(raw), last)
  const f = raw - k
  const u = Math.min(Math.max((f - 0.22) / 0.56, 0), 1)
  return Math.min(k + u * u * (3 - 2 * u), last)
}

/** En el atlas no se frena: la cámara solo afloja un poco al pasar junto a cada objeto. */
function glide(raw: number) {
  const k = Math.floor(raw), f = raw - k
  return k + f + (f * f * (3 - 2 * f) - f) * 0.6
}

export function scrollToT(y: number) {
  const last = WORLD_COUNT - 1
  if (y > worldsTop && y < worldsTop + worldsLen && worldsLen > 1) return T.worlds + hold(((y - worldsTop) / worldsLen) * last, last)
  if (atlasLen > 1 && y > atlasTop && y < atlasTop + atlasLen) return T.atlasFirst + glide(((y - atlasTop) / atlasLen) * (ATLAS_COUNT - 1)) * ATLAS_STEP
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

/** Los saltos: entre Sobre mí y el agujero negro, el agujero de gusano hacia los mundos, y la ida y vuelta del atlas. */
export const tunnelAt = (t: number) => Math.max(
  win(t, 2.14, 2.44, 2.56, 2.86), win(t, 4.04, 4.3, 4.66, 4.96),
  win(t, T.atlas - 0.07, T.atlas - 0.022, T.atlas + 0.016, T.atlas + 0.05), win(t, T.atlasOut - 0.055, T.atlasOut - 0.018, T.atlasOut + 0.02, T.atlasOut + 0.06),
)

/** Distancia a la Tierra (en años luz) según el punto del viaje: escala logarítmica entre hitos reales. */
const LY_KM = 9.4607e12
const marks: [number, number][] = [
  [0, 100000], [1, 30000], [2, 28000], [3, 26700], [4, 26000], [5, 7500], [6, 1344], [7, 520], [8, 88], [9, 4.24],
  [10, 6e9 / LY_KM], [11, 4.5e9 / LY_KM], [12, 1.4e9 / LY_KM], [13, 1.2e9 / LY_KM], [13.5, 384400 / LY_KM], [13.85, 36000 / LY_KM], [14, 408 / LY_KM],
  [14.7, 90 / LY_KM], [15, 2.6 / LY_KM], [15.5, 0.9 / LY_KM], [16, 0.26 / LY_KM], [16.5, 0.062 / LY_KM], [16.9, 0.025 / LY_KM],
  // adentro: distancia a la pantalla
  [16.901, 0.05 / LY_KM], [17.3, 0.01 / LY_KM], [17.6, 0.0036 / LY_KM], [18, 0.0015 / LY_KM], [18.35, 6.2e-4 / LY_KM], [19, 4e-7 / LY_KM],
  [19.001, 4e-7 / LY_KM], [19.25, 1], [19.85, 100000], [20, 100000],
]
export function distanceLy(t: number) {
  let i = 0
  while (i < marks.length - 2 && t > marks[i + 1][0]) i++
  const [t0, a] = marks[i], [t1, b] = marks[i + 1]
  const u = Math.min(Math.max((t - t0) / (t1 - t0), 0), 1)
  return Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * u)
}
export const lyToKm = (ly: number) => ly * LY_KM

