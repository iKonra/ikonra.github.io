import { Orbit, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import { exploreFlag, pilotFlag, soundFlag } from '../lib/flags'
import { prefersReducedMotion } from '../lib/perf'
import { startPilot, stopPilot } from '../lib/scroll'

async function toggleSound() {
  const on = !soundFlag.get()
  soundFlag.set(on)
  // el sintetizador se descarga recién cuando alguien lo prende
  const m = await import('../universe/sound')
  if (soundFlag.get()) await m.startSound()
  else m.stopSound()
}

/** Piloto automático, sonido y modo explorar: los mismos controles en la consola y en el menú del celular. */
export default function Tools({ labels = false, onUse }: { labels?: boolean; onUse?: () => void }) {
  const { t } = useI18n()
  const pilot = pilotFlag.use(), sound = soundFlag.use(), exploring = exploreFlag.use()
  const size = labels ? 20 : 17
  const items = [
    ...(prefersReducedMotion() ? [] : [{ id: 'pilot', on: pilot, label: pilot ? t.hud.pilotStop : t.hud.pilot, icon: pilot ? <Pause size={size} aria-hidden /> : <Play size={size} aria-hidden />, run: () => { if (pilot) stopPilot(); else startPilot(); onUse?.() } }]),
    { id: 'sound', on: sound, label: sound ? t.hud.soundOff : t.hud.sound, icon: sound ? <Volume2 size={size} aria-hidden /> : <VolumeX size={size} aria-hidden />, run: () => { void toggleSound() } },
    { id: 'explore', on: exploring, label: t.hud.explore, icon: <Orbit size={size} aria-hidden />, run: () => { exploreFlag.set(!exploring); onUse?.() } },
  ]
  return (
    <div className={`tools ${labels ? 'tools-labels' : ''}`}>
      {items.map(i => (
        <button key={i.id} className={`tool tool-${i.id}`} onClick={i.run} aria-pressed={i.on} aria-label={labels ? undefined : i.label}>
          {i.icon}
          <span className="tool-label">{i.label}</span>
        </button>
      ))}
    </div>
  )
}
