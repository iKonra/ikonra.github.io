import { useEffect, useRef } from 'react'

type Spark = { x: number; y: number; a: number; t: number }

/** Chispas al hacer click en cualquier lugar, inspirado en React Bits <ClickSpark />. Solo anima mientras hay chispas. */
export default function ClickSpark({ color = '#b9a8ff' }: { color?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    let sparks: Spark[] = []
    let raf = 0
    const dpr = Math.min(devicePixelRatio, 2)
    const resize = () => {
      canvas.width = innerWidth * dpr
      canvas.height = innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const draw = (now: number) => {
      ctx.clearRect(0, 0, innerWidth, innerHeight)
      sparks = sparks.filter(s => now - s.t < 450)
      for (const s of sparks) {
        const p = (now - s.t) / 450
        const ease = p * (2 - p)
        const d = ease * 26
        const len = 10 * (1 - ease)
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(s.x + d * Math.cos(s.a), s.y + d * Math.sin(s.a))
        ctx.lineTo(s.x + (d + len) * Math.cos(s.a), s.y + (d + len) * Math.sin(s.a))
        ctx.stroke()
      }
      raf = sparks.length ? requestAnimationFrame(draw) : 0
    }
    const onClick = (e: MouseEvent) => {
      const t = performance.now()
      for (let i = 0; i < 8; i++) sparks.push({ x: e.clientX, y: e.clientY, a: (Math.PI * 2 * i) / 8, t })
      if (!raf) raf = requestAnimationFrame(draw)
    }
    addEventListener('resize', resize)
    addEventListener('click', onClick)
    return () => { removeEventListener('resize', resize); removeEventListener('click', onClick); cancelAnimationFrame(raf) }
  }, [color])
  return <canvas ref={ref} className="click-spark" aria-hidden />
}
