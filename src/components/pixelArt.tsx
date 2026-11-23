import type { CSSProperties, ReactNode } from 'react'
import type { IconName } from '../i18n/content'

// Sprites en pixel art. En los mapas: X = color principal, o = claro, d = oscuro, . = vacío.

// Mascota de TwoBones (la misma del mini juego). O = ojos.
export const SKULL = ['..XXXXX..', '.XXXXXXX.', 'XXXXXXXXX', 'XXOOXOOXX', 'XXOOXOOXX', 'XXXXXXXXX', '.XXX.XXX.', '..XXXXX..', '..X.X.X..']
export const BONE = ['XX.....XX', '.XXXXXXX.', '.XXXXXXX.', 'XX.....XX']

export function sprite(ctx: CanvasRenderingContext2D, map: string[], x: number, y: number, u: number, body: string, eye: string) {
  map.forEach((row, j) => [...row].forEach((c, i) => {
    if (c === '.') return
    ctx.fillStyle = c === 'O' ? eye : body
    ctx.fillRect(Math.round(x + i * u), Math.round(y + j * u), Math.ceil(u), Math.ceil(u))
  }))
}

const ICONS: Record<IconName, string[]> = {
  code: ['..........', '..........', '..........', '.XX.......', '..XX......', '...XX.....', '..XX......', '.XX..oooo.', '..........', '..........'],
  server: ['..........', 'XXXXXXXXXX', 'XoXXXXdddX', 'XXXXXXXXXX', '..........', 'XXXXXXXXXX', 'XoXXXXdddX', 'XXXXXXXXXX', '..........', '..........'],
  database: ['..........', '..XXXXXX..', '.XooooooX.', '.XXXXXXXX.', '.XddddddX.', '.XXXXXXXX.', '.XddddddX.', '.XXXXXXXX.', '..XXXXXX..', '..........'],
  plug: ['..........', '...X..X...', '...X..X...', '..XXXXXX..', '..XXXXXX..', '..XooooX..', '...XXXX...', '....XX....', '....XX....', '....dd....'],
  cloud: ['..........', '..........', '....XXX...', '..XXXXXXX.', '.XoXXXXXXX', 'XXXXXXXXXX', 'XXXXXXXXXX', '.dddddddd.', '..........', '..........'],
  window: ['XXXXXXXXXX', 'XoXoXXXXXX', 'XXXXXXXXXX', 'XddddddddX', 'XdoooodddX', 'XddddddddX', 'XdodddoddX', 'XddddddddX', 'XXXXXXXXXX', '..........'],
  game: ['..........', ...SKULL.map(r => `.${r}`)],
  tools: ['..........', '...XXXX...', '...X..X...', 'XXXXXXXXXX', 'XXXXXXXXXX', 'dddddddddd', 'XXXXooXXXX', 'XXXXXXXXXX', 'XXXXXXXXXX', '..........'],
}

/** Ícono de 10×10 píxeles dibujado con rectángulos SVG (nítido a cualquier tamaño). El color sale de la variable CSS --c. */
export function PixelIcon({ name, color, size = 44 }: { name: IconName; color: string; size?: number }) {
  const rects: ReactNode[] = []
  ICONS[name].forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const ch = row[x]
      if (ch === '.') { x++; continue }
      let end = x + 1
      while (end < row.length && row[end] === ch) end++
      rects.push(<rect key={`${y}-${x}`} x={x} y={y} width={end - x} height={1} className={`px-${ch === 'O' ? 'd' : ch}`} />)
      x = end
    }
  })
  return (
    <svg className="px-icon" viewBox="0 0 10 10" width={size} height={size} shapeRendering="crispEdges" style={{ '--c': color } as CSSProperties} aria-hidden>
      {rects}
    </svg>
  )
}
