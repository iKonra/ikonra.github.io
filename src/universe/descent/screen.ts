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
