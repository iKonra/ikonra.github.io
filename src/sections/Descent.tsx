import { useRef, useState } from 'react'
import { useI18n } from '../i18n/I18nProvider'
import { linkProps, useContactItems } from '../components/ContactLinks'
import { useTicker } from '../lib/ticker'
import { layout, win } from '../universe/state'

/** Cuándo se ve cada frase de la caída (t): entra, queda, se va. */
const marks: [number, number, number, number][] = [
  [15.35, 15.6, 15.95, 16.15],
  [16.35, 16.55, 16.95, 17.12],
  [17.55, 17.75, 18.12, 18.24],
  [18.5, 18.6, 18.76, 18.84],
]

/** Después de Contacto: solo ocupa el scroll de la caída y muestra unas pocas frases, como los títulos de una película.
 *  Es decorativa: no agrega contenido nuevo, así que los lectores de pantalla terminan en Contacto. */
export default function Descent() {
  const { t } = useI18n()
  const lines = useRef<(HTMLDivElement | null)[]>([])
  const [near, setNear] = useState(false)
  const items = useContactItems(18).filter(i => i.id === 'email' || i.id === 'linkedin')

  useTicker(v => {
    const on = layout.loop && v > 14.5 && v < 19.2
    if (on !== near) setNear(on)
    document.documentElement.classList.toggle('cinema', on)
    marks.forEach((m, i) => {
      const el = lines.current[i]
      if (!el) return
      const k = win(v, ...m)
      el.style.opacity = k.toFixed(3)
      el.style.visibility = k > 0.01 ? 'visible' : 'hidden'
      el.style.setProperty('--k', k.toFixed(3))
      el.style.pointerEvents = k > 0.6 ? 'auto' : 'none'
    })
  })

  return (
    <section id="descent" className="descent" aria-hidden>
      <div className="descent-lines">
        {t.descent.map((text, i) => (
          <div key={i} ref={el => { lines.current[i] = el }} className={`descent-line descent-line-${i}`} style={{ opacity: 0, visibility: 'hidden' }}>
            <p>{text}</p>
            {i === 2 && (
              <div className="descent-actions">
                {items.map(c => <a key={c.id} tabIndex={-1} className={`btn ${c.id === 'email' ? 'btn-accent' : 'btn-outline'}`} {...linkProps(c)}>{c.icon}{c.label}</a>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
