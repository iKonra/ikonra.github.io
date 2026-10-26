import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useI18n } from '../i18n/I18nProvider'
import { ease } from '../components/motion'

const ids = ['about', 'projects', 'journey', 'contact'] as const

export default function Nav() {
  const { t, toggle } = useI18n()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className={`bar ${scrolled ? 'is-scrolled' : ''}`}>
      <a href="#top" className="wordmark" onClick={() => setOpen(false)}>Conrado De Napoli</a>
      <nav className="bar-links" aria-label="Main">
        {ids.map(id => <a key={id} href={`#${id}`}>{t.nav[id]}</a>)}
      </nav>
      <div className="bar-actions">
        <button className="lang" onClick={toggle} aria-label={t.lang.label}>{t.lang.other}</button>
        <button className="menu-btn" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls="mobile-menu">
          {open ? t.nav.close : t.nav.menu}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            className="sheet"
            aria-label="Mobile"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)', transition: { duration: 0.25, ease: ease.out } }}
            transition={{ duration: 0.45, ease: ease.out }}
          >
            {ids.map((id, i) => (
              <motion.a
                key={id}
                href={`#${id}`}
                onClick={() => setOpen(false)}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.05, duration: 0.5, ease: ease.out }}
              >
                {t.nav[id]}
              </motion.a>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
