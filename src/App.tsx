import { MotionConfig, motion, useScroll, useSpring } from 'motion/react'
import { I18nProvider } from './i18n/I18nProvider'
import ClickSpark from './components/ClickSpark'
import Nav from './sections/Nav'
import Hero from './sections/Hero'
import About from './sections/About'
import Projects from './sections/Projects'
import Skills from './sections/Skills'
import Journey from './sections/Journey'
import Contact from './sections/Contact'

function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30 })
  return <motion.div className="progress" style={{ scaleX }} />
}

export default function App() {
  return (
    <I18nProvider>
      <MotionConfig reducedMotion="user">
        <ScrollProgress />
        <ClickSpark />
        <Nav />
        <main>
          <Hero />
          <About />
          <Projects />
          <Skills />
          <Journey />
          <Contact />
        </main>
      </MotionConfig>
    </I18nProvider>
  )
}
