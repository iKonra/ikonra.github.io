import { useEffect, useRef } from 'react'
import { J } from '../universe/state'

type Mote = { x: number; y: number; vx: number; vy: number; life: number; span: number; size: number; color: string; star: boolean }

/** Polvo de estrellas que deja el cursor, del color de la zona. Solo con mouse; dibuja únicamente mientras hay partículas vivas. */
export default function Stardust() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const c = ref.current!
    const ctx = c.getContext('2d')!
    const dpr = Math.min(devicePixelRatio, 2)
    let motes: Mote[] = [], raf = 0, last = 0, lx = 0, ly = 0
    const resize = () => { c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    resize()

    const frame = (time: number) => {
      const dt = Math.min((time - (last || time)) / 1000, 0.05)
      last = time
      ctx.clearRect(0, 0, innerWidth, innerHeight)
      ctx.globalCompositeOperation = 'lighter'
      motes = motes.filter(m => (m.life -= dt) > 0)
      for (const m of motes) {
        m.vx *= 1 - dt * 1.6; m.vy *= 1 - dt * 1.6
        m.x += m.vx * dt; m.y += m.vy * dt
        const k = m.life / m.span
        const a = Math.min(1, k * 1.6) * (m.star ? 0.65 + 0.35 * Math.sin(m.life * 30) : 1)
        const r = m.size * (0.4 + k * 0.6)
        ctx.fillStyle = `rgba(${m.color},${a.toFixed(3)})`
        ctx.beginPath()
        if (m.star) {
          const s = r * 3.4, i = r * 0.5
          ctx.moveTo(m.x, m.y - s); ctx.lineTo(m.x + i, m.y - i); ctx.lineTo(m.x + s, m.y); ctx.lineTo(m.x + i, m.y + i)
          ctx.lineTo(m.x, m.y + s); ctx.lineTo(m.x - i, m.y + i); ctx.lineTo(m.x - s, m.y); ctx.lineTo(m.x - i, m.y - i)
          ctx.closePath()
        } else ctx.arc(m.x, m.y, r, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = motes.length ? requestAnimationFrame(frame) : 0
      if (!raf) last = 0
    }
    const move = (e: PointerEvent) => {
      const dx = e.clientX - lx, dy = e.clientY - ly
      const n = Math.min(4, Math.floor(Math.hypot(dx, dy) / 13))
      for (let i = 0; i < n && motes.length < 190; i++) {
        const f = i / n, star = Math.random() < 0.16
        const life = 0.45 + Math.random() * (star ? 1 : 0.7)
        motes.push({
          x: lx + dx * f, y: ly + dy * f,
          vx: dx * 1.1 + (Math.random() - 0.5) * 70, vy: dy * 1.1 + (Math.random() - 0.5) * 70,
          life, span: life, size: 0.5 + Math.random() * 1.2, star,
          color: Math.random() < 0.55 ? J.tint.join(',') : '255,246,236',
        })
      }
      lx = e.clientX; ly = e.clientY
      if (!raf && motes.length) raf = requestAnimationFrame(frame)
    }
    addEventListener('pointermove', move, { passive: true })
    addEventListener('resize', resize)
    return () => { removeEventListener('pointermove', move); removeEventListener('resize', resize); cancelAnimationFrame(raf) }
  }, [])
  return <canvas ref={ref} className="stardust" aria-hidden />
}
