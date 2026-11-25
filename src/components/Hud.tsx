import { X } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { useI18n } from '../i18n/I18nProvider'
import { exploreFlag } from '../lib/flags'
import { interceptAnchors, travelTo, travelToId } from '../lib/scroll'
import { useTicker } from '../lib/ticker'
import { J, T, beacon, layout, tToScroll, watchLayout } from '../universe/state'
import Readout from './Readout'
import Tools from './Tools'

const ABOUT_STOP = 1.7
/** t de cada parada de la ruta, en orden. */
const stops = [T.top, ABOUT_STOP, T.hole, 5, 6, 7, 8, 9, T.stack, T.journey, T.contact] as const

/** Ruta del viaje: una estrella por parada y una nave que avanza. */
function Rail() {
  const { t } = useI18n()
  const [active, setActive] = useState(0)
  const fill = useRef<HTMLSpanElement>(null)
  const h = t.hud.places
  const labels: [string, string][] = [
    [t.hero.name, h.galaxy],
    [t.nav.about, h.nebula],
    [t.nav.projects, h.hole],
    ...t.projects.items.map((p, i): [string, string] => [p.title, `${t.nav.projects} ${i + 1}/${t.projects.items.length}`]),
    [t.nav.stack, h.belt],
    [t.nav.journey, h.saturn],
    [t.nav.contact, h.earth],
  ]

  useTicker(v => {
    let i = 0
    while (i < stops.length - 2 && v > stops[i + 1]) i++
    const f = Math.min(Math.max((v - stops[i]) / (stops[i + 1] - stops[i]), 0), 1)
    fill.current?.style.setProperty('--p', String((i + f) / (stops.length - 1)))
    setActive(f > 0.5 ? i + 1 : i)
  })

  return (
    <nav className="rail" aria-label={t.hud.route} data-ui>
      <span className="rail-line" ref={fill} aria-hidden><i /><b /></span>
      <ol>
        {stops.map((s, i) => (
          <li key={s}>
            <button
              className="rail-stop"
              aria-current={active === i ? 'step' : undefined}
              onClick={() => travelTo(s === T.top ? 0 : s === T.contact ? layout.max : tToScroll(s))}
            >
              <span className="rail-star" aria-hidden />
              <span className="rail-label"><strong>{labels[i][0]}</strong><em>{labels[i][1]}</em></span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}

/** Consola inferior: lugar, distancia y controles. La línea de arriba marca el avance del viaje. */
function Console() {
  const bar = useRef<HTMLSpanElement>(null)
  useTicker(v => { if (bar.current) bar.current.style.transform = `scaleX(${v / T.contact})` })
  return (
    <div className="console" data-ui>
      <span className="console-bar" aria-hidden><span ref={bar} /></span>
      <Readout />
      <Tools />
    </div>
  )
}

/** Etiqueta de la baliza sobre la Tierra: sigue al punto que calcula la escena. */
function Beacon() {
  const { t } = useI18n()
  const ref = useRef<HTMLSpanElement>(null)
  useTicker(() => {
    const el = ref.current
    if (!el) return
    el.style.opacity = String(beacon.k)
    if (beacon.k > 0.01) el.style.transform = `translate3d(${beacon.x.toFixed(1)}px, ${beacon.y.toFixed(1)}px, 0)`
  })
  return <span ref={ref} className="beacon" aria-hidden><span>{t.hud.beacon}</span></span>
}

/** Modo explorar: se esconde la interfaz y la cámara gira libre alrededor de lo que haya enfrente. */
function Explore() {
  const { t } = useI18n()
  const on = exploreFlag.use()
  const exit = useRef<HTMLButtonElement>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    J.explore = on
    document.documentElement.classList.toggle('exploring', on)
    if (!on) return
    const back = document.activeElement as HTMLElement | null
    exit.current?.focus({ preventScroll: true })
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exploreFlag.set(false)
      else if (e.key === 'ArrowLeft') J.yawT += 0.22
      else if (e.key === 'ArrowRight') J.yawT -= 0.22
    }
    addEventListener('keydown', key)
    return () => { removeEventListener('keydown', key); back?.focus?.({ preventScroll: true }) }
  }, [on])

  if (!on) return null
  const down = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = { x: e.clientX, y: e.clientY }
    if (e.pointerType === 'mouse') e.currentTarget.setPointerCapture(e.pointerId)
  }
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    const k = e.pointerType === 'mouse' ? 0.0045 : 0.008
    J.yawT -= (e.clientX - d.x) * k
    J.pitchT = Math.min(Math.max(J.pitchT - (e.clientY - d.y) * k * 0.8, -1.1), 1.1)
    d.x = e.clientX
    d.y = e.clientY
  }
  const up = () => { drag.current = null }
  return (
    <>
      <div className="explore-pad" data-ui onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
      <div className="explore-bar" data-ui>
        <span>{t.hud.hint}</span>
        <button ref={exit} onClick={() => exploreFlag.set(false)}><X size={16} aria-hidden /> {t.hud.exit}</button>
      </div>
    </>
  )
}

export default function Hud() {
  useEffect(() => {
    const unwatch = watchLayout()
    const release = interceptAnchors()
    const id = location.hash.slice(1)
    const raf = id ? requestAnimationFrame(() => { travelToId(id, true) }) : 0
    return () => { unwatch(); release(); cancelAnimationFrame(raf) }
  }, [])
  return (
    <>
      <Beacon />
      <Rail />
      <Console />
      <Explore />
    </>
  )
}
