import { useRef, useState, type CSSProperties } from 'react'
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useI18n } from '../i18n/I18nProvider'
import { CodeFragment, DiscordFragment, GameFragment } from '../components/Fragments'
import { GameCard, Metrics } from '../components/ProjectExtras'
import { Arrow } from './Hero'
import { isLite } from '../lib/perf'
import { hold, smooth, worldColors } from '../universe/state'
import type { Project } from '../i18n/content'

const withFragment: Project['id'][] = ['twobones', 'web', 'bots']

function Fragment({ id, play }: { id: Project['id']; play: boolean }) {
  if (!withFragment.includes(id)) return null
  return (
    <div className="panel-fragment">
      {id === 'twobones' ? <GameFragment play={play} /> : id === 'web' ? <CodeFragment play={play} /> : <DiscordFragment play={play} />}
    </div>
  )
}

/** Ficha de un proyecto: la misma en la versión con vuelo y en la estática. */
function Card({ p, i, total, active }: { p: Project; i: number; total: number; active: boolean }) {
  const { t } = useI18n()
  return (
    <div className="hud-card" style={{ '--accent': worldColors[i] } as CSSProperties}>
      <p className="panel-kicker">
        <span className="panel-num" aria-hidden>{String(i + 1).padStart(2, '0')}<i>/{String(total).padStart(2, '0')}</i></span>
        <span className="project-kind">{p.kind}{p.period && <span className="project-period"> · {p.period}</span>}</span>
      </p>
      <h3 className="panel-title">{p.title}</h3>
      <p className="panel-desc">{p.description}</p>
      {p.features && (
        <ul className="panel-features">
          {p.features.map(f => <li key={f}>{f}</li>)}
        </ul>
      )}
      {p.metrics && <Metrics items={p.metrics} play={active} />}
      {p.game && <GameCard data={p.game} />}
      <Fragment id={p.id} play={active} />
      {p.stack && <p className="project-stack">{p.stack}</p>}
      {p.url ? (
        <a className="link-arrow" href={p.url} target="_blank" rel="noopener noreferrer">
          {t.projects.visit} {p.title} <Arrow />
        </a>
      ) : p.id === 'twobones' ? <span className="project-soon">{t.projects.soon}</span> : null}
    </div>
  )
}

type PanelProps = { p: Project; i: number; total: number; index: MotionValue<number>; enter: MotionValue<number>; active: boolean; soft: boolean }

/** Cada ficha llega desde el fondo y, al irse, pasa de largo hacia la cámara. La primera espera a que se llegue al primer mundo. */
function Panel({ p, i, total, index, enter, active, soft }: PanelProps) {
  const gate = (e: number) => (i === 0 ? smooth(0.82, 1, e) : 1)
  const opacity = useTransform([index, enter], ([x, e]: number[]) => (1 - smooth(0.1, 0.4, Math.abs(x - i))) * gate(e))
  const scale = useTransform(index, x => { const d = Math.min(Math.max(x - i, -0.6), 0.6); return d < 0 ? 1 + d * 0.22 : 1 + d * 0.42 })
  const y = useTransform(index, x => `${Math.min(Math.max(i - x, -0.6), 0.6) * 12}vh`)
  const filter = useTransform(index, x => { const b = soft ? smooth(0.08, 0.42, Math.abs(x - i)) * 10 : 0; return b > 0.15 ? `blur(${b.toFixed(1)}px)` : 'none' })
  const visibility = useTransform(opacity, o => (o < 0.004 ? 'hidden' : 'visible'))
  return (
    <motion.article className="panel" style={{ opacity, visibility }} inert={!active}>
      <motion.div className="panel-inner" style={{ scale, y, filter }}>
        <Card p={p} i={i} total={total} active={active} />
      </motion.div>
    </motion.article>
  )
}

/** Encabezado: el título se dibuja en WebGL, curvado por el agujero negro. Acá queda para lectores de pantalla y para cuando no hay 3D. */
function Head() {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const opacity = useTransform(scrollYProgress, v => (reduce ? 1 : 1 - smooth(0.3, 0.6, v)))
  const y = useTransform(scrollYProgress, [0, 0.6], ['0vh', reduce ? '0vh' : '8vh'])
  return (
    <div id="projects-head" ref={ref} className="ph">
      <motion.div className="ph-sticky" style={{ opacity }}>
        <h2 className="ph-title">{t.projects.title}</h2>
        <motion.p className="ph-lead" style={{ y }}>{t.projects.lead}</motion.p>
      </motion.div>
    </div>
  )
}

function ProjectsFlight() {
  const { t } = useI18n()
  const items = t.projects.items
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
    <section id="projects" className="projects">
      <div className="gap gap-jump" aria-hidden />
      <Head />
      <div className="gap gap-wormhole" aria-hidden />
      <div id="worlds" ref={track} className="worlds" style={{ height: `${items.length * 110}vh` }}>
        <motion.div className="worlds-sticky" style={{ opacity: gone }}>
          {items.map((p, i) => <Panel key={p.id} p={p} i={i} total={items.length} index={index} enter={enter} active={active === i} soft={soft} />)}
        </motion.div>
      </div>
      <div className="gap gap-short" aria-hidden />
    </section>
  )
}

/** Con "reducir movimiento": una lista de fichas, sin pantalla fija ni transiciones. */
function ProjectsStatic() {
  const { t } = useI18n()
  const items = t.projects.items
  return (
    <section id="projects" className="projects">
      <Head />
      <div id="worlds" className="worlds-static">
        {items.map((p, i) => (
          <article key={p.id} className="panel-static">
            <Card p={p} i={i} total={items.length} active />
          </article>
        ))}
      </div>
    </section>
  )
}

export default function Projects() {
  return useReducedMotion() ? <ProjectsStatic /> : <ProjectsFlight />
}
