import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useI18n } from '../i18n/I18nProvider'

const ids = ['about', 'projects', 'journey', 'contact'] as const

export default function Nav() {
  const { t, lang, toggle } = useI18n()
  const [active, setActive] = useState<string>('')

  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    ids.forEach(id => { const el = document.getElementById(id); if (el) io.observe(el) })
    const hero = document.getElementById('top')
    if (hero) io.observe(hero)
    return () => io.disconnect()
  }, [])

  return (
    <>
      <header className="topbar">
        <a href="#top" className="brand" aria-label="Conrado De Napoli">
          <span className="brand-mark">CD</span>
          <span className="brand-name">Conrado</span>
        </a>
        <button className="lang" onClick={toggle} aria-label={t.lang.label}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={lang}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {lang === 'es' ? 'ES' : 'EN'}
            </motion.span>
          </AnimatePresence>
          <span className="lang-sep">/</span>
          <span className="lang-other">{t.lang.switch}</span>
        </button>
      </header>
      <nav className="dock" aria-label="Main">
        {ids.map(id => (
          <a key={id} href={`#${id}`} className={active === id ? 'active' : ''}>
            {active === id && (
              <motion.span layoutId="dock-pill" className="dock-pill" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
            )}
            <span className="dock-label">{t.nav[id]}</span>
          </a>
        ))}
      </nav>
    </>
  )
}
