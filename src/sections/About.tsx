import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useI18n } from '../i18n/I18nProvider'
import BlurText from '../components/BlurText'
import CountUp from '../components/CountUp'
import Reveal from '../components/Reveal'
import SpotlightCard from '../components/SpotlightCard'

export default function About() {
  const { t } = useI18n()
  const [idea, setIdea] = useState<number | null>(null)
  const [clicks, setClicks] = useState(0)

  const getBored = () => {
    const n = t.about.boredIdeas.length
    setIdea(prev => {
      let next = Math.floor(Math.random() * n)
      if (next === prev) next = (next + 1) % n
      return next
    })
    setClicks(c => c + 1)
  }

  return (
    <section id="about" className="section">
      <div className="container">
        <Reveal><p className="kicker">{t.about.kicker}</p></Reveal>
        <BlurText as="h2" className="section-title" text={t.about.title} />
        <div className="bento">
          <SpotlightCard className="bento-main">
            {t.about.body.map((p, i) => (
              <Reveal key={i} delay={i * 0.1}><p className="about-text">{p}</p></Reveal>
            ))}
          </SpotlightCard>
          {t.about.stats.map((s, i) => (
            <Reveal key={i} delay={0.1 + i * 0.08} className="bento-stat-wrap">
              <SpotlightCard className="bento-stat">
                <span className="stat-value"><CountUp to={s.value} suffix={s.suffix} /></span>
                <span className="stat-label">{s.label}</span>
              </SpotlightCard>
            </Reveal>
          ))}
          <Reveal delay={0.2} className="bento-bored-wrap">
            <SpotlightCard className="bento-bored" color="rgba(94, 242, 255, 0.18)">
              <p className="bored-title">{t.about.boredTitle}</p>
              <div className="bored-row">
                <motion.button
                  className="btn btn-primary"
                  onClick={getBored}
                  whileTap={{ scale: 0.92 }}
                  whileHover={{ scale: 1.04 }}
                >
                  {t.about.boredButton} {clicks > 0 && <span className="bored-count">×{clicks}</span>}
                </motion.button>
                <div className="bored-idea" aria-live="polite">
                  <AnimatePresence mode="wait">
                    {idea !== null && (
                      <motion.span
                        key={`${idea}-${clicks}`}
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                      >
                        → {t.about.boredIdeas[idea]}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </SpotlightCard>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
