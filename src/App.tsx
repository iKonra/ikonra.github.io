import { MotionConfig } from 'motion/react'
import { I18nProvider } from './i18n/I18nProvider'
import Nav from './sections/Nav'
import Hero from './sections/Hero'
import About from './sections/About'
import Projects from './sections/Projects'
import Journey from './sections/Journey'
import Contact from './sections/Contact'
import { useLenis } from '@/hooks/useLenis'
import Cursor from './components/Cursor'
import Intro from './components/Intro'
import World from './components/World'

export default function App() {
  useLenis()
  return (
    <I18nProvider>
      <MotionConfig reducedMotion="user">
        <World />
        <div className="grain" aria-hidden />
        <Intro />
        <Cursor />
        <Nav />
        <main>
          <Hero />
          <About />
          <Projects />
          <Journey />
          <Contact />
        </main>
      </MotionConfig>
    </I18nProvider>
  )
}
