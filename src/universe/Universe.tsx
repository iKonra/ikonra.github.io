import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { degrade, prefersReducedMotion, useTier } from '../lib/perf'
import Atlas from './atlas/Atlas'
import Belt from './Belt'
import BlackHole from './BlackHole'
import City from './descent/City'
import Room from './descent/Room'
import Veil from './descent/Veil'
import type { ScreenText } from './descent/screen'
import Earth from './Earth'
import Env from './Env'
import Galaxy from './Galaxy'
import Meteors from './Meteors'
import Nebula from './Nebula'
import NebulaLayers from './NebulaLayers'
import Pipeline from './Pipeline'
import Rig from './Rig'
import Saturn from './Saturn'
import Ship from './Ship'
import Sky from './Sky'
import Streaks from './Streaks'
import Tunnel from './Tunnel'
import Bots from './worlds/Bots'
import Inti from './worlds/Inti'
import Tricapi from './worlds/Tricapi'
import TwoBones from './worlds/TwoBones'
import Web from './worlds/Web'
import { quality } from './quality'
import { J } from './state'

// Un único canvas fijo detrás de toda la página: el recorrido completo es una sola escena y un solo vuelo de cámara.

const SCALES = [1, 0.86, 0.74, 0.64]

/** Mide los fps. Si el equipo no los sostiene baja la resolución de a poco, y la recupera cuando vuelve a sobrar;
 *  solo si ni así alcanza, pasa al nivel liviano. Un bajón pasajero no deja la página fea para siempre. */
function Watchdog({ step, setStep }: { step: number; setStep: (n: number) => void }) {
  const s = useRef({ time: 0, frames: 0, warm: 5, slow: 0, good: 0, ups: 0 })
  useFrame((_, delta) => {
    const m = s.current
    if (!J.warm) return
    // un tirón suelto (otra pestaña, una textura que sube) no cuenta
    if (delta > 0.12) { m.warm = Math.max(m.warm, 1); m.time = 0; m.frames = 0; return }
    if (m.warm > 0) { m.warm -= delta; return }
    m.time += delta
    m.frames++
    if (m.time < 1) return
    const fps = m.frames / m.time
    m.time = 0
    m.frames = 0
    m.slow = fps < 40 ? m.slow + 1 : 0
    m.good = fps > 56 ? m.good + 1 : 0
    const last = step >= SCALES.length - 1
    if (m.slow >= (last ? 6 : 2) && (!last || fps < 30)) {
      m.slow = 0; m.good = 0; m.warm = 1.5
      if (last) degrade(); else setStep(step + 1)
    } else if (step > 0 && m.good >= 8 && m.ups < 3) { m.good = 0; m.warm = 1.5; m.ups++; setStep(step - 1) }
  })
  return null
}

/** En modo quieto la escena solo se redibuja al scrollear (o cuando termina de cargar algo). */
function RedrawOnScroll() {
  const invalidate = useThree(s => s.invalidate)
  useEffect(() => {
    let raf = 0
    const on = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; invalidate() }) }
    addEventListener('scroll', on, { passive: true })
    const id = setInterval(on, 700)
    const stop = setTimeout(() => clearInterval(id), 12000)
    on()
    return () => { removeEventListener('scroll', on); cancelAnimationFrame(raf); clearInterval(id); clearTimeout(stop) }
  }, [invalidate])
  return null
}

function Resolution({ dpr }: { dpr: (w: number, h: number) => number }) {
  const setDpr = useThree(s => s.setDpr)
  const size = useThree(s => s.size)
  useEffect(() => { setDpr(dpr(size.width, size.height)) }, [setDpr, dpr, size])
  return null
}

export default function Universe({ title, screen }: { title: string; screen: ScreenText }) {
  const tier = useTier()
  const mobile = useMemo(() => matchMedia('(max-width: 860px), (pointer: coarse)').matches, [])
  const still = useMemo(prefersReducedMotion, [])
  const q = useMemo(() => quality(tier, mobile), [tier, mobile])
  const [step, setStep] = useState(0)
  const dpr = useMemo(() => (w: number, h: number) => Math.min(q.maxDpr, devicePixelRatio || 1, Math.sqrt(q.maxPixels / Math.max(1, w * h))) * SCALES[step], [q, step])
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const on = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])

  return (
    <div className="universe" aria-hidden>
      <Canvas
        flat
        frameloop={hidden ? 'never' : tier === 2 || still ? 'demand' : 'always'}
        dpr={dpr(innerWidth, innerHeight)}
        camera={{ fov: 45, near: 0.1, far: 900, position: [0, 30, 92] }}
        gl={{ antialias: false, alpha: false, stencil: false, depth: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => { gl.setClearColor(new THREE.Color('#05060a'), 1) }}
      >
        <Resolution dpr={dpr} />
        <Rig still={still} />
        <Env />
        <Sky q={q} />
        <Streaks q={q} />
        <Galaxy q={q} />
        <NebulaLayers q={q} />
        <Nebula q={q} />
        <BlackHole q={q} title={title} />
        <Meteors />
        {/* el orden tiene que coincidir con el de los proyectos en content.ts */}
        <Tricapi detail={q.detail} />
        <Inti detail={q.detail} />
        <Web detail={q.detail} />
        <TwoBones big={q.bigTex} />
        <Bots />
        <Atlas q={q} />
        <Belt q={q} />
        <Saturn q={q} />
        <Earth q={q} />
        {!still && <><City q={q} /><Room q={q} text={screen} /><Veil /></>}
        <Tunnel />
        <Ship />
        <Pipeline q={q} />
        {tier === 2 || still ? <RedrawOnScroll /> : <Watchdog step={step} setStep={setStep} />}
      </Canvas>
    </div>
  )
}
