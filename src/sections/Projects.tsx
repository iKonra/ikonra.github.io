import { lazy, Suspense, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react'
import { useI18n } from '../i18n/I18nProvider'
import { ParallaxComponent } from '@/components/ui/parallax-scrolling'
import { BrowserFragment, CodeFragment, DiscordFragment, GameFragment } from '../components/Fragments'
import { Arrow } from './Hero'
import { projectsState } from '../three/projectsState'
import type { Project } from '../i18n/content'

const ProjectsScene = lazy(() => import('../three/ProjectsScene'))

function Fragment({ id }: { id: Project['id'] }) {
  if (id === 'tricapi') return <BrowserFragment domain="tricapi.com" word="tricapi" />
  if (id === 'twobones') return <GameFragment />
  if (id === 'web') return <CodeFragment />
  return <DiscordFragment />
}

// Cada proyecto se queda quieto un rato antes de pasar al siguiente
function hold(raw: number, last: number) {
  const k = Math.min(Math.floor(raw), last)
  const f = raw - k
  const t = Math.min(Math.max((f - 0.2) / 0.6, 0), 1)
  return Math.min(k + t * t * (3 - 2 * t), last)
}

export default function Projects() {
  const { t } = useI18n()
  const items = t.projects.items
  const last = items.length - 1
  const track = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] })
  const index = useTransform(scrollYProgress, p => hold(p * last, last))
  const x = useTransform(index, i => `${-i * 100}vw`)
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
      <div ref={track} className="hscroll" style={{ height: `${items.length * 100}vh` }}>
        <div className="hscroll-sticky">
          <Suspense fallback={null}><ProjectsScene /></Suspense>
          <motion.ol className="hscroll-track" style={{ x }}>
            {items.map((p, i) => (
              <li key={p.id} className="panel" aria-hidden={active !== i}>
                <div className="panel-text">
                  <p className="project-kind">{p.kind}</p>
                  <h3 className="panel-title">{p.title}</h3>
                  <p className="panel-desc">{p.description}</p>
                  <p className="project-stack">{p.stack}</p>
                  {p.url ? (
                    <a className="link-arrow" href={p.url} target="_blank" rel="noopener noreferrer" tabIndex={active === i ? 0 : -1}>
                      {t.projects.visit} {p.title} <Arrow />
                    </a>
                  ) : p.id === 'twobones' ? <span className="project-soon">{t.projects.soon}</span> : null}
                  <div className="panel-fragment"><Fragment id={p.id} /></div>
                </div>
              </li>
            ))}
          </motion.ol>
          <ol className="hscroll-names" aria-hidden>
            {items.map((p, i) => (
              <li key={p.id} className={active === i ? 'is-active' : ''}>{p.title}</li>
            ))}
          </ol>
          <div className="hscroll-bar"><motion.span style={{ scaleX: scrollYProgress }} /></div>
        </div>
      </div>
    </section>
  )
}
