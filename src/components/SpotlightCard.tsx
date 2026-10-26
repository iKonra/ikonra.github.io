import { useRef, type ReactNode, type PointerEvent } from 'react'

type Props = { children: ReactNode; className?: string; color?: string }

/** Tarjeta con luz que sigue al cursor, inspirado en React Bits <SpotlightCard />. Solo CSS vars, sin re-renders. */
export default function SpotlightCard({ children, className = '', color = 'rgba(124, 92, 255, 0.25)' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const onMove = (e: PointerEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
  return (
    <div ref={ref} onPointerMove={onMove} className={`spotlight ${className}`} style={{ ['--spot' as string]: color }}>
      {children}
    </div>
  )
}
