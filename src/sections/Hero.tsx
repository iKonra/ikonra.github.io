import { motion, useMotionValue, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { ArrowUpRight, RefreshCw } from 'lucide-react'
import { useRef, useState } from 'react'
import { useI18n } from '../i18n/I18nProvider'
import VariableProximity from '../components/VariableProximity'
import { Magnetic } from '../components/effects'
import { useTicker } from '../lib/ticker'
import { J, burst, layout, smooth } from '../universe/state'

// Sin animaciones de entrada que oculten el texto: el contenido principal se ve apenas carga el CSS.
export default function Hero() {
  const { t, lang } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const root = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const [galaxy, setGalaxy] = useState(J.galaxy)
  const morph = () => setGalaxy(burst())

  // Al scrollear, la cámara entra en la galaxia: las letras se abren y pasan de largo
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  // Al final de la página, este mismo inicio vuelve a aparecer (fijo en pantalla): el salto al comienzo no se nota
  const back = useMotionValue(0)
  useTicker(v => {
    const k = layout.loop ? smooth(19.42, 19.86, v) : 0
    if (k === back.get()) return
    back.set(k)
    root.current?.classList.toggle('is-back', k > 0)
  })
  const fly = useTransform(() => (back.get() > 0 ? (1 - back.get()) * 0.12 : reduce ? 0 : Math.max(0, scrollYProgress.get() - 0.06) ** 2.4))
  const opacity = useTransform(() => (back.get() > 0 ? back.get() : reduce ? 1 : 1 - Math.min(Math.max((scrollYProgress.get() - 0.12) / 0.5, 0), 1)))
  const y = useTransform(() => `${back.get() > 0 || reduce ? 0 : scrollYProgress.get() * 22}vh`)
  const scale = useTransform(() => (back.get() > 0 || reduce ? 1 : 1 + scrollYProgress.get() * 0.6))

  return (
    <div ref={ref} className="hero-slot">
    <section id="top" ref={root} className="hero">
      <motion.div className="hero-text" style={{ opacity, y, scale }}>
        <motion.h1 className="hero-name" style={{ '--fly': fly } as never}>
          <VariableProximity key={lang} text={t.hero.name} drift />
        </motion.h1>
        <p className="hero-role">{t.hero.role}</p>
        <p className="hero-lead">{t.hero.lead}</p>
        <div className="hero-actions">
          <Magnetic>
            <a href="#projects" className="btn btn-accent">{t.hero.projects} <Arrow /></a>
          </Magnetic>
          <a href="#contact" className="btn btn-outline">{t.hero.contact}</a>
        </div>
      </motion.div>
      <motion.div className="hero-stage" style={{ opacity }}>
        <div className="hero-touch" onClick={morph} data-cursor={t.hero.morph} aria-hidden />
      </motion.div>
      <motion.a href="#about" className="scroll-hint" style={{ opacity }}><i aria-hidden /> {t.hero.scroll}</motion.a>
      <motion.button className="galaxy-btn" style={{ opacity }} onClick={morph} aria-label={`${t.hero.morph}: ${t.hero.galaxies[galaxy]}`}>
        <strong key={galaxy}>{t.hero.galaxies[galaxy]}</strong>
        <span><RefreshCw size={13} aria-hidden /> {t.hero.morph}</span>
      </motion.button>
    </section>
    </div>
  )
}

export function Arrow() {
  return <ArrowUpRight className="arrow" size={16} strokeWidth={2} aria-hidden />
}
