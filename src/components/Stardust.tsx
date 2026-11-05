import { useEffect, useRef } from 'react'

type Mote = { x: number; y: number; vx: number; vy: number; life: number; size: number; hue: number }

/** Polvo de estrellas que deja el cursor al moverse. Solo con mouse; dibuja únicamente mientras hay partículas vivas. */
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
        m.x += m.vx * dt; m.y += m.vy * dt; m.vy += 12 * dt
        const a = Math.min(1, m.life / 0.9)
        ctx.fillStyle = m.hue > 0.7 ? `rgba(255,140,90,${a})` : `rgba(255,240,225,${a})`
        ctx.beginPath(); ctx.arc(m.x, m.y, m.size * a, 0, Math.PI * 2); ctx.fill()
      }
      raf = motes.length ? requestAnimationFrame(frame) : 0
      if (!raf) last = 0
    }
    const move = (e: PointerEvent) => {
      const d = Math.hypot(e.clientX - lx, e.clientY - ly)
      lx = e.clientX; ly = e.clientY
      const n = Math.min(3, Math.floor(d / 14))
      for (let i = 0; i < n && motes.length < 160; i++) {
        motes.push({ x: e.clientX, y: e.clientY, vx: (Math.random() - 0.5) * 40, vy: (Math.random() - 0.5) * 40, life: 0.5 + Math.random() * 0.6, size: 0.6 + Math.random() * 1.6, hue: Math.random() })
      }
      if (!raf && motes.length) raf = requestAnimationFrame(frame)
    }
    addEventListener('pointermove', move, { passive: true })
    addEventListener('resize', resize)
    return () => { removeEventListener('pointermove', move); removeEventListener('resize', resize); cancelAnimationFrame(raf) }
  }, [])
  return <canvas ref={ref} className="stardust" aria-hidden />
}
