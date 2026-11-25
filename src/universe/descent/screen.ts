// Lo que se ve en el monitor: el inicio de este mismo sitio, con el texto en el idioma elegido.

export type ScreenText = { name: string; role: string; lead: string; projects: string; contact: string; nav: string[] }

const FONT = '"Bricolage Grotesque Variable", system-ui, sans-serif'

function wrap(c: CanvasRenderingContext2D, text: string, max: number) {
  const out: string[] = []
  let line = ''
  for (const w of text.split(' ')) {
    const next = line ? `${line} ${w}` : w
    if (line && c.measureText(next).width > max) { out.push(line); line = w } else line = next
  }
  return [...out, line]
}

export async function drawScreen(cv: HTMLCanvasElement, t: ScreenText, width: number) {
  const img = new Image()
  img.src = '/universe/hero-screen.webp'
  await Promise.all([img.decode(), document.fonts?.load(`400 40px ${FONT}`).catch(() => {}), document.fonts?.load(`700 40px ${FONT}`).catch(() => {})])
  const W = 1920, k = width / W
  cv.width = width
  cv.height = Math.round((width * 9) / 16)
  const c = cv.getContext('2d')!
  c.drawImage(img, 0, 0, cv.width, cv.height)
  c.scale(k, k)
  c.textBaseline = 'alphabetic'
  c.fillStyle = '#f4f1ec'
  c.font = `700 24px ${FONT}`
  c.fillText(t.name, 84, 52)
  c.font = `500 21px ${FONT}`
  c.fillStyle = '#c9ccd6'
  let x = 620
  for (const n of t.nav) { c.fillText(n, x, 52); x += c.measureText(n).width + 42 }
  // nombre, en dos renglones si hace falta
  c.fillStyle = '#f4f1ec'
  c.font = `400 172px ${FONT}`
  if ('letterSpacing' in c) (c as unknown as { letterSpacing: string }).letterSpacing = '-8px'
  const [first, ...rest] = t.name.split(' ')
  const lines = [first, rest.join(' ')]
  let y = 530 - lines.length * 76
  for (const l of lines) { c.fillText(l, 84, y); y += 152 }
  if ('letterSpacing' in c) (c as unknown as { letterSpacing: string }).letterSpacing = '0px'
  y -= 152 - 78
  c.font = `600 30px ${FONT}`
  c.fillStyle = '#ff7a4a'
  c.fillText(t.role, 84, y)
  c.font = `400 27px ${FONT}`
  c.fillStyle = '#e2e3e8'
  y += 50
  for (const l of wrap(c, t.lead, 620)) { c.fillText(l, 84, y); y += 40 }
  y += 14
  const button = (label: string, bx: number, fill: boolean) => {
    c.font = `600 23px ${FONT}`
    const w = c.measureText(label).width + 60
    c.beginPath()
    c.roundRect(bx, y, w, 62, 31)
    if (fill) { c.fillStyle = '#ff5a1f'; c.fill() } else { c.strokeStyle = 'rgba(232,238,255,.5)'; c.lineWidth = 1.5; c.stroke() }
    c.fillStyle = fill ? '#160a04' : '#f4f1ec'
    c.fillText(label, bx + 30, y + 39)
    return bx + w + 16
  }
  button(t.contact, button(t.projects, 84, true), false)
}

