import type Lenis from 'lenis'
import { layout, scrollToT } from '../universe/state'
import { pilotFlag } from './flags'
import { prefersReducedMotion } from './perf'

// Moverse por la página es viajar: los saltos duran según la distancia, para que se vea el recorrido y no un corte.

let lenis: Lenis | null = null
export const setLenis = (l: Lenis | null) => { lenis = l }

const inOut = (x: number) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2)

function jump(y: number) {
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true })
  else scrollTo({ top: y, behavior: 'instant' })
}

export function travelTo(y: number, instant = false) {
  stopPilot()
  const to = Math.min(Math.max(y, 0), layout.max)
  if (instant || prefersReducedMotion()) return jump(to)
  const far = Math.abs(scrollToT(to) - scrollToT(scrollY))
  if (lenis) lenis.scrollTo(to, { duration: Math.min(1.1 + far * 0.3, 4.2), easing: inOut, force: true })
  else scrollTo({ top: to, behavior: 'smooth' })
}

/** Dónde frena el viaje para cada sección. */
function stopFor(id: string) {
  if (id === 'top') return 0
  const el = document.getElementById(id === 'projects' ? 'projects-head' : id)
  if (!el) return null
  const r = el.getBoundingClientRect()
  const top = r.top + scrollY
  // Sobre mí es una escena fija: se llega cuando la frase ya está iluminada
  if (id === 'about') return top + Math.max(0, r.height - innerHeight) * 0.66
  if (id === 'stack' || id === 'journey') return top - 72
  return top
}

export function travelToId(id: string, instant = false) {
  const y = stopFor(id)
  if (y === null) return false
  travelTo(y, instant)
  return true
}

/** Los enlaces internos viajan en vez de saltar. Se maneja una sola vez para todo el documento. */
export function interceptAnchors() {
  const on = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[href^="#"]')
    if (!a) return
    const id = a.hash.slice(1)
    if (!travelToId(id)) return
    e.preventDefault()
    history.pushState(null, '', a.hash)
    const el = document.getElementById(id)
    if (el) { el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }) }
  }
  document.addEventListener('click', on)
  return () => document.removeEventListener('click', on)
}

/* ------------------------------------------------------------------ piloto automático */
let raf = 0, last = 0, pos = 0, ramp = 0

const stopKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Escape']
const onKey = (e: KeyboardEvent) => { if (stopKeys.includes(e.key)) stopPilot() }

function step(time: number) {
  const dt = Math.min((time - (last || time)) / 1000, 0.05)
  last = time
  ramp = Math.min(1, ramp + dt / 1.4)
  const t = scrollToT(pos)
  // más despacio donde hay texto para leer
  const speed = t > 4.95 && t < 9.1 ? 0.15 : t > 1 && t < 2 ? 0.19 : t > 9.9 && t < 13.1 ? 0.17 : 0.28
  pos += layout.vh * speed * ramp * dt
  jump(Math.min(pos, layout.max))
  if (pos >= layout.max) return stopPilot()
  raf = requestAnimationFrame(step)
}

export function startPilot() {
  if (raf) return
  if (scrollY > layout.max - 8) jump(0)
  pos = scrollY > layout.max - 8 ? 0 : scrollY
  last = 0
  ramp = 0
  addEventListener('wheel', stopPilot, { passive: true })
  addEventListener('touchstart', stopPilot, { passive: true })
  addEventListener('keydown', onKey)
  pilotFlag.set(true)
  raf = requestAnimationFrame(step)
}

export function stopPilot() {
  if (!raf) return
  cancelAnimationFrame(raf)
  raf = 0
  removeEventListener('wheel', stopPilot)
  removeEventListener('touchstart', stopPilot)
  removeEventListener('keydown', onKey)
  pilotFlag.set(false)
}
