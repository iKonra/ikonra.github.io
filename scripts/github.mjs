// Trae los datos públicos de GitHub (el calendario de contribuciones y la cantidad de repositorios) y los guarda
// en src/data/github.json. Corre antes de cada build; sin conexión se conserva lo último que se guardó.
import { existsSync, writeFileSync } from 'node:fs'

const USER = 'iKonra'
const FILE = new URL('../src/data/github.json', import.meta.url)
const get = async url => {
  const r = await fetch(url, { headers: { 'user-agent': 'portfolio-build' }, signal: AbortSignal.timeout(12000) })
  if (!r.ok) throw new Error(`${r.status} ${url}`)
  return r
}

try {
  const html = await (await get(`https://github.com/users/${USER}/contributions`)).text()
  const user = await (await get(`https://api.github.com/users/${USER}`)).json()
  const counts = {}
  for (const m of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>\s*(No|[\d,]+) contribution/g)) counts[m[1]] = m[2] === 'No' ? 0 : Number(m[2].replace(/,/g, ''))
  const days = []
  for (const m of html.matchAll(/<td[^>]*ContributionCalendar-day[^>]*>/g)) {
    const at = k => m[0].match(new RegExp(`${k}="([^"]*)"`))?.[1]
    days.push([at('data-date'), counts[at('id')] ?? 0, Number(at('data-level'))])
  }
  days.sort((a, b) => (a[0] < b[0] ? -1 : 1))
  const total = days.reduce((a, d) => a + d[1], 0)
  if (days.length < 360 || !total || !user.public_repos) throw new Error('el calendario vino incompleto')
  writeFileSync(FILE, JSON.stringify({ user: USER, updated: days.at(-1)[0], repos: user.public_repos, total, days }) + '\n')
  console.log(`GitHub: ${total} contribuciones, ${user.public_repos} repositorios`)
} catch (e) {
  if (!existsSync(FILE)) throw e
  console.warn(`GitHub: se usan los datos guardados (${e.message})`)
}
