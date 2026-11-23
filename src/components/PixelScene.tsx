import { useEffect, useRef } from 'react'
import { BONE, SKULL, sprite } from './pixelArt'
import { isLite, prefersReducedMotion } from '../lib/perf'
import { useI18n } from '../i18n/I18nProvider'

// Escena en pixel art de 256×96 píxeles reales, escalada con números enteros para que cada píxel salga nítido.
const LW = 256
const LH = 96
const GROUND = 80

const SKY = ['#0a0913', '#110e20', '#19132e', '#231a3e', '#33204c', '#472a5c']
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]

// Saturno
const CX = 176, CY = 36, R = 17, TILT = -0.4
const PLANET = ['#5e2c1c', '#a85632', '#e08b55', '#ffd9ad']
const RING = ['#b8a37c', '#e6d3a6', '#cdb88c']
const LIGHT = (() => { const v = [-0.55, -0.6, 0.58]; const n = Math.hypot(...v); return v.map(a => a / n) })()
const MOON = { x: 34, y: 22, r: 6 }

function ringAt(x: number, y: number) {
  const dx = x + 0.5 - CX, dy = y + 0.5 - CY
  const u = dx * Math.cos(TILT) + dy * Math.sin(TILT)
  const v = -dx * Math.sin(TILT) + dy * Math.cos(TILT)
  const s = Math.hypot(u, v / 0.28)
  if (s < 23 || s > 35 || (s > 28.5 && s < 30)) return null
  return { color: s < 28.5 ? RING[2] : s < 32 ? RING[1] : RING[0], front: v > 0 }
}

/** Fondo fijo: cielo con tramado, luna, Saturno, colinas y suelo. Se dibuja una sola vez. */
function paintBackground(ctx: CanvasRenderingContext2D) {
  const px = (x: number, y: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1) }

  for (let y = 0; y < GROUND; y++) {
    const t = (y / (GROUND - 1)) * (SKY.length - 1)
    const i = Math.min(Math.floor(t), SKY.length - 2)
    const f = t - i
    for (let x = 0; x < LW; x++) px(x, y, f > BAYER[(y & 3) * 4 + (x & 3)] / 16 ? SKY[i + 1] : SKY[i])
  }

  for (let y = MOON.y - MOON.r; y <= MOON.y + MOON.r; y++) {
    for (let x = MOON.x - MOON.r; x <= MOON.x + MOON.r; x++) {
      const dx = x - MOON.x, dy = y - MOON.y
      if (dx * dx + dy * dy > MOON.r * MOON.r) continue
      const lit = dx * -0.6 + dy * -0.5
      px(x, y, lit > 2 ? '#b5b5c0' : lit > -1 ? '#7b7b88' : '#4a4a55')
    }
  }
  px(MOON.x + 1, MOON.y + 1, '#4a4a55'); px(MOON.x - 2, MOON.y + 2, '#4a4a55'); px(MOON.x + 2, MOON.y - 2, '#6a6a76')

  for (let y = CY - 24; y <= CY + 24; y++) {
    for (let x = CX - 40; x <= CX + 40; x++) {
      const dx = x + 0.5 - CX, dy = y + 0.5 - CY
      const ring = ringAt(x, y)
      if (ring?.front) { px(x, y, ring.color); continue }
      if (dx * dx + dy * dy <= R * R) {
        const nx = dx / R, ny = dy / R, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))
        const bands = Math.floor((ny + 1) * 4.5) % 2 ? 0.1 : 0
        const d = (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) * 0.5 + 0.5 + bands
        const level = Math.min(3, Math.max(0, Math.floor(d * 4 + BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.5)))
        px(x, y, PLANET[level])
      } else if (ring) px(x, y, ring.color)
    }
  }

  for (let x = 0; x < LW; x++) {
    const far = 58 + ((Math.floor(x / 10) * 7 + Math.floor(x / 23) * 5) % 5) * 3
    ctx.fillStyle = '#1b1430'; ctx.fillRect(x, far, 1, GROUND - far)
    const near = 68 + ((Math.floor(x / 14) * 3) % 4) * 2
    ctx.fillStyle = '#241a3a'; ctx.fillRect(x, near, 1, GROUND - near)
  }
  ctx.fillStyle = '#2a1f42'; ctx.fillRect(0, GROUND, LW, LH - GROUND)
  ctx.fillStyle = '#3a2d58'; ctx.fillRect(0, GROUND, LW, 1)
  for (let x = 4; x < LW; x += 12) ctx.fillRect(x, GROUND + 4, 4, 1)
  ctx.fillStyle = '#211835'; ctx.fillRect(0, GROUND + 9, LW, LH - GROUND - 9)
  for (let x = 10; x < LW; x += 18) { ctx.fillStyle = '#2a1f42'; ctx.fillRect(x, GROUND + 12, 5, 1) }
}

