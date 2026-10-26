import { AnimatePresence, motion, useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n/I18nProvider'
import { ease } from './motion'
import { Lock } from 'lucide-react'

/** Ventana de navegador con el dominio real del producto. */
export function BrowserFragment({ domain, word }: { domain: string; word: string }) {
  return (
    <div className="frag frag-browser" data-ui>
      <div className="browser-bar">
        <span className="browser-dots"><i /><i /><i /></span>
        <span className="browser-url">
          <Lock size={12} strokeWidth={2.2} aria-hidden />
          {domain}
        </span>
      </div>
      <div className="browser-body">
        <span className="browser-word">{word}<span className="browser-dot">.</span></span>
      </div>
    </div>
  )
}

/** Pantalla de título de videojuego. */
export function GameFragment() {
  const { t } = useI18n()
  return (
    <div className="frag frag-game" data-ui>
      <svg className="bones" viewBox="0 0 120 120" aria-hidden>
        <g fill="currentColor">
          <g transform="rotate(45 60 60)">
            <rect x="22" y="54" width="76" height="12" rx="6" />
            <circle cx="22" cy="52" r="9" /><circle cx="22" cy="68" r="9" />
            <circle cx="98" cy="52" r="9" /><circle cx="98" cy="68" r="9" />
          </g>
          <g transform="rotate(-45 60 60)">
            <rect x="22" y="54" width="76" height="12" rx="6" />
            <circle cx="22" cy="52" r="9" /><circle cx="22" cy="68" r="9" />
            <circle cx="98" cy="52" r="9" /><circle cx="98" cy="68" r="9" />
          </g>
        </g>
      </svg>
      <span className="game-title">TwoBones</span>
      <span className="game-start">{t.projects.game.start}</span>
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
export function CodeFragment() {
  const ref = useRef<HTMLPreElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' })
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
export function DiscordFragment() {
  const { t, lang } = useI18n()
  const d = t.projects.discord
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' })
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
            <span className={`dc-avatar ${who === d.user ? 'dc-avatar-user' : 'dc-avatar-other'}`}>{who[0].toUpperCase()}</span>
            <div>
              <span className="dc-name">{who}</span>
              <p>{text}</p>
            </div>
          </div>
        ))}
        {step >= 1 && (
          <motion.div className="dc-msg" {...msg}>
            <span className="dc-avatar dc-avatar-user">C</span>
            <div>
              <span className="dc-name">{d.user}</span>
              <p className="dc-cmd">{d.command}</p>
            </div>
          </motion.div>
        )}
        {step >= 3 && (
          <motion.div className="dc-msg" {...msg}>
            <span className="dc-avatar dc-avatar-bot">B</span>
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
