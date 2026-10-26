import { lazy, Suspense, useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { useI18n } from '../i18n/I18nProvider'
import SplitText from '../components/SplitText'
import RotatingText from '../components/RotatingText'
import Magnet from '../components/Magnet'

const HeroScene = lazy(() => import('../three/HeroScene'))

function supportsWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch { return false }
}
const webgl = typeof window !== 'undefined' && supportsWebGL()

export default function Hero() {
  const { t, lang } = useI18n()
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 600], [0, -120])
  const opacity = useTransform(scrollY, [0, 450], [1, 0])
  // Montar la escena 3D recién cuando el navegador está libre, así el texto aparece primero
  const [show3D, setShow3D] = useState(false)
  useEffect(() => {
    if (!webgl) return
    const ric = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 200))
    const id = ric(() => setShow3D(true), { timeout: 1200 })
    return () => (window.cancelIdleCallback ?? clearTimeout)(id)
  }, [])

  return (
    <section id="top" className="hero">
      <div className="hero-glow" aria-hidden />
      {show3D && (
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>
      )}
      <motion.div className="hero-content" style={{ y, opacity }}>
        <motion.p
          className="hero-hello"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <span className="dot" /> {t.hero.hello}
        </motion.p>
        <h1 className="hero-name">
          <SplitText key={lang} text={t.hero.name} delay={0.2} />
        </h1>
        <div className="hero-role">
          <RotatingText items={t.hero.roles} />
        </div>
        <motion.p
          key={`tag-${lang}`}
          className="hero-tagline"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          {t.hero.tagline}
        </motion.p>
        <motion.div
          className="hero-ctas"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          <Magnet><a href="#projects" className="btn btn-primary">{t.hero.cta}</a></Magnet>
          <Magnet><a href="#contact" className="btn btn-ghost">{t.hero.cta2}</a></Magnet>
        </motion.div>
      </motion.div>
      <motion.a href="#about" className="scroll-hint" style={{ opacity }} aria-label={t.hero.scroll}>
        <span className="mouse"><span className="wheel" /></span>
      </motion.a>
    </section>
  )
}
