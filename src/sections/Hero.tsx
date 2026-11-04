import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import VariableProximity from '../components/VariableProximity'
import { ease } from '../components/motion'
import { bore } from '../three/sceneState'
import { Magnetic, TextScramble } from '../components/effects'

export default function Hero() {
  const { t, lang } = useI18n()
  const [count, setCount] = useState(0)
  const [idea, setIdea] = useState<number | null>(null)

  const getBored = () => {
    const n = t.hero.ideas.length
    let next = Math.floor(Math.random() * n)
    if (next === idea) next = (next + 1) % n
    setIdea(next)
    setCount(c => c + 1)
    bore(count + 1)
  }

  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.8, ease: ease.out },
  })

  return (
    <section id="top" className="hero">
      <div className="hero-text">
        <h1 className="hero-name">
          <VariableProximity key={lang} text={t.hero.name} rise delay={0.55} />
        </h1>
        <motion.p key={`lead-${lang}`} className="hero-lead" {...fade(1.1)}>{t.hero.lead}</motion.p>
        <motion.div className="hero-actions" {...fade(1.25)}>
          <Magnetic>
            <button className="btn btn-accent" onClick={getBored}>
              {count === 0 ? t.hero.bored : t.hero.boredAgain}
            </button>
          </Magnetic>
          <a href="#projects" className="link-arrow">{t.hero.projects} <Arrow /></a>
        </motion.div>
        <p className="hero-idea" aria-live="polite">
          {idea !== null && <TextScramble key={count} text={`${t.hero.then} ${t.hero.ideas[idea]}`} />}
        </p>
      </div>
      <div className="hero-stage" aria-hidden />
    </section>
  )
}

export function Arrow() {
  return <ArrowUpRight className="arrow" size={16} strokeWidth={2} aria-hidden />
}
