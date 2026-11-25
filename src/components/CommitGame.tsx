import { useEffect, useMemo, useRef, useState } from 'react'
import github from '../data/github.json'
import { links } from '../i18n/content'
import { useI18n } from '../i18n/I18nProvider'
import { prefersReducedMotion } from '../lib/perf'
import { travelTo } from '../lib/scroll'
import { GithubIcon } from './ContactLinks'

// Mini juego con el calendario real de GitHub: cada cuadro es un día y su color, cuánto se hizo ese día.
// La nave los recupera a disparos; algunos días traen un bug que cae sobre la ciudad. Sin nadie jugando, se juega solo.

type Day = [date: string, count: number, level: number]
const days = github.days as Day[]
// en pantallas chicas entran los últimos meses, para que cada día se vea y se pueda apuntar
const small = typeof matchMedia === 'function' && matchMedia('(max-width: 640px)').matches

const LW = small ? 184 : 288, LH = 140
const PITCH = 5, CELL = 4, GX = 12, GY = 19, SHIP_Y = 110, FLOOR = 124
const LEVELS = ['#1d1a36', '#0f7a3f', '#1fb257', '#43e07c', '#a9ffba']
const SKY = ['#080711', '#0d0b1b', '#141027', '#1c1535', '#271b45', '#352352']
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]

const SHIP = ['.....W.....', '.....W.....', '....WBW....', '....WBW....', '...WWWWW...', '.O.WWWWW.O.', '.WWWWWWWWW.', 'WWW.WWW.WWW', 'W...GGG...W']
const BUG = [['.X...X.', '..XXX..', '.XOXOX.', 'XXXXXXX', '.XXXXX.', 'X.X.X.X'], ['X.....X', '.XXXXX.', '.XOXOX.', 'XXXXXXX', '.XXXXX.', '.X.X.X.']]
const STAR = ['...X...', '..XXX..', 'XXXXXXX', '.XXXXX.', '.XX.XX.', 'X.....X']
const HEART = ['XX.XX', 'XXXXX', '.XXX.', '..X..']
const INK: Record<string, string> = { W: '#f3efe7', B: '#5cc8ff', O: '#ff5a1f', G: '#8b86a3' }

// Letras de 3×5 píxeles, en 15 bits por carácter (de arriba abajo, de izquierda a derecha).
const FONT: Record<string, string> = {}
const GLYPHS = 'A010101111101101B110101110101110C011100100100011D110101101101110E111100110100111F111100110100100G011100101101011H101101111101101I111010010010111J001001001101010K101101110101101L100100100100111M101111111101101N110101101101101O010101101101010P110101110100100Q010101101110011R110101110101101S011100010001110T111010010010010U101101101101111V101101101101010W101101111111101X101101010101101Y101101010010010Z111001010100111' +
  '0111101101101111' + '1010110010010111' + '2110001010100111' + '3110001010001110' + '4101101111001001' + '5111100110001110' + '6011100111101111' + '7111001010010010' + '8111101111101111' + '9111101111001110' + '+000010111010000'
for (let i = 0; i < GLYPHS.length; i += 16) FONT[GLYPHS[i]] = GLYPHS.slice(i + 1, i + 16)

function text(c: CanvasRenderingContext2D, s: string, x: number, y: number, color: string) {
  c.fillStyle = color
  for (const ch of s) {
    const g = FONT[ch]
    if (g) for (let i = 0; i < 15; i++) if (g[i] === '1') c.fillRect(x + (i % 3), y + Math.floor(i / 3), 1, 1)
    x += 4
  }
}
function draw(c: CanvasRenderingContext2D, map: string[], x: number, y: number, ink: (ch: string) => string) {
  x = Math.round(x); y = Math.round(y)
  for (let j = 0; j < map.length; j++) for (let i = 0; i < map[j].length; i++) {
    const ch = map[j][i]
    if (ch !== '.') { c.fillStyle = ink(ch); c.fillRect(x + i, y + j, 1, 1) }
  }
}

type Cell = { x: number; y: number; hp: number; lv: number; day: Day; hit: number }
const first = new Date(`${days[0][0]}T12:00:00Z`).getTime()
const skip = small ? Math.ceil(days.length / 7) - 32 : 0
const cells: Cell[] = days.slice(skip * 7).map(day => {
  const n = Math.round((new Date(`${day[0]}T12:00:00Z`).getTime() - first) / 864e5)
  return { x: GX + (Math.floor(n / 7) - skip) * PITCH, y: GY + (n % 7) * PITCH, hp: day[2], lv: day[2], day, hit: 0 }
})
const activeDays = cells.filter(c => c.lv > 0).length
const record = days.reduce((a, d) => (d[1] > a[1] ? d : a), days[0])
const streak = days.reduce((a, d) => { const run = d[1] ? a.run + 1 : 0; return { run, max: Math.max(a.max, run) } }, { run: 0, max: 0 }).max

