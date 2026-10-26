import { MotionConfig } from 'motion/react'
import { I18nProvider } from './i18n/I18nProvider'
import Nav from './sections/Nav'
import Hero from './sections/Hero'
import About from './sections/About'
import Projects from './sections/Projects'
import Skills from './sections/Skills'
import Journey from './sections/Journey'
import Contact from './sections/Contact'
import { useLenis } from '@/hooks/useLenis'
import Cursor from './components/Cursor'

export default function App() {
  useLenis()
  return (
    <I18nProvider>
      <MotionConfig reducedMotion="user">
        <Cursor />
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
