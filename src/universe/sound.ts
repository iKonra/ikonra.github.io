import { J, scrollToT, win } from './state'

// Sonido del viaje, sintetizado en el momento (sin archivos): un acorde por sector, un grave cerca del agujero negro,
// viento con la velocidad, campanas sueltas y cristales cuando el mouse abre la grieta. Arranca apagado.

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12)

const chords: [number, number[]][] = [
  [0, [38, 45, 52, 57, 61, 66]],
  [1, [43, 50, 57, 59, 62, 66]],
  [2.3, [40, 47, 52, 59, 64, 71]],
  [2.9, [33, 40, 45, 48, 52, 59]],
  [4.2, [41, 48, 53, 60, 64, 67]],
  [4.9, [38, 45, 53, 57, 60, 64]],
  [5.5, [36, 43, 52, 55, 59, 62]],
  [6.5, [40, 47, 50, 55, 59, 66]],
  [7.5, [35, 42, 50, 54, 57, 61]],
  [8.5, [43, 50, 54, 57, 62, 66]],
  [9.5, [40, 47, 54, 55, 62, 64]],
  [11.5, [41, 48, 52, 57, 60, 64]],
  [13.3, [43, 50, 55, 59, 62, 69]],
  [13.75, [38, 45, 50, 57, 62, 66]],
]

type Engine = {
  ctx: AudioContext; master: GainNode; bus: GainNode; wet: GainNode; filter: BiquadFilterNode
  voices: OscillatorNode[][]; sub: GainNode; wind: GainNode; windFilter: BiquadFilterNode; noise: AudioBuffer
}

let e: Engine | null = null
let timer = 0, bellAt = 0, chord = -1, kicked = false, hitAge = 99, tickAt = 0
let lx = 0, ly = 0, lt = 0

function impulse(ctx: AudioContext, seconds: number) {
  const n = Math.floor(ctx.sampleRate * seconds)
  const b = ctx.createBuffer(2, n, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c)
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6)
  }
  return b
}

function build(): Engine {
  const ctx = new AudioContext({ latencyHint: 'playback' })
  const master = ctx.createGain()
  master.gain.value = 0
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -20
  comp.ratio.value = 4
  master.connect(comp).connect(ctx.destination)

  const bus = ctx.createGain()
  const wet = ctx.createGain()
  const reverb = ctx.createConvolver()
  reverb.buffer = impulse(ctx, 4.2)
  const wetOut = ctx.createGain()
  wetOut.gain.value = 0.9
  bus.connect(master)
  wet.connect(reverb).connect(wetOut).connect(master)

  // ---- colchón: seis voces de dos osciladores desafinados
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 620
  filter.Q.value = 0.6
  const padDry = ctx.createGain(), padWet = ctx.createGain()
  padDry.gain.value = 0.35
  padWet.gain.value = 0.5
  filter.connect(padDry).connect(bus)
  filter.connect(padWet).connect(wet)
  const voices = chords[0][1].map((n, i) => {
    const g = ctx.createGain()
    g.gain.value = 0.055 - i * 0.004
    const lfo = ctx.createOscillator(), depth = ctx.createGain()
    lfo.frequency.value = 0.05 + i * 0.023
    depth.gain.value = 0.022
    lfo.connect(depth).connect(g.gain)
    lfo.start()
    const pan = ctx.createStereoPanner()
    pan.pan.value = (i % 2 ? 1 : -1) * 0.12 * i
    g.connect(pan).connect(filter)
    return [-5, 6].map((cents, k) => {
      const o = ctx.createOscillator()
      o.type = k ? 'triangle' : 'sawtooth'
      o.frequency.value = midi(n)
      o.detune.value = cents
      o.connect(g)
      o.start()
      return o
    })
  })

  // ---- grave del agujero negro
  const sub = ctx.createGain()
  sub.gain.value = 0
  for (const f of [32.7, 33.1, 65.6]) {
    const o = ctx.createOscillator()
    o.frequency.value = f
    o.connect(sub)
    o.start()
  }
  sub.connect(bus)

  // ---- viento de la velocidad
  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const d = noise.getChannelData(0)
  let b0 = 0
  for (let i = 0; i < d.length; i++) { b0 = b0 * 0.96 + (Math.random() * 2 - 1) * 0.04; d[i] = b0 * 6 }
  const src = ctx.createBufferSource()
  src.buffer = noise
  src.loop = true
  const windFilter = ctx.createBiquadFilter()
  windFilter.type = 'bandpass'
  windFilter.frequency.value = 300
  windFilter.Q.value = 0.8
  const wind = ctx.createGain()
  wind.gain.value = 0
  src.connect(windFilter).connect(wind)
  wind.connect(bus)
  wind.connect(wet)
  src.start()

  return { ctx, master, bus, wet, filter, voices, sub, wind, windFilter, noise }
}

function bell(n: number, level: number) {
  const { ctx, wet, bus } = e!
  const now = ctx.currentTime
  const o = ctx.createOscillator(), m = ctx.createOscillator(), md = ctx.createGain(), g = ctx.createGain(), pan = ctx.createStereoPanner()
  o.frequency.value = midi(n)
  m.frequency.value = midi(n) * 3.01
  md.gain.setValueAtTime(midi(n) * 1.4, now)
  md.gain.exponentialRampToValueAtTime(1, now + 1.4)
  g.gain.setValueAtTime(0, now)
  g.gain.linearRampToValueAtTime(level, now + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, now + 3.4)
  pan.pan.value = Math.random() * 1.4 - 0.7
  m.connect(md).connect(o.frequency)
  o.connect(g).connect(pan)
  pan.connect(wet)
  pan.connect(bus)
  o.start(now); m.start(now); o.stop(now + 3.5); m.stop(now + 3.5)
}

