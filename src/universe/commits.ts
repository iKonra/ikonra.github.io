import github from '../data/github.json'

// Las contribuciones públicas en GitHub del último año, día por día (las baja scripts/github.mjs en cada build).
// La galaxia del inicio las dibuja como estrellas doradas y la interfaz muestra el detalle del día señalado.

export type CommitDay = { date: string; count: number; level: number; u: number }

const all = github.days as [string, number, number][]

/** Días con al menos una contribución. `u` es la posición en el año: 0 = hace un año, 1 = hoy. */
export const commitDays: CommitDay[] = all.flatMap(([date, count, level], i) => (count > 0 ? [{ date, count, level, u: i / Math.max(1, all.length - 1) }] : []))
export const commitTotal = commitDays.reduce((a, d) => a + d.count, 0)

/** Día que señala el cursor (índice en commitDays; -1 = ninguno) y dónde está en pantalla (px). */
export const commitTip = { day: -1, x: 0, y: 0 }