function rng(seed: number) { let s = seed; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296 }

/** Fondo fijo: cielo con tramado, estrellas y la ciudad abajo. */
function paint(c: CanvasRenderingContext2D) {
  for (let y = 0; y < LH; y++) {
    const t = (Math.min(y, FLOOR) / FLOOR) * (SKY.length - 1.001), i = Math.floor(t), f = t - i
    for (let x = 0; x < LW; x++) { c.fillStyle = f > BAYER[(y & 3) * 4 + (x & 3)] / 16 ? SKY[i + 1] : SKY[i]; c.fillRect(x, y, 1, 1) }
  }
  const rnd = rng(11)
  for (let i = 0; i < 46; i++) { c.fillStyle = rnd() < 0.3 ? '#8f84b8' : '#4d4570'; c.fillRect(Math.floor(rnd() * LW), 56 + Math.floor(rnd() * 52), 1, 1) }
  for (const [base, color, win, p] of [[22, '#171029', '#3a2a55', 0.12], [14, '#0e0a1c', '#ffb257', 0.2]] as [number, string, string, number][]) {
    let x = -2
    while (x < LW) {
      const w = 7 + Math.floor(rnd() * 12), h = base * 0.45 + Math.floor(rnd() * base * 0.75)
      c.fillStyle = color
      c.fillRect(x, Math.round(LH - h), w - 1, Math.ceil(h))
      for (let wy = Math.round(LH - h) + 2; wy < LH - 1; wy += 3) for (let wx = x + 1; wx < x + w - 2; wx += 2) if (rnd() < p) { c.fillStyle = win; c.fillRect(wx, wy, 1, 1) }
      x += w
    }
  }
}

type Mode = 'demo' | 'play' | 'over' | 'win'