/** Cristal: un chasquido agudo y corto. */
function glass(level: number, x: number) {
  const { ctx, wet, bus } = e!
  const now = ctx.currentTime
  const o = ctx.createOscillator(), g = ctx.createGain(), pan = ctx.createStereoPanner()
  o.frequency.setValueAtTime(1900 + Math.random() * 2600, now)
  o.frequency.exponentialRampToValueAtTime(900 + Math.random() * 900, now + 0.16)
  g.gain.setValueAtTime(level, now)
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.2)
  pan.pan.value = Math.min(Math.max(x, -1), 1) * 0.8
  o.connect(g).connect(pan)
  pan.connect(wet)
  pan.connect(bus)
  o.start(now); o.stop(now + 0.22)
}

/** Golpe grave: la galaxia explota o se quiebra el espacio. */
function boom(level: number, seconds: number) {
  const { ctx, wet, bus, noise } = e!
  const now = ctx.currentTime
  const o = ctx.createOscillator(), g = ctx.createGain()
  o.frequency.setValueAtTime(110, now)
  o.frequency.exponentialRampToValueAtTime(26, now + seconds * 0.7)
  g.gain.setValueAtTime(level, now)
  g.gain.exponentialRampToValueAtTime(0.0001, now + seconds)
  o.connect(g).connect(bus)
  o.start(now); o.stop(now + seconds)
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), ng = ctx.createGain()
  s.buffer = noise
  f.type = 'lowpass'
  f.frequency.setValueAtTime(2600, now)
  f.frequency.exponentialRampToValueAtTime(120, now + seconds * 0.8)
  ng.gain.setValueAtTime(level * 0.7, now)
  ng.gain.exponentialRampToValueAtTime(0.0001, now + seconds)
  s.connect(f).connect(ng)
  ng.connect(bus)
  ng.connect(wet)
  s.start(now); s.stop(now + seconds)
}

function update() {
  if (!e) return
  const { ctx, voices, filter, sub, wind, windFilter } = e
  const now = ctx.currentTime
  const t = J.force ?? scrollToT(scrollY)
  let k = 0
  while (k < chords.length - 1 && t >= chords[k + 1][0]) k++
  if (k !== chord) {
    chord = k
    voices.forEach((v, i) => v.forEach(o => o.frequency.setTargetAtTime(midi(chords[k][1][i]), now, 0.5 + i * 0.12)))
  }
  const rush = Math.max(J.warp, J.tunnel)
  filter.frequency.setTargetAtTime(520 + rush * 1500 + (J.my + 1) * 160, now, 0.35)
  wind.gain.setTargetAtTime(J.warp * 0.16 + J.tunnel * 0.22, now, 0.25)
  windFilter.frequency.setTargetAtTime(240 + rush * 1900, now, 0.3)
  sub.gain.setTargetAtTime(win(t, 2.8, 3.3, 4.1, 4.5) * 0.14, now, 0.6)

  if (J.kick > 0.8 && !kicked) boom(0.5, 2.6)
  kicked = J.kick > 0.3
  if (J.hit.age < hitAge - 0.05) { boom(0.22, 1.1); for (let i = 0; i < 4; i++) setTimeout(() => e && glass(0.05, J.hit.x * 2 - 1), i * 45) }
  hitAge = J.hit.age

  if (now > bellAt) {
    bellAt = now + 2.2 + Math.random() * 4.5
    const notes = chords[chord][1]
    bell(notes[2 + Math.floor(Math.random() * 4)] + (Math.random() < 0.4 ? 36 : 24), 0.028)
  }
}

function onMove(ev: PointerEvent) {
  if (!e || ev.pointerType === 'touch') return
  const speed = Math.hypot(ev.clientX - lx, ev.clientY - ly) / Math.max(ev.timeStamp - lt, 1)
  lx = ev.clientX; ly = ev.clientY; lt = ev.timeStamp
  if (speed > 1.6 && ev.timeStamp > tickAt) {
    tickAt = ev.timeStamp + 70 + Math.random() * 60
    glass(Math.min(0.012 + speed * 0.006, 0.04), (ev.clientX / innerWidth) * 2 - 1)
  }
}

const onHide = () => { if (e) void (document.hidden ? e.ctx.suspend() : e.ctx.resume()) }

export async function startSound() {
  e ??= build()
  await e.ctx.resume()
  e.master.gain.cancelScheduledValues(e.ctx.currentTime)
  e.master.gain.setTargetAtTime(0.75, e.ctx.currentTime, 0.7)
  clearInterval(timer)
  timer = window.setInterval(update, 70)
  addEventListener('pointermove', onMove, { passive: true })
  document.addEventListener('visibilitychange', onHide)
}

export function stopSound() {
  clearInterval(timer)
  removeEventListener('pointermove', onMove)
  document.removeEventListener('visibilitychange', onHide)
  if (!e) return
  const { ctx, master } = e
  master.gain.setTargetAtTime(0, ctx.currentTime, 0.15)
  setTimeout(() => { if (master.gain.value < 0.02) void ctx.suspend() }, 900)
}