const MONO = 'ui-monospace, "Cascadia Code", Consolas, Menlo, monospace'
const INKS = { k: '#c792ea', s: '#c3e88d', n: '#f78c6c', c: '#6b7394', f: '#82aaff', t: '#ffcb6b', d: '#d6deeb' }
// cada renglón: pares de color y texto
const CODE: [keyof typeof INKS, string][][] = [
  [['c', '// El viaje empieza y termina en el mismo píxel.']],
  [['k', 'export function '], ['f', 'blackHole'], ['d', '(ray: '], ['t', 'Vec3'], ['d', ', steps = '], ['n', '140'], ['d', ') {']],
  [['k', '  let '], ['d', 'h2 = '], ['f', 'dot'], ['d', '('], ['f', 'cross'], ['d', '(ray.o, ray.d))']],
  [['k', '  for '], ['d', '('], ['k', 'let '], ['d', 'i = '], ['n', '0'], ['d', '; i < steps; i++) {']],
  [['k', '    const '], ['d', 'r2 = '], ['f', 'dot'], ['d', '(ray.o, ray.o)']],
  [['d', '    ray.d.'], ['f', 'add'], ['d', '(ray.o, '], ['n', '-1.5'], ['d', ' * h2 / r2 ** '], ['n', '2.5'], ['d', ')']],
  [['d', '    ray.o.'], ['f', 'add'], ['d', '(ray.d, '], ['f', 'step'], ['d', '(r2))']],
  [['k', '    if '], ['d', '(r2 < '], ['n', '1'], ['d', ') '], ['k', 'return '], ['f', 'horizon'], ['d', '()']],
  [['d', '  }']],
  [['k', '  return '], ['f', 'sky'], ['d', '(ray.d)']],
  [['d', '}']],
  [],
  [['k', 'export default function '], ['t', 'Portfolio'], ['d', '() {']],
  [['k', '  const '], ['d', '{ t } = '], ['f', 'useI18n'], ['d', '()']],
  [['k', '  return '], ['d', '(']],
  [['d', '    <'], ['t', 'Universe'], ['d', '>']],
  [['d', '      <'], ['t', 'Hero'], ['f', ' name'], ['d', '='], ['s', '"Conrado De Napoli"'], ['d', ' />']],
  [['d', '      <'], ['t', 'Projects'], ['f', ' items'], ['d', '={t.projects.items} />']],
  [['d', '      <'], ['t', 'Contact'], ['d', ' />']],
  [['d', '    </'], ['t', 'Universe'], ['d', '>']],
  [['d', '  )']],
  [['d', '}']],
]
const FILES: [number, string][] = [[0, 'src'], [1, 'components'], [2, 'CommitGame.tsx'], [2, 'ProjectPanel.tsx'], [1, 'universe'], [2, 'BlackHole.tsx'], [2, 'Journey.ts'], [2, 'Room.tsx'], [2, 'warm.ts'], [1, 'i18n'], [2, 'content.ts'], [0, 'tools'], [1, 'room.py'], [0, 'package.json'], [0, 'vite.config.ts']]

/** El segundo monitor: el editor con el código de este sitio y la terminal. */
export async function drawCode(cv: HTMLCanvasElement, width: number) {
  await document.fonts?.load(`500 24px ${MONO}`).catch(() => {})
  const W = 1920, H = 1080, k = width / W
  cv.width = width
  cv.height = Math.round((width * 9) / 16)
  const c = cv.getContext('2d')!
  c.scale(k, k)
  c.textBaseline = 'middle'
  const box = (x: number, y: number, w: number, h: number, f: string) => { c.fillStyle = f; c.fillRect(x, y, w, h) }
  const write = (s: string, x: number, y: number, f: string, size = 25) => { c.font = `500 ${size}px ${MONO}`; c.fillStyle = f; c.fillText(s, x, y); return x + c.measureText(s).width }
  box(0, 0, W, H, '#0f1420')
  box(0, 0, 74, H, '#0a0e18')
  box(74, 0, 356, H, '#0c111c')
  box(430, 0, W - 430, 60, '#0a0e18')
  box(430, 0, 320, 60, '#0f1420')
  box(430, 0, 320, 3, '#ff5a1f')
  for (let i = 0; i < 5; i++) { c.strokeStyle = i ? '#4b5573' : '#d6deeb'; c.lineWidth = 3; c.strokeRect(24, 30 + i * 74, 26, 26) }
  FILES.forEach(([d, f], i) => {
    if (f === 'BlackHole.tsx') box(74, 44 + i * 46, 356, 44, '#1b2438')
    write(f, 100 + d * 26, 66 + i * 46, f.includes('.') ? '#aab4cf' : '#e8ecf6', 22)
  })
  write('BlackHole.tsx', 462, 32, '#e8ecf6', 23)
  write('warm.ts', 800, 32, '#66708f', 23)
  CODE.forEach((l, i) => {
    const y = 102 + i * 34
    write(String(i + 1).padStart(3), 452, y, '#3f4866', 22)
    let x = 526
    for (const [ink, s] of l) x = write(s, x, y, INKS[ink])
  })
  // minimapa
  CODE.forEach((l, i) => { let x = 1780; for (const [ink, s] of l) { const w = s.trim().length * 2.4; c.globalAlpha = 0.5; box(x, 86 + i * 9, w, 5, INKS[ink]); c.globalAlpha = 1; x += w + 3 } })
  box(430, 866, W - 430, H - 866, '#0a0e18')
  box(430, 864, W - 430, 2, '#222b42')
  write('>', 462, 902, '#ff5a1f'); write('npm run build', 492, 902, '#e8ecf6')
  write('✓', 462, 942, '#43e07c'); write('modules transformed', 492, 942, '#8d97b5')
  write('✓', 462, 982, '#43e07c'); write('built', 492, 982, '#8d97b5')
  write('>', 462, 1018, '#ff5a1f'); box(492, 1004, 14, 28, '#e8ecf6')
  box(0, H - 34, W, 34, '#ff5a1f')
  write('main', 92, H - 16, '#1c0a03', 20); write('TypeScript React', W - 260, H - 16, '#1c0a03', 20)
}
