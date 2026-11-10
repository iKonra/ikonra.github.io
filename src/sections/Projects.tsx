import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useI18n } from '../i18n/I18nProvider'
import { ParallaxComponent } from '@/components/ui/parallax-scrolling'
import { CodeFragment, DiscordFragment, GameFragment } from '../components/Fragments'
import { Featured, GameCard, Metrics } from '../components/ProjectExtras'
import { Arrow } from './Hero'
import { projectsState } from '../three/projectsState'
import type { Project } from '../i18n/content'

const ProjectsScene = lazy(() => import('../three/ProjectsScene'))
const NAV_HEIGHT = 64

// Cada proyecto tiene su campo de color; el texto se adapta
const fields: Record<Project['id'], { bg: string; tone: 'dark' | 'light' }> = {
  tricapi: { bg: '#f3efe7', tone: 'dark' },
  inti: { bg: '#0f7a5c', tone: 'light' },
  twobones: { bg: '#ff5a1f', tone: 'dark' },
  web: { bg: '#2340ff', tone: 'light' },
  bots: { bg: '#c8f03c', tone: 'dark' },
}

function Fragment({ id, play }: { id: Project['id']; play: boolean }) {
  if (id === 'twobones') return <GameFragment play={play} />
  if (id === 'web') return <CodeFragment play={play} />
  return <DiscordFragment play={play} />
}

/** Texto de un proyecto: el mismo en la versión con cortinas y en la estática (sin animaciones). */
function PanelBody({ p, active }: { p: Project; active: boolean }) {
  const { t } = useI18n()
  return (
    <div className="panel-text">
      <p className="project-kind">{p.kind}{p.period && <span className="project-period"> · {p.period}</span>}</p>
      <h3 className="panel-title">{p.title}</h3>
      <p className="panel-desc">{p.description}</p>
      {p.features && (
        <ul className="panel-features">
          {p.features.map(f => <li key={f}>{f}</li>)}
        </ul>
      )}
      {p.metrics && <Metrics items={p.metrics} play={active} />}
      {p.featured && <Featured data={p.featured} />}
      {p.game && <GameCard data={p.game} />}
      {p.stack && <p className="project-stack">{p.stack}</p>}
      {p.url ? (
        <a className="link-arrow" href={p.url} target="_blank" rel="noopener noreferrer" tabIndex={active ? 0 : -1} data-cursor={t.projects.visit}>
          {t.projects.visit} {p.title} <Arrow />
        </a>
      ) : p.id === 'twobones' ? <span className="project-soon">{t.projects.soon}</span> : null}
    </div>
  )
}

const withFragment: Project['id'][] = ['twobones', 'web', 'bots']

function PanelFragment({ id, play }: { id: Project['id']; play: boolean }) {
  if (!withFragment.includes(id)) return null
  return <div className="panel-fragment"><Fragment id={id} play={play} /></div>
}

