import { AnimatePresence, motion, useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n/I18nProvider'
import { ease } from './motion'
import { isLite, prefersReducedMotion } from '../lib/perf'

// Sprites en pixel art: X = hueso, O = ojos
const SKULL = ['..XXXXX..', '.XXXXXXX.', 'XXXXXXXXX', 'XXOOXOOXX', 'XXOOXOOXX', 'XXXXXXXXX', '.XXX.XXX.', '..XXXXX..', '..X.X.X..']
const BONE = ['XX.....XX', '.XXXXXXX.', '.XXXXXXX.', 'XX.....XX']

function sprite(ctx: CanvasRenderingContext2D, map: string[], x: number, y: number, u: number, body: string, eye: string) {
  map.forEach((row, j) => [...row].forEach((c, i) => {
    if (c === '.') return
    ctx.fillStyle = c === 'O' ? eye : body
    ctx.fillRect(Math.round(x + i * u), Math.round(y + j * u), Math.ceil(u), Math.ceil(u))
  }))
}

/** Mini juego de TwoBones: una calavera que salta huesos. Tocá, hacé click o apretá espacio. */
export function GameFragment({ play = true }: { play?: boolean }) {
  const { t } = useI18n()
  const canvas = useRef<HTMLCanvasElement>(null)
  const jumpRef = useRef<() => void>(() => {})
  const [state, setState] = useState<'idle' | 'run' | 'over'>('idle')

  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const ctx = c.getContext('2d')!
    let w = 0, h = 0, u = 4, raf = 0, last = 0, visible = false
    const dpr = Math.min(devicePixelRatio, 2)
    // Con "reducir movimiento" o en equipos lentos el fondo queda quieto hasta que se juega
    const calm = prefersReducedMotion() || isLite()
    const g = { y: 0, vy: 0, speed: 0, dist: 0, obstacles: [] as { x: number; tall: boolean }[], mode: 'idle' as 'idle' | 'run' | 'over' }
    const stars = Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random() * 0.6, s: Math.random() }))

    const resize = () => {
      const r = c.getBoundingClientRect()
      w = r.width; h = r.height
      c.width = w * dpr; c.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      u = Math.max(2, h / 70)
      draw()
    }
    const ground = () => h * 0.8
    const reset = () => { g.y = 0; g.vy = 0; g.speed = w * 0.45; g.dist = 0; g.obstacles = [{ x: w + 40, tall: false }] }

    const draw = () => {
      ctx.fillStyle = '#0b0a09'; ctx.fillRect(0, 0, w, h)
      stars.forEach(s => {
        const x = ((s.x * w - g.dist * (0.05 + s.s * 0.1)) % w + w) % w
        ctx.fillStyle = `rgba(243,239,231,${0.2 + s.s * 0.5})`
        ctx.fillRect(Math.round(x), Math.round(s.y * h), Math.ceil(u * 0.5), Math.ceil(u * 0.5))
      })
      // Colinas lejanas en bloques
      ctx.fillStyle = '#1d1a17'
      for (let i = -1; i < w / (u * 12) + 2; i++) {
        const x = i * u * 12 - ((g.dist * 0.3) % (u * 12))
        const hh = (3 + ((i + Math.floor(g.dist * 0.3 / (u * 12))) % 4 + 4) % 4) * u * 2
        ctx.fillRect(Math.round(x), Math.round(ground() - hh), Math.ceil(u * 12), Math.ceil(hh))
      }
      ctx.fillStyle = '#2a2622'; ctx.fillRect(0, ground(), w, h - ground())
      ctx.fillStyle = '#3a342e'
      for (let x = -((g.dist) % (u * 6)); x < w; x += u * 6) ctx.fillRect(Math.round(x), Math.round(ground() + u * 2), Math.ceil(u * 2), Math.ceil(u))
      g.obstacles.forEach(o => {
        sprite(ctx, BONE, o.x, ground() - 4 * u, u, '#efe4cf', '#efe4cf')
        if (o.tall) sprite(ctx, BONE, o.x, ground() - 8 * u, u, '#efe4cf', '#efe4cf')
      })
      sprite(ctx, SKULL, w * 0.16, ground() - 9 * u - g.y, u, '#f3efe7', '#ff5a1f')
    }

    const step = (time: number) => {
      raf = 0
      const dt = Math.min((time - (last || time)) / 1000, 0.05)
      last = time
      if (g.mode === 'run') {
        g.speed += dt * w * 0.012
        g.dist += g.speed * dt
        g.vy -= h * 3.4 * dt
        g.y = Math.max(0, g.y + g.vy * dt)
        if (g.y === 0) g.vy = 0
        g.obstacles.forEach(o => { o.x -= g.speed * dt })
        g.obstacles = g.obstacles.filter(o => o.x > -10 * u)
        const lastOb = g.obstacles[g.obstacles.length - 1]
        if (!lastOb || lastOb.x < w - (w * 0.35 + Math.random() * w * 0.5)) g.obstacles.push({ x: w + 10, tall: Math.random() < 0.3 })
        // Choque: caja de la calavera contra la de cada hueso
        const px = w * 0.16 + u, pw = 7 * u, py = g.y
        if (g.obstacles.some(o => o.x < px + pw && o.x + 9 * u > px && py < (o.tall ? 8 : 4) * u - u)) { g.mode = 'over'; setState('over') }
      } else if (!calm) {
        g.dist += w * 0.06 * dt
      }
      draw()
      if (visible && (g.mode === 'run' || !calm)) raf = requestAnimationFrame(step)
    }
    const kick = () => { if (!raf && visible) { last = 0; raf = requestAnimationFrame(step) } }

    jumpRef.current = () => {
      if (g.mode !== 'run') { reset(); g.mode = 'run'; setState('run') }
      if (g.y === 0) g.vy = h * 1.25
      kick()
    }

    const ro = new ResizeObserver(resize)
    ro.observe(c)
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting && play; kick() })
    io.observe(c)
    resize()
    return () => { ro.disconnect(); io.disconnect(); cancelAnimationFrame(raf) }
  }, [play])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jumpRef.current() }
  }

  return (
    <div className="frag frag-game" data-ui>
      <canvas
        ref={canvas}
        className="game-canvas"
        tabIndex={0}
        role="img"
        aria-label={t.projects.game.label}
        onPointerDown={() => jumpRef.current()}
        onKeyDown={onKey}
        data-cursor={t.projects.game.cursor}
      />
      <span className="game-brand">TwoBones</span>
      {state !== 'run' && <span className="game-hint">{state === 'over' ? t.projects.game.over : t.projects.game.hint}</span>}
    </div>
  )
}

