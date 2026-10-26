import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useRef, useState } from 'react'
import { TextScramble } from '../components/effects'
import { useI18n } from '../i18n/I18nProvider'
import { ease } from '../components/motion'

/** Escena fija: los pasos cambian en el lugar mientras scrolleás. */
export default function Journey() {
  const { t } = useI18n()
  const items = t.journey.items
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [active, setActive] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', p => setActive(Math.min(items.length - 1, Math.floor(p * items.length))))
  const step = items[active]

  return (
    <section id="journey" ref={ref} className="pin journey-pin" style={{ height: `${items.length * 70 + 30}vh` }}>
      <div className="pin-sticky journey-sticky">
        <h2 className="journey-title">{t.journey.title}</h2>
        <ol className="journey-list">
          {items.map((it, i) => (
            <li key={it.title} className={i === active ? 'is-active' : i < active ? 'is-done' : ''}>{it.title}</li>
          ))}
        </ol>
        <div className="journey-stage" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -30, filter: 'blur(8px)', transition: { duration: 0.2 } }}
              transition={{ duration: 0.5, ease: ease.out }}
            >
              <p className="journey-when"><TextScramble text={step.when} /></p>
              <h3 className="journey-step">{step.title}</h3>
              <p className="journey-text">{step.text}</p>
            </motion.div>
          </AnimatePresence>
          <p className="journey-count">{active + 1} / {items.length}</p>
        </div>
      </div>
    </section>
  )
}
