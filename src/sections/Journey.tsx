import { motion, useMotionValue, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef } from 'react'
import { useI18n } from '../i18n/I18nProvider'
import { Heading } from '../components/motion'

type RowProps = { when: string; title: string; text: string }

/** Cada título se rellena de izquierda a derecha mientras cruza la pantalla. */
function Row({ when, title, text }: RowProps) {
  const ref = useRef<HTMLLIElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 88%', 'start 30%'] })
  const fill = useTransform(scrollYProgress, p => `inset(-10% ${(1 - p) * 100}% -10% 0)`)
  const detail = useTransform(scrollYProgress, [0.55, 1], [0, 1])
  const detailY = useTransform(scrollYProgress, [0.55, 1], [16, 0])
  const skew = useTransform(scrollYProgress, [0, 1], [-6, 0])
  const x = useTransform(scrollYProgress, [0, 1], ['4vw', '0vw'])

  return (
    <li ref={ref} className="row">
      <motion.p className="row-when" style={{ opacity: detail }}>{when}</motion.p>
      <motion.h3 className="row-title" style={{ skewX: skew, x }}>
        <span className="row-ghost" aria-hidden>{title}</span>
        <motion.span className="row-fill" style={{ clipPath: fill }}>{title}</motion.span>
      </motion.h3>
      <motion.p className="row-text" style={{ opacity: detail, y: detailY }}>{text}</motion.p>
    </li>
  )
}

/** Con "reducir movimiento": el título ya lleno y el texto a la vista. */
function StaticRow({ when, title, text }: RowProps) {
  return (
    <li className="row">
      <p className="row-when">{when}</p>
      <h3 className="row-title"><span className="row-fill row-fill-static">{title}</span></h3>
      <p className="row-text">{text}</p>
    </li>
  )
}

// Constelación de la trayectoria: una estrella por etapa, unidas por una línea que se dibuja al avanzar.
const xs = [26, 74, 38, 82, 50]

function Star({ i, n, progress }: { i: number; n: number; progress: MotionValue<number> | null }) {
  const at = (i + 0.06) / n
  const done = useMotionValue(1)
  const own = useTransform(progress ?? done, [at - 0.04, at + 0.03], [0.25, 1])
  return <motion.i className="constellation-star" style={{ left: `${xs[i % xs.length]}%`, top: `${at * 100}%`, opacity: own, scale: own }} />
}

function Constellation({ n, progress }: { n: number; progress: MotionValue<number> | null }) {
  const points = Array.from({ length: n }, (_, i) => `${xs[i % xs.length]} ${((i + 0.06) / n) * 100}`)
  const d = `M ${points.join(' L ')}`
  const done = useMotionValue(1)
  // se recorta en vez de usar pathLength: con vector-effect los guiones se miden en otra escala y la línea sale cortada
  const clipPath = useTransform(progress ?? done, p => `inset(0 -30px ${((1 - Math.min(Math.max(p, 0), 1)) * 100).toFixed(2)}% -30px)`)
  return (
    <div className="constellation" aria-hidden>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d={d} className="constellation-ghost" /></svg>
      <motion.svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ clipPath }}><path d={d} className="constellation-line" /></motion.svg>
      {points.map((_, i) => <Star key={i} i={i} n={n} progress={progress} />)}
    </div>
  )
}

export default function Journey() {
  const { t } = useI18n()
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 62%', 'end 62%'] })
  const RowView = reduce ? StaticRow : Row
  return (
    <section id="journey" className="section journey">
      <Heading text={t.journey.title} className="section-title" />
      <div ref={ref} className="rows-wrap">
        <Constellation n={t.journey.items.length} progress={reduce ? null : scrollYProgress} />
        <ol className="rows">
          {t.journey.items.map(it => <RowView key={it.title} {...it} />)}
        </ol>
      </div>
    </section>
  )
}
