import { MotionConfig } from 'motion/react'
import { I18nProvider } from './i18n/I18nProvider'
import Nav from './sections/Nav'
import Hero from './sections/Hero'
import About from './sections/About'
import Projects from './sections/Projects'
import Atlas from './sections/Atlas'
import Stack from './sections/Stack'
import Journey from './sections/Journey'
import Contact from './sections/Contact'
import Descent from './sections/Descent'
import { useLenis } from '@/hooks/useLenis'
import { useAnalytics } from '@/hooks/useAnalytics'
import Cursor from './components/Cursor'
import Hud from './components/Hud'
import World from './components/World'
import Stardust from './components/Stardust'

export default function App() {
  useLenis()
  useAnalytics()
  return (
    <I18nProvider>
      <MotionConfig reducedMotion="user">
        <World />
        <Stardust />
        <Cursor />
        <Nav />
        <main>
          <Hero />
          <About />
          <Projects />
          <Atlas />
          <Stack />
          <Journey />
          <Contact />
          <Descent />
        </main>
        <Hud />
      </MotionConfig>
    </I18nProvider>
  )
}
