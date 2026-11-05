import { lazy, Suspense, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useI18n } from '../i18n/I18nProvider'
import { ParallaxComponent } from '@/components/ui/parallax-scrolling'
import { BrowserFragment, CodeFragment, DiscordFragment, GameFragment } from '../components/Fragments'
import { Arrow } from './Hero'
import { projectsState } from '../three/projectsState'
import type { Project } from '../i18n/content'

const ProjectsScene = lazy(() => import('../three/ProjectsScene'))

// Cada proyecto tiene su campo de color; el texto se adapta
const fields: Record<Project['id'], { bg: string; tone: 'dark' | 'light' }> = {
  tricapi: { bg: '#f3efe7', tone: 'dark' },
  twobones: { bg: '#ff5a1f', tone: 'dark' },
  web: { bg: '#2340ff', tone: 'light' },
  bots: { bg: '#c8f03c', tone: 'dark' },
}

function Fragment({ id, play }: { id: Project['id']; play: boolean }) {
  if (id === 'tricapi') return <BrowserFragment domain="tricapi.com" word="tricapi" logo="/images/tricapi-logo.webp" />
  if (id === 'twobones') return <GameFragment play={play} />
  if (id === 'web') return <CodeFragment play={play} />
  return <DiscordFragment play={play} />
}

// Cada proyecto se queda quieto un rato antes de que suba el siguiente
function hold(raw: number, last: number) {
  const k = Math.min(Math.floor(raw), last)
  const f = raw - k
  const t = Math.min(Math.max((f - 0.2) / 0.6, 0), 1)
  return Math.min(k + t * t * (3 - 2 * t), last)
}

/** Cortina: el panel sube desde abajo recortado con clip-path y el anterior se hunde un poco. */
function useCurtain(index: MotionValue<number>, i: number) {
  const reveal = useTransform(index, v => (i === 0 ? 1 : Math.min(Math.max(v - (i - 1), 0), 1)))
  const leave = useTransform(index, v => Math.min(Math.max(v - i, 0), 1))
  const clipPath = useTransform(reveal, r => `inset(${(1 - r) * 100}% 0 0 0)`)
  // El texto además se recorta por abajo cuando sube la cortina siguiente, así no queda encima
  const textClip = useTransform([reveal, leave], ([r, l]: number[]) => `inset(${(1 - r) * 100}% 0 ${l * 100}% 0)`)
  const y = useTransform([reveal, leave], ([r, l]: number[]) => `${(1 - r) * 18 - l * 8}vh`)
  const scale = useTransform(leave, l => 1 - l * 0.06)
  return { clipPath, textClip, y, scale }
}

function Panel({ p, i, index, active }: { p: Project; i: number; index: MotionValue<number>; active: boolean }) {
  const { t } = useI18n()
  const { clipPath, textClip, y, scale } = useCurtain(index, i)
  const field = fields[p.id]
  return (
    <>
      <motion.div className="curtain-bg" style={{ clipPath, background: field.bg, zIndex: i }} aria-hidden />
      <motion.div className={`curtain-text tone-${field.tone}`} style={{ clipPath: textClip, zIndex: 10 + i }} aria-hidden={!active}>
        <motion.div className="curtain-inner" style={{ y, scale }}>
          <div className="panel-text">
            <p className="project-kind">{p.kind}</p>
            <h3 className="panel-title">{p.title}</h3>
            <p className="panel-desc">{p.description}</p>
            <p className="project-stack">{p.stack}</p>
            {p.url ? (
              <a className="link-arrow" href={p.url} target="_blank" rel="noopener noreferrer" tabIndex={active ? 0 : -1} data-cursor={t.projects.visit}>
                {t.projects.visit} {p.title} <Arrow />
              </a>
            ) : p.id === 'twobones' ? <span className="project-soon">{t.projects.soon}</span> : null}
          </div>
          <div className="panel-fragment"><Fragment id={p.id} play={active} /></div>
        </motion.div>
      </motion.div>
    </>
  )
}

export default function Projects() {
  const { t } = useI18n()
  const items = t.projects.items
  const last = items.length - 1
  const track = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] })
  const index = useTransform(scrollYProgress, p => hold(p * last, last))
  const [active, setActive] = useState(0)

  useMotionValueEvent(index, 'change', i => {
    projectsState.progress = i
    setActive(Math.round(i))
  })

  return (
    <section id="projects" className="projects">
      <ParallaxComponent
        title={t.projects.title}
        subtitle={t.projects.lead}
        image="/images/saturn-2000.webp"
        imageSrcSet="/images/saturn-1000.webp 1000w, /images/saturn-2000.webp 2000w"
        imageAlt={t.projects.parallaxAlt}
      />
      <div ref={track} className="stack" style={{ height: `${items.length * 100}vh` }}>
        <div className="stack-sticky">
          {items.map((p, i) => <Panel key={p.id} p={p} i={i} index={index} active={active === i} />)}
          <div className="stack-canvas"><Suspense fallback={null}><ProjectsScene /></Suspense></div>
        </div>
      </div>
    </section>
  )
}
