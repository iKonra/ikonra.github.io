import { useSyncExternalStore } from 'react'

// Niveles de carga del 3D y del scroll. El diseño no cambia: solo cuánto cuesta.
//   0 = completo · 1 = liviano (menos partículas, resolución 1x, scroll nativo) · 2 = quieto (el 3D solo se redibuja al scrollear)
export type Tier = 0 | 1 | 2

type NavExt = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** Misma heurística que el script de index.html (que marca html.lite antes del primer render). ?lite=1 / ?lite=0 la fuerzan para probar. */
function detectLite() {
  const q = new URLSearchParams(location.search).get('lite')
  if (q === '1') return true
  if (q === '0') return false
  if (prefersReducedMotion()) return true
  const n = navigator as NavExt
  return (n.hardwareConcurrency ?? 8) <= 4 || (n.deviceMemory ?? 8) <= 4 || !!n.connection?.saveData
}

let tier: Tier = detectLite() ? 1 : 0
const subs = new Set<() => void>()

export const getTier = () => tier
export const isLite = () => tier >= 1

/** Baja un escalón (una sola vez por escalón, nunca vuelve a subir para no oscilar). */
export function degrade() {
  if (tier >= 2) return
  tier = (tier + 1) as Tier
  document.documentElement.classList.add('lite')
  window.dispatchEvent(new Event('perf:lite'))
  subs.forEach(cb => cb())
}

export function useTier(): Tier {
  return useSyncExternalStore(
    cb => { subs.add(cb); return () => { subs.delete(cb) } },
    getTier,
    () => 0 as Tier,
  )
}
