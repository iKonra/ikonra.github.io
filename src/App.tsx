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
import World from './components/World'
import Nebula from './components/Nebula'
import Stardust from './components/Stardust'

export default function App() {
  useLenis()
  return (
    <I18nProvider>
      <MotionConfig reducedMotion="user">
        <Nebula />
        <World />
        <div className="grain" aria-hidden />
        <Stardust />
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