// Cada proyecto se queda quieto un rato antes de que suba el siguiente
function hold(raw: number, last: number) {
  const k = Math.min(Math.floor(raw), last)
  const f = raw - k
  const t = Math.min(Math.max((f - 0.2) / 0.6, 0), 1)
  return Math.min(k + t * t * (3 - 2 * t), last)
}

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(Math.max((v - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}

/** Cortina: el panel sube desde abajo recortado con clip-path y el anterior se hunde un poco. */
function useCurtain(index: MotionValue<number>, i: number) {
  const reveal = useTransform(index, v => (i === 0 ? 1 : Math.min(Math.max(v - (i - 1), 0), 1)))
  const leave = useTransform(index, v => Math.min(Math.max(v - i, 0), 1))
  const clipPath = useTransform(reveal, r => `inset(${(1 - r) * 100}% 0 0 0)`)
  // El texto además se recorta por abajo cuando sube la cortina siguiente, así no queda encima
  const textClip = useTransform([reveal, leave], ([r, l]: number[]) => `inset(${(1 - r) * 100}% 0 ${l * 100}% 0)`)
  // El texto saliente se apaga (primer 40 % de la transición) antes de que aparezca el entrante (último 45 %):
  // los dos títulos gigantes nunca se ven a la vez, solo la cortina de color.
  const opacity = useTransform([reveal, leave], ([r, l]: number[]) => Math.min(smooth(0.55, 0.9, r), 1 - smooth(0, 0.4, l)))
  const y = useTransform([reveal, leave], ([r, l]: number[]) => `${(1 - r) * 18 - l * 8}vh`)
  const scale = useTransform(leave, l => 1 - l * 0.06)
  return { clipPath, textClip, opacity, y, scale }
}

function Panel({ p, i, index, active }: { p: Project; i: number; index: MotionValue<number>; active: boolean }) {
  const { clipPath, textClip, opacity, y, scale } = useCurtain(index, i)
  const field = fields[p.id]
  return (
    <>
      <motion.div className="curtain-bg" style={{ clipPath, background: field.bg, zIndex: i }} aria-hidden />
      <motion.div className={`curtain-text tone-${field.tone}`} style={{ clipPath: textClip, opacity, zIndex: 10 + i }} aria-hidden={!active}>
        <motion.div className="curtain-inner" style={{ y, scale }}>
          <PanelBody p={p} active={active} />
          <PanelFragment id={p.id} play={active} />
        </motion.div>
      </motion.div>
    </>
  )
}

function Header() {
  const { t } = useI18n()
  return (
    <ParallaxComponent
      title={t.projects.title}
      subtitle={t.projects.lead}
      image="/images/saturn-2000.webp"
      imageSrcSet="/images/saturn-1000.webp 1000w, /images/saturn-2000.webp 2000w"
      imageAlt={t.projects.parallaxAlt}
    />
  )
}

function ProjectsPinned() {
  const { t } = useI18n()
  const items = t.projects.items
  const last = items.length - 1
  const track = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] })
  const index = useTransform(scrollYProgress, p => hold(p * last, last))
  const [active, setActive] = useState(0)
  // El canvas 3D (contexto WebGL, reflejos, shaders) es lo más caro de crear: se monta cuando el navegador queda libre
  // un rato después de la carga, no a mitad de un scroll. Si el usuario llega antes a la sección, se monta en ese momento.
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = track.current
    if (!el) return
    const mount = () => setReady(true)
    const ric = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 2000))
    const cancel = window.cancelIdleCallback ?? clearTimeout
    const id = ric(mount, { timeout: 3500 })
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) mount() }, { rootMargin: '100% 0px' })
    io.observe(el)
    return () => { cancel(id); io.disconnect() }
  }, [])

  useMotionValueEvent(index, 'change', i => {
    projectsState.progress = i
    setActive(Math.round(i))
  })

  // En celular el texto va abajo y el modelo 3D arriba: medimos cuánto lugar queda libre sobre el texto de cada panel
  useEffect(() => {
    const el = track.current
    if (!el) return
    const measure = () => {
      projectsState.rooms = [...el.querySelectorAll<HTMLElement>('.panel-text')].map(t => Math.max(0, t.offsetTop - NAV_HEIGHT - 12))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    document.fonts?.ready.then(measure)
    return () => ro.disconnect()
  }, [items])

  return (
    <section id="projects" className="projects">
      <Header />
      <div ref={track} className="stack" style={{ height: `${items.length * 100}vh` }}>
        <div className="stack-sticky">
          {items.map((p, i) => <Panel key={p.id} p={p} i={i} index={index} active={active === i} />)}
          <div className="stack-canvas">{ready && <Suspense fallback={null}><ProjectsScene /></Suspense>}</div>
        </div>
      </div>
    </section>
  )
}

/** Con "reducir movimiento": una lista de bloques de color, sin cortinas, sin pantalla fija y sin 3D. */
function ProjectsStatic() {
  const { t } = useI18n()
  return (
    <section id="projects" className="projects">
      <Header />
      <div className="stack-static">
        {t.projects.items.map(p => {
          const field = fields[p.id]
          return (
            <article key={p.id} className={`project-static tone-${field.tone}`} style={{ background: field.bg }}>
              <div className="curtain-inner">
                <PanelBody p={p} active />
                <PanelFragment id={p.id} play />
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default function Projects() {
  return useReducedMotion() ? <ProjectsStatic /> : <ProjectsPinned />
}
