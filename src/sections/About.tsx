import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef } from 'react'
import { useI18n } from '../i18n/I18nProvider'

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const t = useTransform(progress, v => Math.min(Math.max((v - range[0]) / (range[1] - range[0]), 0), 1))
  const opacity = useTransform(t, v => 0.14 + v * 0.86)
  const y = useTransform(t, v => `${(1 - v) * 0.25}em`)
  return <motion.span className="reveal-word" style={{ opacity, y }}>{children}</motion.span>
}

/** Escena fija: la frase se ilumina palabra por palabra mientras scrolleás, y después aparecen los datos. */
export default function About() {
  const { t } = useI18n()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const words = t.about.statement.split(' ')
  const factsOpacity = useTransform(scrollYProgress, [0.68, 0.82], [0, 1])
  const factsY = useTransform(scrollYProgress, [0.68, 0.82], [40, 0])
  const titleX = useTransform(scrollYProgress, [0, 1], ['0%', '-18%'])

  return (
    <section id="about" ref={ref} className="pin about-pin">
      <div className="pin-sticky about-sticky">
        <motion.h2 className="about-ghost" style={{ x: titleX }} aria-hidden>{t.about.title} · {t.about.title} ·</motion.h2>
        <h2 className="sr-only">{t.about.title}</h2>
        <p className="reveal" aria-label={t.about.statement}>
          {words.map((w, i) => {
            const start = (i / words.length) * 0.6
            return <Word key={`${w}-${i}`} progress={scrollYProgress} range={[start, start + 0.6 / words.length + 0.04]}>{w}</Word>
          })}
        </p>
        <motion.dl className="facts-row" style={{ opacity: factsOpacity, y: factsY }}>
          {t.about.facts.map(([k, v]) => (
            <div key={k} className="fact">
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  )
}