const code: [string, string][][] = [
  [['k', 'export async function '], ['f', 'GET'], ['p', '(req: Request) {']],
  [['p', '  const '], ['v', 'orders'], ['p', ' = '], ['k', 'await '], ['v', 'db'], ['p', '.order.'], ['f', 'findMany'], ['p', '({']],
  [['p', '    where: { status: '], ['s', "'pending'"], ['p', ' },']],
  [['p', '    take: '], ['n', '50'], ['p', ',']],
  [['p', '  })']],
  [['k', '  return '], ['v', 'Response'], ['p', '.'], ['f', 'json'], ['p', '(orders)']],
  [['p', '}']],
]

/** Fragmento de código real, línea por línea al entrar en pantalla. */
export function CodeFragment({ play = true }: { play?: boolean }) {
  const ref = useRef<HTMLPreElement>(null)
  const seen = useInView(ref, { once: true, margin: '0px 0px -15% 0px' })
  const inView = seen && play
  return (
    <div className="frag frag-code" data-ui>
      <div className="code-tab">api/orders/route.ts</div>
      <pre ref={ref}>
        <code>
          {code.map((line, i) => (
            <motion.span
              key={i}
              className="code-line"
              initial={{ opacity: 0, x: -8 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.15 + i * 0.07, duration: 0.4, ease: ease.out }}
            >
              <span className="ln">{i + 1}</span>
              {line.map(([c, txt], j) => <span key={j} className={`t-${c}`}>{txt}</span>)}
              {'\n'}
            </motion.span>
          ))}
        </code>
      </pre>
    </div>
  )
}

/** Conversación de Discord: el comando, el bot escribiendo y su respuesta. */
export function DiscordFragment({ play = true }: { play?: boolean }) {
  const { t, lang } = useI18n()
  const d = t.projects.discord
  const ref = useRef<HTMLDivElement>(null)
  const seen = useInView(ref, { once: true, margin: '0px 0px -20% 0px' })
  // Una vez que arrancó la conversación, no se corta aunque el panel deje de estar activo
  const [started, setStarted] = useState(false)
  if (seen && play && !started) setStarted(true)
  const inView = started
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!inView) return
    setStep(1)
    const a = setTimeout(() => setStep(2), 700)
    const b = setTimeout(() => setStep(3), 2000)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [inView, lang])

  const msg = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: ease.out },
  }

  return (
    <div ref={ref} className="frag frag-discord" data-ui>
      <div className="dc-head"><span className="dc-hash">#</span>{d.channel}</div>
      <div className="dc-body">
        {d.history.map(([who, text], i) => (
          <div key={i} className="dc-msg">
            <span className={`dc-avatar ${who === 'conra' ? 'dc-avatar-user' : 'dc-avatar-other'}`}>{who[0].toUpperCase()}</span>
            <div>
              <span className="dc-name">{who}</span>
              <p>{text}</p>
            </div>
          </div>
        ))}
        {step >= 1 && (
          <motion.div className="dc-msg" {...msg}>
            <span className="dc-avatar dc-avatar-other">{d.user[0].toUpperCase()}</span>
            <div>
              <span className="dc-name">{d.user}</span>
              <p className="dc-cmd">{d.command}</p>
            </div>
          </motion.div>
        )}
        {step >= 3 && (
          <motion.div className="dc-msg" {...msg}>
            <span className="dc-avatar dc-avatar-bot">{d.bot[0]}</span>
            <div>
              <span className="dc-name">{d.bot} <span className="dc-badge">BOT</span></span>
              <p>{d.reply}</p>
            </div>
          </motion.div>
        )}
      </div>
      <div className="dc-typing">
        <AnimatePresence>
          {step === 2 && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <span className="dc-dots"><i /><i /><i /></span> {d.typing}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
