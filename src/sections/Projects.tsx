import { motion } from 'motion/react'
import { useI18n } from '../i18n/I18nProvider'
import BlurText from '../components/BlurText'
import Reveal from '../components/Reveal'
import SpotlightCard from '../components/SpotlightCard'
import TiltCard from '../components/TiltCard'
import type { Project } from '../i18n/content'

function Visual({ p }: { p: Project }) {
  return (
    <div className={`visual visual-${p.id}`} style={{ ['--accent' as string]: p.accent }} aria-hidden>
      <span className="orb" />
      <span className="orb orb-2" />
      <span className="visual-grid" />
      <span className="visual-glyph">{glyphs[p.id] ?? '◆'}</span>
    </div>
  )
}

const glyphs: Record<string, string> = { tricapi: '△', twobones: '☠', web: '</>', bots: '⌘' }

export default function Projects() {
  const { t } = useI18n()
  return (
    <section id="projects" className="section">
      <div className="container">
        <Reveal><p className="kicker">{t.projects.kicker}</p></Reveal>
        <BlurText as="h2" className="section-title" text={t.projects.title} />
        <div className="projects">
          {t.projects.items.map((p, i) => (
            <Reveal key={p.id} delay={(i % 2) * 0.1} className={`project-wrap ${i === 0 ? 'featured' : ''}`}>
              <TiltCard className="tilt">
                <SpotlightCard className="project" color={`${p.accent}33`}>
                  <Visual p={p} />
                  <div className="project-body">
                    <span className="project-tag" style={{ color: p.accent }}>{p.tag}</span>
                    <h3>{p.title}</h3>
                    <p>{p.description}</p>
                    <ul className="chips">
                      {p.stack.map(s => <li key={s}>{s}</li>)}
                    </ul>
                    {p.url ? (
                      <motion.a
                        className="project-link"
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ x: 4 }}
                      >
                        {t.projects.visit} <span aria-hidden>↗</span>
                      </motion.a>
                    ) : p.id === 'twobones' ? (
                      <span className="project-soon">{t.projects.soon}</span>
                    ) : null}
                  </div>
                </SpotlightCard>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