const STARS = (() => {
  let s = 7
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296
  const out: { x: number; y: number; big: boolean; phase: number }[] = []
  while (out.length < 46) {
    const x = Math.floor(rnd() * LW), y = Math.floor(rnd() * 58), big = rnd() > 0.86, phase = Math.floor(rnd() * 4)
    const nearPlanet = Math.hypot(x - CX, (y - CY) * 1.6) < 46
    const nearMoon = Math.hypot(x - MOON.x, y - MOON.y) < 10
    if (!nearPlanet && !nearMoon) out.push({ x, y, big, phase })
  }
  return out
})()

const SKULL_X = 52
const JUMP_MS = 520

export default function PixelScene() {
  const { t } = useI18n()
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const jumpAt = useRef(-1)

  useEffect(() => {
    const c = canvas.current, box = wrap.current
    if (!c || !box) return
    const ctx = c.getContext('2d')!
    const bg = document.createElement('canvas')
    bg.width = LW; bg.height = LH
    paintBackground(bg.getContext('2d')!)
    const calm = prefersReducedMotion() || isLite()

    const draw = (time: number) => {
      ctx.drawImage(bg, 0, 0)
      for (const st of STARS) {
        const on = calm || (Math.floor(time / 500) + st.phase) % 4 !== 0
        ctx.fillStyle = on ? '#f3efe7' : '#6c5f86'
        ctx.fillRect(st.x, st.y, 1, 1)
        if (st.big && on) { ctx.fillStyle = '#b9aed2'; ctx.fillRect(st.x - 1, st.y, 3, 1); ctx.fillRect(st.x, st.y - 1, 1, 3) }
      }
      sprite(ctx, BONE, 96, GROUND - 4, 1, '#efe4cf', '#efe4cf')
      sprite(ctx, BONE, 214, GROUND - 4, 1, '#efe4cf', '#efe4cf')
      const p = jumpAt.current < 0 ? 1 : Math.min(1, (time - jumpAt.current) / JUMP_MS)
      if (p >= 1) jumpAt.current = -1
      const lift = jumpAt.current < 0 ? 0 : Math.round(Math.sin(p * Math.PI) * 16)
      ctx.fillStyle = '#171126'; ctx.fillRect(SKULL_X, GROUND, 9, 1)
      const blink = !calm && time % 2600 < 160
      sprite(ctx, SKULL, SKULL_X, GROUND - 9 - lift, 1, '#f3efe7', blink ? '#f3efe7' : '#ff5a1f')
    }

    // Que cada píxel de la escena ocupe un número entero de píxeles de pantalla
    const fit = () => {
      const dpr = window.devicePixelRatio || 1
      const k = Math.max(1, Math.floor((box.clientWidth * dpr) / LW))
      c.style.width = `${(LW * k) / dpr}px`
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(box)
    draw(0)

    let raf = 0, visible = false, last = 0
    const loop = (time: number) => {
      raf = 0
      if (!visible) return
      // En reposo ~8 cuadros por segundo; durante un salto, a pleno
      if (jumpAt.current >= 0 || time - last >= 120) { last = time; draw(time) }
      raf = requestAnimationFrame(loop)
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting && !calm
      if (visible && !raf) raf = requestAnimationFrame(loop)
    })
    io.observe(box)

    const jump = () => { if (!calm && jumpAt.current < 0) { jumpAt.current = performance.now(); if (!raf && visible) raf = requestAnimationFrame(loop) } }
    c.addEventListener('pointerdown', jump)
    return () => { ro.disconnect(); io.disconnect(); cancelAnimationFrame(raf); c.removeEventListener('pointerdown', jump) }
  }, [])

  return (
    <div ref={wrap} className="pixel-wrap" aria-hidden>
      <canvas ref={canvas} className="pixel-scene" width={LW} height={LH} data-cursor={t.projects.game.cursor} />
    </div>
  )
}
