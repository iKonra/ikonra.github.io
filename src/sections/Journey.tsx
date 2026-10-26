import { motion, useScroll, useSpring } from 'motion/react'
import { useRef } from 'react'
import { useI18n } from '../i18n/I18nProvider'
import BlurText from '../components/BlurText'
import Reveal from '../components/Reveal'

export default function Journey() {
  const { t } = useI18n()
  const ref = useRef<HTMLOListElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 60%'] })
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  return (
    <section id="journey" className="section">
      <div className="container narrow">
        <Reveal><p className="kicker">{t.journey.kicker}</p></Reveal>
        <BlurText as="h2" className="section-title" text={t.journey.title} />
        <ol ref={ref} className="timeline">
          <span className="timeline-track" aria-hidden />
          <motion.span className="timeline-fill" style={{ scaleY }} aria-hidden />
          {t.journey.items.map((it, i) => (
            <motion.li
              key={it.title}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-15% 0px' }}
              transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="timeline-dot" />
              <span className="timeline-when">{it.when}</span>
              <h3>{it.title}</h3>
              <p>{it.text}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}
