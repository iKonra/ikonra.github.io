import { useRef, useState, type CSSProperties } from 'react'
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useI18n } from '../i18n/I18nProvider'
import type { Dict } from '../i18n/content'
import { isLite } from '../lib/perf'
import { atlasColors, hold, smooth } from '../universe/state'

type Item = Dict['atlas']['items'][number]
const pad = (n: number) => String(n).padStart(2, '0')

/** Ficha de un objeto del atlas: qué es, en qué estado está la idea, un dato y de dónde salió. */
function Card({ it, i, total }: { it: Item; i: number; total: number }) {
  const { t } = useI18n()
  return (
    <div className="hud-card atlas-card" style={{ '--accent': atlasColors[i] } as CSSProperties}>
      <p className="panel-kicker">
        <span className="panel-num" aria-hidden>{pad(i + 1)}<i>/{pad(total)}</i></span>
        <span className="atlas-tag">{it.tag}</span>
        <span className="atlas-status">{it.status}</span>
      </p>
      <h3 className="panel-title">{it.title}</h3>
      <p className="panel-desc">{it.text}</p>
      <p className="atlas-fact">
        <strong>{it.fact.value}</strong>
        <span>{it.fact.label}</span>
      </p>
      <p className="atlas-origin"><span>{t.atlas.origin}</span> {it.origin}</p>
    </div>
  )
}

type PanelProps = { it: Item; i: number; total: number; index: MotionValue<number>; enter: MotionValue<number>; active: boolean; soft: boolean }

/** Igual que las fichas de proyectos: llega desde el fondo y, al irse, pasa de largo hacia la cámara. */
function Panel({ it, i, total, index, enter, active, soft }: PanelProps) {
  const gate = (e: number) => (i === 0 ? smooth(0.82, 1, e) : 1)
  const opacity = useTransform([index, enter], ([x, e]: number[]) => (1 - smooth(0.1, 0.4, Math.abs(x - i))) * gate(e))
  const scale = useTransform(index, x => { const d = Math.min(Math.max(x - i, -0.6), 0.6); return d < 0 ? 1 + d * 0.22 : 1 + d * 0.42 })
  const y = useTransform(index, x => `${Math.min(Math.max(i - x, -0.6), 0.6) * 12}vh`)
  const filter = useTransform(index, x => { const b = soft ? smooth(0.08, 0.42, Math.abs(x - i)) * 10 : 0; return b > 0.15 ? `blur(${b.toFixed(1)}px)` : 'none' })
  const visibility = useTransform(opacity, o => (o < 0.004 ? 'hidden' : 'visible'))
  return (
    <motion.article className="panel" style={{ opacity, visibility }} inert={!active}>
      <motion.div className="panel-inner" style={{ scale, y, filter }}>
        <Card it={it} i={i} total={total} />
      </motion.div>
    </motion.article>
  )
}

/** Portada: el título sobre el vivero de estrellas, al salir del agujero de gusano. */
function Head() {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const opacity = useTransform(scrollYProgress, v => (reduce ? 1 : 1 - smooth(0.62, 0.95, v)))
  const y = useTransform(scrollYProgress, [0, 0.9], ['0vh', reduce ? '0vh' : '-6vh'])
  return (
    <div id="atlas-head" ref={ref} className="ah">
      <motion.div className="ah-sticky" style={{ opacity }}>
        <p className="ah-kicker">{t.atlas.place} · {pad(t.atlas.items.length)}</p>
        <h2 id="atlas-title" className="ah-title">{t.atlas.title}</h2>
        <motion.p className="ah-lead" style={{ y }}>{t.atlas.lead}</motion.p>
        {!reduce && <p className="ah-hint" aria-hidden>{t.atlas.hint}</p>}
      </motion.div>
    </div>
  )
}

function AtlasFlight() {
  const { t } = useI18n()
  const items = t.atlas.items
  const last = items.length - 1
  const track = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] })
  const { scrollYProgress: enter } = useScroll({ target: track, offset: ['start end', 'start start'] })
  const { scrollYProgress: leave } = useScroll({ target: track, offset: ['end end', 'end start'] })
  const index = useTransform(scrollYProgress, p => hold(p * last, last))
  const gone = useTransform(leave, v => 1 - smooth(0.05, 0.6, v))
  const [active, setActive] = useState(0)
  const [soft] = useState(() => !isLite())
  useMotionValueEvent(index, 'change', i => setActive(Math.round(i)))

  return (
    <section id="atlas" className="atlas" aria-labelledby="atlas-title">
      <div id="atlas-in" className="gap gap-atlas" aria-hidden />
      <Head />
      <div id="atlas-track" ref={track} className="worlds" style={{ height: `${items.length * 110}vh` }}>
        <motion.div className="worlds-sticky" style={{ opacity: gone }}>
          {items.map((it, i) => <Panel key={it.id} it={it} i={i} total={items.length} index={index} enter={enter} active={active === i} soft={soft} />)}
        </motion.div>
      </div>
      <div id="atlas-out" className="gap gap-atlas" aria-hidden />
    </section>
  )
}

/** Con "reducir movimiento": la portada y las ocho fichas en lista. */
function AtlasStatic() {
  const { t } = useI18n()
  const items = t.atlas.items
  return (
    <section id="atlas" className="atlas">
      <Head />
      <div id="atlas-track" className="worlds-static">
        {items.map((it, i) => (
          <article key={it.id} className="panel-static">
            <Card it={it} i={i} total={items.length} />
          </article>
        ))}
      </div>
      <div id="atlas-out" aria-hidden />
    </section>
  )
}

export default function Atlas() {
  return useReducedMotion() ? <AtlasStatic /> : <AtlasFlight />
}
