// Progreso de carga de texturas y modelos. Sin three.js, para poder mostrarlo en la interfaz.

let total = 0, done = 0
const subs = new Set<() => void>()
const emit = () => subs.forEach(f => f())
export const progress = () => (total ? done / total : 0)
export const onProgress = (f: () => void) => { subs.add(f); return () => { subs.delete(f) } }

export function tracked<T>(p: Promise<T>): Promise<T> {
  total++
  const end = () => { done++; emit() }
  p.then(end, end)
  return p
}
