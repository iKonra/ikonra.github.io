import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef } from 'react'
import { useI18n } from '../i18n/I18nProvider'

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const t = useTransform(progress, v => Math.min(Math.max((v - range[0]) / (range[1] - range[0]), 0), 1))
  const opacity = useTransform(t, v => 0.16 + v * 0.84)
  const y = useTransform(t, v => `${(1 - v) * 0.25}em`)
  return <motion.span className="reveal-word" style={{ opacity, y }}>{children}</motion.span>
}

/** Un dato: su estrella se enciende cuando la línea de la constelación llega a ella. */
function Fact({ k, v, at, progress }: { k: string; v: string; at: number; progress: MotionValue<number> }) {
  const on = useTransform(progress, [at, at + 0.06], [0, 1])
  const y = useTransform(on, [0, 1], [22, 0])
  return (
    <motion.div className="fact" style={{ opacity: on, y }}>
      <motion.span className="fact-star" style={{ scale: on }} aria-hidden />
      <dt>{k}</dt>
      <dd>{v}</dd>
    </motion.div>
  )
}

/** Escena fija: la frase se ilumina palabra por palabra mientras se atraviesa la nebulosa, y después aparecen los datos. */
function AboutPinned() {
  const { t } = useI18n()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const words = t.about.statement.split(' ')
  const line = useTransform(scrollYProgress, [0.42, 0.62], [0, 1])
  const scale = useTransform(scrollYProgress, [0, 0.7], [0.94, 1])
  // Al irse, el texto queda atrás como si se lo pasara de largo
  const gone = useTransform(scrollYProgress, [0.86, 1], [1, 0])
  const goneScale = useTransform(scrollYProgress, [0.86, 1], [1, 1.14])

  return (
    <section id="about" ref={ref} className="pin about-pin">
      <div className="pin-sticky">
        <motion.div className="about-sticky" style={{ opacity: gone, scale: goneScale }}>
          <h2 className="about-label">{t.about.title}</h2>
          <motion.p className="reveal" aria-label={t.about.statement} style={{ scale }}>
            {words.map((w, i) => {
              const start = (i / words.length) * 0.4
              return <Word key={`${w}-${i}`} progress={scrollYProgress} range={[start, start + 0.4 / words.length + 0.04]}>{w}</Word>
            })}
          </motion.p>
          <dl className="facts-row">
            <motion.span className="facts-line" style={{ scaleX: line }} aria-hidden />
            {t.about.facts.map(([k, v], i) => <Fact key={k} k={k} v={v} at={0.42 + i * 0.07} progress={scrollYProgress} />)}
          </dl>
        </motion.div>
      </div>
    </section>
  )
}

/** Con "reducir movimiento": la misma información, todo a la vista y sin pantalla fija. */
function AboutStatic() {
  const { t } = useI18n()
  return (
    <section id="about" className="about-static">
      <div className="about-sticky">
        <h2 className="about-label">{t.about.title}</h2>
        <p className="reveal">{t.about.statement}</p>
        <dl className="facts-row">
          <span className="facts-line" aria-hidden />
          {t.about.facts.map(([k, v]) => (
            <div key={k} className="fact">
              <span className="fact-star" aria-hidden />
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export default function About() {
  return useReducedMotion() ? <AboutStatic /> : <AboutPinned />
}
