import { lazy, Suspense, useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import SplitText from '../components/SplitText'
import { ease } from '../components/motion'
import { bore } from '../three/sceneState'
import { Magnetic, SlidingNumber, TextScramble } from '../components/effects'

const HeroScene = lazy(() => import('../three/HeroScene'))

function supportsWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch { return false }
}

export default function Hero() {
  const { t, lang } = useI18n()
  const [count, setCount] = useState(0)
  const [idea, setIdea] = useState<number | null>(null)

  // La escena 3D se monta cuando el navegador queda libre, así el texto aparece primero
  const [show3D, setShow3D] = useState(false)
  useEffect(() => {
    if (!supportsWebGL()) return
    const ric = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 200))
    const id = ric(() => setShow3D(true), { timeout: 1200 })
    return () => (window.cancelIdleCallback ?? clearTimeout)(id)
  }, [])

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
          <SplitText key={lang} text={t.hero.name} delay={0.1} />
        </h1>
        <motion.p key={`lead-${lang}`} className="hero-lead" {...fade(0.6)}>{t.hero.lead}</motion.p>
        <motion.div className="hero-actions" {...fade(0.75)}>
          <Magnetic>
            <button className="btn btn-accent" onClick={getBored}>
              {count === 0 ? t.hero.bored : t.hero.boredAgain}
              {count > 0 && <span className="btn-count">×<SlidingNumber value={count} /></span>}
            </button>
          </Magnetic>
          <a href="#projects" className="link-arrow">{t.hero.projects} <Arrow /></a>
        </motion.div>
        <p className="hero-idea" aria-live="polite">
          {idea !== null && <TextScramble key={count} text={`${t.hero.then} ${t.hero.ideas[idea]}`} />}
        </p>
      </div>
      <div className="hero-stage" aria-hidden>
        {show3D && (
          <Suspense fallback={null}>
            <HeroScene />
          </Suspense>
        )}
      </div>
    </section>
  )
}

export function Arrow() {
  return <ArrowUpRight className="arrow" size={16} strokeWidth={2} aria-hidden />
}
