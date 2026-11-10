import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'motion/react'
import { SlidingNumber } from './effects'
import type { Metric, Project } from '../i18n/content'

/** Tarjetas de métricas. Los números ruedan desde 0 la primera vez que el panel se ve (con "reducir movimiento" aparecen ya terminados). */
export function Metrics({ items, play }: { items: Metric[]; play: boolean }) {
  const ref = useRef<HTMLUListElement>(null)
  const reduce = useReducedMotion()
  const seen = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const [on, setOn] = useState(false)
  useEffect(() => { if (seen && play) setOn(true) }, [seen, play])

  return (
    <ul ref={ref} className="metrics" data-count={items.length}>
      {items.map(m => (
        <li key={m.label} className="metric">
          <span className="sr-only">{m.prefix}{m.value}{m.suffix} {m.label}{m.note ? `, ${m.note}` : ''}</span>
          <span className="metric-value" aria-hidden>
            {m.prefix}
            <SlidingNumber value={on || reduce ? m.value : 0} min={String(m.value).length} />
            {m.suffix}
          </span>
          <span className="metric-label" aria-hidden>{m.label}</span>
          {m.note && <span className="metric-note" aria-hidden>{m.note}</span>}
        </li>
      ))}
    </ul>
  )
}

/** Proyecto destacado dentro de otro (ej. La Beduina dentro de Inti). El resultado solo aparece si está cargado en content.ts. */
export function Featured({ data }: { data: NonNullable<Project['featured']> }) {
  return (
    <div className="featured">
      <span className="featured-label">{data.label}</span>
      <strong className="featured-name">{data.name}</strong>
      <p className="featured-text">{data.text}</p>
      {data.result && <p className="featured-result">{data.result}</p>}
    </div>
  )
}

/** Juego del estudio: nombre, qué es y en qué estado está. */
export function GameCard({ data }: { data: NonNullable<Project['game']> }) {
  return (
    <div className="featured featured-game">
      <span className="featured-label">{data.label}</span>
      <strong className="featured-name">{data.name}</strong>
      <p className="featured-text">{data.text} <span className="featured-status">{data.status}</span></p>
    </div>
  )
}
