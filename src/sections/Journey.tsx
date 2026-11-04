import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { useI18n } from '../i18n/I18nProvider'
import { Heading } from '../components/motion'

/** Cada título se rellena de izquierda a derecha mientras cruza la pantalla. */
function Row({ when, title, text }: { when: string; title: string; text: string }) {
  const ref = useRef<HTMLLIElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 88%', 'start 30%'] })
  const fill = useTransform(scrollYProgress, p => `inset(0 ${(1 - p) * 100}% 0 0)`)
  const detail = useTransform(scrollYProgress, [0.55, 1], [0, 1])
  const detailY = useTransform(scrollYProgress, [0.55, 1], [16, 0])
  const skew = useTransform(scrollYProgress, [0, 1], [-6, 0])

  return (
    <li ref={ref} className="row">
      <motion.p className="row-when" style={{ opacity: detail }}>{when}</motion.p>
      <motion.h3 className="row-title" style={{ skewX: skew }}>
        <span className="row-ghost" aria-hidden>{title}</span>
        <motion.span className="row-fill" style={{ clipPath: fill }}>{title}</motion.span>
      </motion.h3>
      <motion.p className="row-text" style={{ opacity: detail, y: detailY }}>{text}</motion.p>
    </li>
  )
}

export default function Journey() {
  const { t } = useI18n()
  return (
    <section id="journey" className="section journey">
      <Heading text={t.journey.title} className="section-title" />
      <ol className="rows">
        {t.journey.items.map(it => <Row key={it.title} {...it} />)}
      </ol>
    </section>
  )
}
