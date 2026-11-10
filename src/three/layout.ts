// Posición de las secciones medida una sola vez (y al cambiar el tamaño), para que el 3D no fuerce un reflow en cada frame.

const ids = ['top', 'about', 'journey', 'contact', 'projects'] as const
type Id = (typeof ids)[number]

export const layout = {
  vh: 1,
  max: 1,
  rects: {} as Partial<Record<Id, { top: number; bottom: number }>>,
}

function measure() {
  layout.vh = innerHeight
  layout.max = Math.max(1, document.documentElement.scrollHeight - innerHeight)
  for (const id of ids) {
    const el = document.getElementById(id)
    if (!el) { delete layout.rects[id]; continue }
    const r = el.getBoundingClientRect()
    layout.rects[id] = { top: r.top + scrollY, bottom: r.bottom + scrollY }
  }
}

/** Cuánto de la pantalla ocupa una sección ahora mismo (0 a 1). */
export function presence(id: Id, y: number) {
  const r = layout.rects[id]
  if (!r) return 0
  return Math.max(0, Math.min(r.bottom - y, layout.vh) - Math.max(r.top - y, 0)) / layout.vh
}

/** ¿La sección tapa toda la pantalla? */
export function covers(id: Id, y: number) {
  const r = layout.rects[id]
  return !!r && r.top <= y && r.bottom >= y + layout.vh
}

export function watchLayout() {
  measure()
  const ro = new ResizeObserver(measure)
  ro.observe(document.documentElement)
  addEventListener('resize', measure)
  document.fonts?.ready.then(measure)
  return () => { ro.disconnect(); removeEventListener('resize', measure) }
}
