import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useI18n } from '../i18n/I18nProvider'
import { ease } from '../components/motion'
import { linkProps, useContactItems } from '../components/ContactLinks'
import LangPicker from '../components/LangPicker'
import Readout from '../components/Readout'
import Tools from '../components/Tools'
import { layout } from '../universe/state'

const ids = ['about', 'projects', 'stack', 'journey', 'contact'] as const

export default function Nav() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const contact = useContactItems()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8 && !(layout.loop && window.scrollY > layout.max - 8))
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
    <>
      <header className={`bar ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`} data-ui>
        <div className="bar-brand">
          <a href="#top" className="wordmark" onClick={() => setOpen(false)}>Conrado De Napoli</a>
          <Readout short />
        </div>
        <nav className="bar-links" aria-label="Main">
          {ids.map(id => <a key={id} href={`#${id}`}>{t.nav[id]}</a>)}
        </nav>
        <div className="bar-actions">
          <nav className="bar-contact" aria-label={t.contact.quick}>
            {contact.map(i => (
              <a key={i.id} className={`bar-icon bar-icon-${i.id}`} {...linkProps(i)} aria-label={i.label} title={i.label}>
                {i.icon}
                {i.id === 'cv' && <span>CV</span>}
              </a>
            ))}
          </nav>
          <LangPicker />
          <button className="menu-btn" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls="mobile-menu">
            {open ? t.nav.close : t.nav.menu}
          </button>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-menu"
              className="sheet"
              initial={{ clipPath: 'inset(0 0 100% 0)' }}
              animate={{ clipPath: 'inset(0 0 0% 0)' }}
              exit={{ clipPath: 'inset(0 0 100% 0)', transition: { duration: 0.25, ease: ease.out } }}
              transition={{ duration: 0.45, ease: ease.out }}
            >
              <nav aria-label="Mobile">
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
              </nav>
              <Tools labels onUse={() => setOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <nav className="dock" aria-label={t.contact.quick} data-ui>
        {contact.map(i => (
          <a key={i.id} className="dock-item" {...linkProps(i)}>
            {i.icon}
            <span>{i.id === 'cv' ? 'CV' : i.label}</span>
          </a>
        ))}
      </nav>
    </>
  )
}
