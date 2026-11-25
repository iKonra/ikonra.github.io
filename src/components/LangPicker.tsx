import { AnimatePresence, motion } from 'motion/react'
import { Check, Globe } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useI18n } from '../i18n/I18nProvider'
import { langCodes, langs } from '../i18n/langs'
import { ease } from './motion'

/** Selector de idioma. Cada idioma figura con su propio nombre, para reconocerlo sin saber el actual. */
export default function LangPicker() {
  const { t, lang, setLang } = useI18n()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    root.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus({ preventScroll: true })
    const out = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    addEventListener('pointerdown', out)
    return () => removeEventListener('pointerdown', out)
  }, [open])

  const onKey = (e: KeyboardEvent) => {
    if (!open) return
    if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); button.current?.focus(); return }
    if (e.key === 'Tab') { setOpen(false); return }
    const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const list = [...root.current!.querySelectorAll<HTMLElement>('[role="menuitemradio"]')]
    const i = list.indexOf(document.activeElement as HTMLElement)
    list[(i + step + list.length) % list.length].focus()
  }

  return (
    <div className="langs" ref={root} onKeyDown={onKey} data-ui>
      <button ref={button} className="lang" onClick={() => setOpen(o => !o)} aria-haspopup="menu" aria-expanded={open} aria-label={`${t.lang.label}: ${langs[lang].name}`}>
        <Globe size={16} aria-hidden />
        <span aria-hidden>{lang.toUpperCase()}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            className="langs-menu"
            role="menu"
            aria-label={t.lang.label}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ duration: 0.22, ease: ease.out }}
          >
            {langCodes.map(code => (
              <li key={code} role="none">
                <button
                  role="menuitemradio"
                  aria-checked={code === lang}
                  lang={code}
                  onClick={() => { setLang(code); setOpen(false); button.current?.focus({ preventScroll: true }) }}
                >
                  <span>{langs[code].name}</span>
                  {code === lang && <Check size={16} aria-hidden />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
