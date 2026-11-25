import type { Tier } from '../lib/perf'

// Cuánto se dibuja según el equipo. El recorrido es el mismo en todos: cambia la cantidad.
export type Quality = {
  msaa: number; bloomLevels: number; bloomStart: number; rift: boolean; warp: boolean
  maxPixels: number; maxDpr: number
  galaxy: number; gas: number; puffs: number; streaks: number; faint: number; rocks: number; ringBits: number
  bigTex: boolean; holeScale: number; holeSteps: number; detail: number
}

export function quality(tier: Tier, mobile: boolean): Quality {
  if (tier === 0 && !mobile) return {
    msaa: 4, bloomLevels: 6, bloomStart: 2, rift: true, warp: true, maxPixels: 3.3e6, maxDpr: 1.75,
    galaxy: 150000, gas: 7, puffs: 84, streaks: 3000, faint: 14000, rocks: 520, ringBits: 2600, bigTex: true, holeScale: 0.62, holeSteps: 120, detail: 5,
  }
  if (tier === 0) return {
    msaa: 2, bloomLevels: 5, bloomStart: 2, rift: true, warp: true, maxPixels: 1.1e6, maxDpr: 1.6,
    galaxy: 56000, gas: 4, puffs: 34, streaks: 900, faint: 5000, rocks: 170, ringBits: 700, bigTex: false, holeScale: 0.5, holeSteps: 64, detail: 4,
  }
  return {
    msaa: 0, bloomLevels: 4, bloomStart: 4, rift: false, warp: false, maxPixels: 8e5, maxDpr: 1,
    galaxy: 32000, gas: 3, puffs: 20, streaks: 500, faint: 3000, rocks: 90, ringBits: 300, bigTex: false, holeScale: 0.36, holeSteps: 44, detail: 3,
  }
}
