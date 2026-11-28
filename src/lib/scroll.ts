import type Lenis from 'lenis'
import { J, T, layout, scrollToT } from '../universe/state'
import { pilotFlag } from './flags'
import { prefersReducedMotion } from './perf'
import { onTick, shiftTicker } from './ticker'

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
  touched = performance.now()
  let to = Math.min(Math.max(y, 0), layout.max)
  // desde la caída, el camino al inicio es hacia adelante: se cierra el bucle
  if (to === 0 && !instant && layout.loop && scrollToT(scrollY) > T.contact + 0.6) to = layout.max
  if (instant || prefersReducedMotion()) return jump(to)
  const far = Math.abs(scrollToT(to) - scrollToT(scrollY))
  if (lenis) lenis.scrollTo(to, { duration: Math.min(1.1 + far * 0.3, 4.2), easing: inOut, force: true })
  else scrollTo({ top: to, behavior: 'smooth' })
}

/** Dónde frena el viaje para cada sección. */
function stopFor(id: string) {
  if (id === 'top') return 0
  if (id === 'contact') return layout.contact
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

/* ------------------------------------------------------------------ bucle */
let touched = -1e9, raf = 0
const touch = () => { touched = performance.now() }

/** El final de la página es idéntico al inicio: cuando la cámara llega, se vuelve al principio sin que se note.
 *  Solo si alguien venía avanzando: arrastrar la barra de scroll hasta abajo no salta. */
export function watchLoop() {
  const keys = (e: KeyboardEvent) => {
    touch()
    // «Fin» lleva a Contacto: es el final del contenido
    if (e.key === 'End' && layout.loop && !(e.target as Element).closest?.('input, textarea, select')) { e.preventDefault(); travelTo(layout.contact) }
  }
  addEventListener('wheel', touch, { passive: true })
  addEventListener('touchmove', touch, { passive: true })
  addEventListener('keydown', keys)
  const off = onTick(v => {
    if (!layout.loop || J.force !== null || scrollY < layout.max - 3 || v < T.end - 0.015 || J.raw < T.end - 0.015) return
    if (!raf && performance.now() - touched > 5000) return
    jump(0)
    pos = 0
    J.raw = 0
    J.birth = 1
    J.loops++
    shiftTicker(-T.end)
    if (location.hash) history.replaceState(null, '', location.pathname + location.search)
  })
  return () => { off(); removeEventListener('wheel', touch); removeEventListener('touchmove', touch); removeEventListener('keydown', keys) }
}

/* ------------------------------------------------------------------ piloto automático */
let last = 0, pos = 0, ramp = 0

const stopKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Escape']
const onKey = (e: KeyboardEvent) => { if (stopKeys.includes(e.key)) stopPilot() }

function step(time: number) {
  const dt = Math.min((time - (last || time)) / 1000, 0.05)
  last = time
  ramp = Math.min(1, ramp + dt / 1.4)
  const t = scrollToT(pos)
  // más despacio donde hay texto para leer
  const speed = t > 4.95 && t < 9.86 ? 0.15 : t > 1 && t < 2 ? 0.19 : t > 9.9 && t < 13.1 ? 0.17 : t > 15.2 && t < 18.3 ? 0.24 : 0.28
  pos += layout.vh * speed * ramp * dt
  jump(Math.min(pos, layout.max))
  // con el bucle no termina nunca: espera a que la cámara llegue y sigue desde el inicio
  if (pos >= layout.max) { pos = layout.max; if (!layout.loop) return stopPilot() }
  raf = requestAnimationFrame(step)
}

export function startPilot() {
  if (raf) return
  if (!layout.loop && scrollY > layout.max - 8) jump(0)
  pos = scrollY
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