export default function CommitGame() {
  const { t, lang } = useI18n()
  const g = t.stack.github
  const root = useRef<HTMLDivElement>(null), stage = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null)
  const score = useRef<HTMLElement>(null), bugs = useRef<HTMLElement>(null), tip = useRef<HTMLParagraphElement>(null)
  const [mode, setMode] = useState<Mode>('demo')
  const num = useMemo(() => new Intl.NumberFormat(lang), [lang])
  const date = useMemo(() => new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }), [lang])
  const long = (d: string) => date.format(new Date(`${d}T12:00:00Z`))
  // los textos cambian con el idioma sin reiniciar la partida
  const words = useRef({ num, long, g, months: [] as [number, string][] })
  words.current = {
    num, long, g,
    months: useMemo(() => {
      const f = new Intl.DateTimeFormat(lang, { month: 'short', timeZone: 'UTC' })
      const out: [number, string][] = []
      let last = -1
      cells.forEach(c => {
        const d = new Date(`${c.day[0]}T12:00:00Z`)
        if (d.getUTCMonth() !== last && c.y === GY) {
          last = d.getUTCMonth()
          if (c.x < LW - 24 && (!out.length || c.x - out[out.length - 1][0] > 14)) out.push([c.x, f.format(d).normalize('NFD').replace(/[^a-zA-Z]/g, '').slice(0, /^jui/i.test(f.format(d)) ? 4 : 3).toUpperCase()])
        }
      })
      return out
    }, [lang]),
  }

  useEffect(() => {
    const cv = canvas.current!, box = stage.current!, ctx = cv.getContext('2d')!
    const bg = document.createElement('canvas')
    bg.width = LW; bg.height = LH
    paint(bg.getContext('2d')!)
    const calm = prefersReducedMotion()
    // con pantallas densas y chicas se dibuja más grande y se reduce: los píxeles quedan parejos a cualquier ancho
    let k = 1
    const rnd = rng(Date.now() & 0xffff)
    const S = {
      mode: 'demo' as Mode, x: LW / 2, tx: LW / 2, cool: 0, time: 0, got: 0, broken: 0, fixed: 0, lives: 3, safe: 0, triple: 0, idle: 0, key: 0, shake: 0, aim: null as Cell | null, rest: 0,
      shots: [] as { x: number; y: number; v: number }[], bugs: [] as { x: number; y: number; v: number; p: number }[], stars: [] as { x: number; y: number }[],
      bits: [] as { x: number; y: number; vx: number; vy: number; a: number; c: string }[], pops: [] as { x: number; y: number; a: number; s: string }[],
    }
    const show = () => {
      const w = words.current
      if (score.current) score.current.textContent = w.num.format(S.got)
      if (bugs.current) bugs.current.textContent = w.num.format(S.fixed)
    }
    const go = (m: Mode) => { S.mode = m; setMode(m); show() }
    const reset = (m: Mode) => {
      cells.forEach(c => { c.hp = c.lv; c.hit = 0 })
      Object.assign(S, { got: 0, broken: 0, fixed: 0, lives: 3, safe: 1, triple: 0, idle: 0, aim: null, rest: 0, shots: [], bugs: [], stars: [] })
      go(m)
    }
    const burst = (x: number, y: number, color: string, n: number) => { for (let i = 0; i < n; i++) S.bits.push({ x, y, vx: (rnd() - 0.5) * 70, vy: (rnd() - 0.65) * 60, a: 0.35 + rnd() * 0.35, c: color }) }

    const shoot = () => {
      S.shots.push({ x: S.x, y: SHIP_Y - 1, v: 0 })
      if (S.triple > 0) S.shots.push({ x: S.x - 3, y: SHIP_Y + 2, v: -26 }, { x: S.x + 3, y: SHIP_Y + 2, v: 26 })
      S.cool = S.mode === 'play' ? 0.15 : 0.21
    }
    const think = (dt: number) => {
      // piloto: esquiva el bug más cercano o va al próximo día con vida
      const near = S.bugs.find(b => b.y > 66 && Math.abs(b.x - S.x) < 12)
      if (near) S.tx = near.x
      else {
        if (!S.aim || S.aim.hp <= 0) {
          const live = cells.filter(c => c.hp > 0)
          S.aim = live.sort((a, b) => Math.abs(a.x - S.x) + a.y * -0.6 + rnd() * 26 - (Math.abs(b.x - S.x) + b.y * -0.6 + rnd() * 26))[0] ?? null
        }
        if (S.aim) S.tx = S.aim.x + 2
      }
      S.x += Math.max(-70 * dt, Math.min(70 * dt, S.tx - S.x))
      if (S.cool <= 0 && Math.abs(S.tx - S.x) < 2) shoot()
    }

    const update = (dt: number) => {
      S.time += dt
      S.cool -= dt; S.safe -= dt; S.triple -= dt; S.shake = Math.max(0, S.shake - dt)
      if (S.mode === 'demo') think(dt)
      else if (S.mode === 'play') {
        S.idle += dt
        if (S.key) { S.tx = Math.max(6, Math.min(LW - 6, S.x + S.key * 40)); S.idle = 0; S.x += S.key * 130 * dt }
        else S.x += (S.tx - S.x) * Math.min(1, dt * 16)
        if (S.cool <= 0 && S.idle < 6) shoot()
        if (S.idle > 14) go('demo')
      }
      S.x = Math.max(6, Math.min(LW - 6, S.x))
      for (const s of S.shots) {
        s.y -= 165 * dt; s.x += s.v * dt
        const bug = S.bugs.find(b => Math.abs(b.x - s.x) < 4.5 && Math.abs(b.y - s.y) < 4.5)
        if (bug) { S.bugs.splice(S.bugs.indexOf(bug), 1); s.y = -99; S.fixed++; burst(bug.x, bug.y, '#ff5a1f', 8); show(); continue }
        if (s.y > GY - 2 && s.y < GY + 7 * PITCH) {
          const c = cells.find(q => q.hp > 0 && s.x >= q.x - 0.5 && s.x < q.x + CELL + 0.5 && s.y >= q.y - 0.5 && s.y < q.y + CELL + 0.5)
          if (c) {
            s.y = -99; c.hp--; c.hit = 0.09
            if (c.hp <= 0) {
              S.got += c.day[1]; S.broken++
              burst(c.x + 2, c.y + 2, LEVELS[c.lv], 4 + c.lv * 3)
              S.pops.push({ x: c.x - 2, y: c.y, a: 0.9, s: `+${c.day[1]}` })
              if (S.pops.length > 14) S.pops.shift()
              if (rnd() < 0.2 && S.bugs.length < 4) S.bugs.push({ x: c.x + 2, y: c.y + 4, v: 17 + rnd() * 13 + S.broken * 0.06, p: rnd() * 6 })
              if (S.broken % 24 === 0) S.stars.push({ x: c.x + 2, y: c.y })
              show()
              if (S.broken >= activeDays) { if (S.mode === 'play') go('win'); else S.rest = 2.5 }
            }
          }
        }
      }
      S.shots = S.shots.filter(s => s.y > 6)
      for (const b of S.bugs) {
        b.y += b.v * dt; b.x += Math.sin(S.time * 2.4 + b.p) * 16 * dt
        if (b.y > FLOOR) { burst(b.x, FLOOR, '#ff8a4a', 6); b.y = 999 }
        else if (S.mode === 'play' && S.safe <= 0 && Math.abs(b.x - S.x) < 7 && Math.abs(b.y - SHIP_Y - 4) < 6) {
          b.y = 999; S.lives--; S.safe = 1.6; S.shake = 0.3
          burst(S.x, SHIP_Y + 4, '#f3efe7', 14)
          show()
          if (S.lives <= 0) go('over')
        }
      }
      S.bugs = S.bugs.filter(b => b.y < 400)
      for (const s of S.stars) {
        s.y += 26 * dt
        if (Math.abs(s.x - S.x) < 9 && Math.abs(s.y - SHIP_Y - 3) < 8) { s.y = 999; S.triple = 7; burst(S.x, SHIP_Y, '#ffd166', 10) }
      }
      S.stars = S.stars.filter(s => s.y < FLOOR)
      for (const p of S.bits) { p.a -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 90 * dt }
      S.bits = S.bits.filter(p => p.a > 0)
      for (const p of S.pops) { p.a -= dt; p.y -= 9 * dt }
      S.pops = S.pops.filter(p => p.a > 0)
      cells.forEach(c => { if (c.hit > 0) c.hit -= dt })
      if (S.rest > 0 && (S.rest -= dt) <= 0) reset('demo')
    }

    const render = () => {
      ctx.setTransform(k, 0, 0, k, 0, 0)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(bg, 0, 0)
      if (S.shake > 0) ctx.translate(Math.round((rnd() - 0.5) * 4), Math.round((rnd() - 0.5) * 3))
      for (const [x, m] of words.current.months) text(ctx, m, x, GY - 9, '#8b84b0')
      for (const c of cells) {
        if (!c.lv) { ctx.fillStyle = LEVELS[0]; ctx.globalAlpha = 0.75; ctx.fillRect(c.x, c.y, CELL, CELL); ctx.globalAlpha = 1; continue }
        if (c.hp <= 0) { ctx.fillStyle = LEVELS[c.lv]; ctx.globalAlpha = 0.16; ctx.fillRect(c.x, c.y, CELL, CELL); ctx.globalAlpha = 1; continue }
        ctx.fillStyle = c.hit > 0 ? '#ffffff' : LEVELS[c.hp]
        ctx.fillRect(c.x, c.y, CELL, CELL)
        if (c.lv > 2) { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(c.x, c.y, 1, 1) }
      }
      for (const s of S.shots) { ctx.fillStyle = '#ffd9a0'; ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 3); ctx.fillStyle = '#ff5a1f'; ctx.fillRect(Math.round(s.x), Math.round(s.y) + 3, 1, 2) }
      for (const b of S.bugs) draw(ctx, BUG[Math.floor(S.time * 6 + b.p) & 1], b.x - 3, b.y - 3, ch => (ch === 'O' ? '#fff' : '#ff4b5c'))
      for (const s of S.stars) draw(ctx, STAR, s.x - 3, s.y - 3, () => (Math.floor(S.time * 8) & 1 ? '#ffd166' : '#fff3c4'))
      for (const p of S.bits) { ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1) }
      for (const p of S.pops) text(ctx, p.s, Math.round(p.x), Math.round(p.y), p.a > 0.3 ? '#f3efe7' : '#8b84b0')
      if (S.mode !== 'over' && (S.safe <= 0 || S.mode !== 'play' || Math.floor(S.time * 12) & 1)) {
        draw(ctx, SHIP, S.x - 5, SHIP_Y, ch => INK[ch])
        const f = 2 + (Math.floor(S.time * 14) & 1)
        ctx.fillStyle = S.triple > 0 ? '#ffd166' : '#5cc8ff'
        ctx.fillRect(Math.round(S.x) - 1, SHIP_Y + 9, 2, f)
      }
      if (S.mode === 'play') for (let i = 0; i < S.lives; i++) draw(ctx, HEART, LW - 18 - i * 7, 60, () => '#ff4b5c')
    }

    // Que cada píxel del juego ocupe un número entero de píxeles de pantalla
    const fit = () => {
      const dpr = window.devicePixelRatio || 1, room = root.current!.parentElement!.clientWidth, n = Math.max(1, Math.floor((room * dpr) / LW))
      k = small ? n + 1 : 1
      if (cv.width !== LW * k) { cv.width = LW * k; cv.height = LH * k; cv.style.imageRendering = small ? 'auto' : '' ; render() }
      root.current!.style.setProperty('--w', small ? '100%' : `${(LW * n) / dpr}px`)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(root.current!.parentElement!)
    render()
    show()

    let raf = 0, visible = false, last = 0
    const loop = (now: number) => {
      raf = 0
      if (!visible) return
      const dt = Math.min((now - (last || now)) / 1000, 0.04)
      last = now
      if (!calm || S.mode === 'play') update(dt)
      render()
      raf = requestAnimationFrame(loop)
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      last = 0
      if (visible && !raf) raf = requestAnimationFrame(loop)
    })
    io.observe(box)

    const at = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * LW, ((e.clientY - r.top) / r.height) * LH] }
    const start = () => {
      S.idle = 0
      if (S.mode === 'play') return
      reset('play')
      // si la pantalla del juego no entra entera, se centra
      const r = box.getBoundingClientRect()
      if (r.top < 70 || r.bottom > innerHeight - 70) travelTo(scrollY + r.top - Math.max(70, (innerHeight - r.height) / 2))
    }
    const down = (e: PointerEvent) => { S.tx = at(e)[0]; start() }
    const move = (e: PointerEvent) => {
      const [x, y] = at(e)
      if (S.mode === 'play') { S.tx = x; S.idle = 0 }
      const c = cells.find(q => x >= q.x && x < q.x + PITCH && y >= q.y && y < q.y + PITCH)
      const w = words.current
      if (tip.current) tip.current.textContent = c ? `${w.long(c.day[0])} · ${w.num.format(c.day[1])}` : ''
    }
    const out = () => { if (tip.current) tip.current.textContent = '' }
    const keys = (e: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'Space', 'Enter'].includes(e.code)) return
      if (e.type === 'keydown') {
        e.preventDefault()
        start()
        if (e.code === 'ArrowLeft') S.key = -1
        if (e.code === 'ArrowRight') S.key = 1
      } else if ((e.code === 'ArrowLeft' && S.key < 0) || (e.code === 'ArrowRight' && S.key > 0)) { S.key = 0; S.tx = S.x }
    }
    const blur = () => { S.key = 0 }
    cv.addEventListener('pointerdown', down)
    cv.addEventListener('pointermove', move)
    cv.addEventListener('pointerleave', out)
    cv.addEventListener('keydown', keys)
    cv.addEventListener('keyup', keys)
    cv.addEventListener('blur', blur)
    return () => {
      ro.disconnect(); io.disconnect(); cancelAnimationFrame(raf)
      cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerleave', out)
      cv.removeEventListener('keydown', keys); cv.removeEventListener('keyup', keys); cv.removeEventListener('blur', blur)
    }
  }, [])

  const hint = mode === 'over' ? g.over : mode === 'win' ? g.win : mode === 'demo' ? g.start : ''
  const stats: [string, string][] = [
    [num.format(github.total), g.total],
    [num.format(streak), g.streak],
    [num.format(record[1]), `${g.record} · ${long(record[0])}`],
    [num.format(github.repos), g.repos],
  ]
  return (
    <div className="gh">
      <div ref={root} className="gh-in" data-ui>
        <div className="gh-head">
          <a href={links.github} target="_blank" rel="noreferrer"><GithubIcon size={20} /> github.com/{github.user}</a>
          <p><span>{g.score} <b ref={score}>0</b></span><span>{g.bugs} <b ref={bugs}>0</b></span></p>
        </div>
        <div ref={stage} className="gh-stage">
          <canvas ref={canvas} className="gh-canvas" width={LW} height={LH} tabIndex={0} role="img" aria-label={`${g.label}. ${num.format(github.total)} ${g.total}.`} />
          {hint && <span className={`gh-hint ${mode === 'demo' ? '' : 'is-end'}`}>{hint}</span>}
        </div>
        <p className="gh-note"><span>{g.hint}</span><span ref={tip} className="gh-tip" aria-hidden /></p>
        <dl className="gh-stats">
          {stats.map(([v, k]) => <div key={k}><dd>{v}</dd><dt>{k}</dt></div>)}
        </dl>
      </div>
    </div>
  )
}
