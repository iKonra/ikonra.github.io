import { useEffect } from 'react'
import { track, trackOnce } from '../lib/analytics'
import { exploreFlag, pilotFlag, soundFlag } from '../lib/flags'
import { getTier } from '../lib/perf'
import { onTick } from '../lib/ticker'
import { dictionaries } from '../i18n/content'
import { J, T, layout } from '../universe/state'

// Qué se mide (todo anónimo):
//   · Hasta dónde llega cada visita en el viaje. Una etapa cuenta solo si la persona se quedó un momento ahí:
//     un salto con el menú que pasa volando por todo no infla el embudo.
//   · Clics de contacto (y desde qué parte del sitio), descargas del CV, visitas a los proyectos y uso del menú.
//   · Herramientas de la consola, juegos, idioma (en sus componentes).
//   · Salud del 3D: cuánto tarda en estar listo, en qué nivel corre y si falla.

const projectNames: Record<string, string> = { tricapi: 'Tricapi', inti: 'Freelance Inti', web: 'Desarrollo web', twobones: 'TwoBones', bots: 'Discord Bots' }

type Stage = { name: string; from: number; to: number; dwell: number; loop?: boolean }

/** Etapas en orden, numeradas para que el embudo de Umami se lea de arriba a abajo. */
function stages(): Stage[] {
  const list: Omit<Stage, 'name'>[] = []
  const names: string[] = []
  const add = (name: string, from: number, to: number, dwell = 0.8, loop = false) => { names.push(name); list.push({ from, to, dwell, loop }) }
  add('Sobre mí', T.about, T.aboutEnd + 0.1)
  add('Proyectos', T.hole, T.horizon + 0.2)
  dictionaries.es.projects.items.forEach((p, i) => add(projectNames[p.id] ?? p.title, T.worlds + i - 0.3, T.worlds + i + 0.3, 1.2))
  add('Stack', T.stack, T.stackEnd + 0.2)
  add('Trayectoria', T.journey, T.journeyEnd + 0.2)
  add('Contacto', T.contact - 0.3, T.contact + 0.3)
  add('Ciudad', 15, 16.9, 0.8, true)
  add('Habitación', 16.9, 18.35, 0.8, true)
  add('Píxel', 18.35, 19.2, 0.6, true)
  return list.map((s, i) => ({ ...s, name: `Viaje ${String(i + 1).padStart(2, '0')} · ${names[i]}` }))
}

function watchJourney() {
  const list = stages()
  const time = list.map(() => 0)
  const done = list.map(() => false)
  const loopName = `Viaje ${String(list.length + 1).padStart(2, '0')} · Vuelta completa`
  let off: (() => void) | null = null
  off = onTick((t, dt) => {
    list.forEach((s, i) => {
      if (done[i] || t < s.from || t > s.to || (s.loop && !layout.loop)) return
      time[i] += dt
      if (time[i] >= s.dwell) { done[i] = true; track(s.name) }
    })
    if (J.loops > 0) { trackOnce(loopName); off?.(); off = null }
  })
  return () => off?.()
}

const sections: Record<string, string> = { top: 'Inicio', about: 'Sobre mí', projects: 'Proyectos', stack: 'Stack', journey: 'Trayectoria', contact: 'Contacto' }

/** Un solo listener para todos los enlaces del sitio: no hace falta tocar cada botón. */
function watchClicks() {
  const on = (e: MouseEvent) => {
    const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href]')
    if (!a) return
    const href = a.getAttribute('href') ?? ''
    const from = a.closest('nav, header') ? 'menú' : a.closest('section')?.id === 'descent' ? 'final' : sections[a.closest('section')?.id ?? ''] ?? 'otro'
    if (href.startsWith('#')) {
      const to = sections[href.slice(1)]
      if (to) track(`Ir a · ${to}`)
      return
    }
    if (href.startsWith('mailto:')) return track('Contacto · Email', { desde: from })
    if (/\.pdf($|\?)/.test(href)) return track('Descarga CV', { desde: from })
    let host = ''
    try { host = new URL(href, location.href).hostname.replace(/^www\./, '') } catch { return }
    if (host === location.hostname) return
    if (host.endsWith('linkedin.com')) return track('Contacto · LinkedIn', { desde: from })
    if (host.endsWith('github.com')) return track('Contacto · GitHub', { desde: from })
    if (host.endsWith('tricapi.com')) return track('Visita · Tricapi')
    if (host.endsWith('top.gg')) return track('Visita · Discord Bots')
    track(`Visita · ${host}`)
  }
  document.addEventListener('click', on, true)
  return () => document.removeEventListener('click', on, true)
}

function watchTools() {
  const pairs: [typeof pilotFlag, string][] = [[pilotFlag, 'Consola · Piloto automático'], [soundFlag, 'Consola · Sonido'], [exploreFlag, 'Consola · Modo explorar']]
  const offs = pairs.map(([f, name]) => f.subscribe(() => { if (f.get()) trackOnce(name) }))
  return () => offs.forEach(o => o())
}

const bucket = (s: number) => (s < 2 ? 'menos de 2 s' : s < 4 ? '2–4 s' : s < 8 ? '4–8 s' : s < 15 ? '8–15 s' : 'más de 15 s')
const levels = ['completo', 'liviano', 'quieto']

/** Cuánto tarda el 3D en poder dibujarse (desde que se abrió la página) y en qué nivel corre en equipos reales. */
function watchHealth() {
  let hidden = document.hidden
  const vis = () => { if (document.hidden) hidden = true }
  document.addEventListener('visibilitychange', vis)
  const start = performance.now()
  const offTick = onTick(() => {
    if (!J.warm) {
      if (performance.now() - start > 20000 && !hidden) { trackOnce('3D · Tarda más de 20 s'); offTick() }
      return
    }
    // con la pestaña en segundo plano el navegador frena todo: ese tiempo no dice nada del equipo
    trackOnce('3D · Listo', { tiempo: hidden ? 'pestaña oculta' : bucket(performance.now() / 1000), nivel: levels[getTier()] })
    offTick()
  })
  const lite = () => trackOnce('3D · Bajó a modo liviano')
  const lost = () => trackOnce('3D · Contexto WebGL perdido')
  // solo errores del propio sitio (no de extensiones del navegador), y solo el primero de cada visita
  const error = (e: ErrorEvent) => { if (e.filename?.startsWith(location.origin)) trackOnce('Error JS', { mensaje: String(e.message).slice(0, 120) }) }
  addEventListener('perf:lite', lite)
  addEventListener('webglcontextlost', lost, true)
  addEventListener('error', error)
  return () => {
    offTick()
    document.removeEventListener('visibilitychange', vis)
    removeEventListener('perf:lite', lite)
    removeEventListener('webglcontextlost', lost, true)
    removeEventListener('error', error)
  }
}

export function useAnalytics() {
  useEffect(() => {
    const offs = [watchJourney(), watchClicks(), watchTools(), watchHealth()]
    return () => offs.forEach(o => o())
  }, [])
}
