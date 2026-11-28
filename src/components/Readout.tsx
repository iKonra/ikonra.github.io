import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useI18n } from '../i18n/I18nProvider'
import type { Dict } from '../i18n/content'
import type { Lang } from '../i18n/langs'
import { useTicker } from '../lib/ticker'
import { onProgress, progress } from '../universe/load'
import { ATLAS_COUNT, T, atlasIndex, distanceLy, lyToKm } from '../universe/state'

type Place = keyof Dict['hud']['places'] | number | `atlas-${number}` | 'atlas'

/** Dónde estamos: un lugar con nombre, o el número de mundo (proyecto). */
export function placeAt(t: number): Place {
  if (t < 0.85) return 'galaxy'
  if (t < 2.2) return 'nebula'
  if (t < 2.8) return 'jump'
  if (t < 4.08) return 'hole'
  if (t < 4.86) return 'wormhole'
  if (t < 9.03) return Math.min(4, Math.max(0, Math.round(t - 5)))
  if (t < T.atlas + 0.03) return 'wormhole'
  if (t < T.atlasOut - 0.03) { const i = atlasIndex(t); return i < 0 ? 'atlas' : `atlas-${i}` }
  if (t < T.atlasOut + 0.04) return 'jump'
  if (t < 11.5) return 'belt'
  if (t < 13.22) return 'saturn'
  if (t < 13.78) return 'moon'
  if (t < 14.7) return 'earth'
  if (t < 15.3) return 'clouds'
  if (t < 16.4) return 'city'
  if (t < 17.45) return 'window'
  if (t < 18.2) return 'room'
  if (t < 18.62) return 'screen'
  if (t < 19) return 'pixel'
  return t < 19.75 ? 'bang' : 'galaxy'
}

/** Qué mide el número: distancia a la Tierra, altura en la caída o distancia a la pantalla ya adentro. */
const measureAt = (t: number) => (t > T.atlas + 0.02 && t < T.atlasOut - 0.02 ? 'atlas' : t < 14.15 || t >= 19 ? 'distance' : t < 16.9 ? 'altitude' : 'toScreen')

function formatter(lang: Lang, hud: Dict['hud'], short: boolean) {
  const plain = new Intl.NumberFormat(lang, { maximumSignificantDigits: 3 })
  const big = new Intl.NumberFormat(lang, { notation: 'compact', compactDisplay: short ? 'short' : 'long', maximumSignificantDigits: 3 })
  return (ly: number) => {
    if (ly >= 0.06) return `${plain.format(ly)} ${hud.ly}`
    const km = lyToKm(ly)
    if (km < 1e-3) return km < 1e-5 ? `${plain.format(km * 1e6)} mm` : `${plain.format(km * 1e5)} cm`
    if (km < 1) return `${plain.format(km * 1e3)} m`
    return km >= 1e6 ? `${big.format(km)} ${hud.of && !short ? `${hud.of} ` : ''}km` : `${plain.format(km)} km`
  }
}

/** Nombre del lugar y distancia a la Tierra, en vivo. Es decorativo: los lectores de pantalla no lo anuncian en cada paso. */
export default function Readout({ short = false }: { short?: boolean }) {
  const { t, lang } = useI18n()
  const [place, setPlace] = useState<Place>('galaxy')
  const [kind, setKind] = useState<'distance' | 'altitude' | 'toScreen' | 'atlas'>('distance')
  const dist = useRef<HTMLSpanElement>(null)
  const prev = useRef(NaN)
  const format = useMemo(() => formatter(lang, t.hud, short), [lang, t, short])
  const load = useSyncExternalStore(onProgress, () => Math.round(progress() * 100), () => 0)
  const [loaded, setLoaded] = useState(false)
  useEffect(() => { if (load >= 100) setLoaded(true) }, [load])
  useEffect(() => { prev.current = NaN }, [format, loaded])

  useTicker(v => {
    setPlace(placeAt(v))
    const k = measureAt(v)
    setKind(k)
    if (!dist.current || Math.abs(v - prev.current) < 2e-4) return
    prev.current = v
    // en el atlas no hay distancia a la Tierra que valga: se muestra el estado del objeto (hipotético, futuro…)
    if (k === 'atlas') { const i = atlasIndex(v); dist.current.textContent = i < 0 ? `${t.atlas.place} · ${ATLAS_COUNT}` : `${t.atlas.items[i].status} · ${i + 1}/${ATLAS_COUNT}`; return }
    dist.current.textContent = format(distanceLy(v))
  })

  const name = typeof place === 'number' ? t.projects.items[place].title : place === 'atlas' ? t.atlas.title : place.startsWith('atlas-') ? t.atlas.items[Number(place.slice(6))].title : t.hud.places[place as keyof Dict['hud']['places']]
  const loading = !loaded && load > 0
  return (
    <p className="readout" aria-hidden>
      <span className="readout-place" key={String(place) + lang}>{name}</span>
      <span className="readout-label">{loading ? t.hud.loading : kind === 'atlas' ? t.atlas.status : t.hud[kind]}</span>
      {loading ? <span key="load" className="readout-value">{load} %</span> : <span key="dist" className="readout-value" ref={dist} />}
    </p>
  )
}
