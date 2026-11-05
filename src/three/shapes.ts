// Figuras que puede formar el enjambre de partículas. Cada una devuelve n puntos (x, y, z) de radio ~1.3.

type Gen = (n: number) => Float32Array

const TAU = Math.PI * 2
const rnd = (a = 1) => (Math.random() - 0.5) * a

const sphere: Gen = n => {
  const out = new Float32Array(n * 3)
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const th = golden * i
    const R = 1.3 + rnd(0.06)
    out.set([Math.cos(th) * r * R, y * R, Math.sin(th) * r * R], i * 3)
  }
  return out
}

const knot: Gen = n => {
  const out = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const t = Math.random() * TAU
    const p = 2, q = 3
    const r = 0.55 * (2 + Math.cos(q * t))
    const cx = r * Math.cos(p * t), cy = r * Math.sin(p * t), cz = -0.55 * Math.sin(q * t)
    const a = Math.random() * TAU, tube = 0.16 * Math.sqrt(Math.random())
    out.set([cx + Math.cos(a) * tube, cy + Math.sin(a) * tube, cz + rnd(tube * 2)], i * 3)
  }
  return out
}

const galaxy: Gen = n => {
  const out = new Float32Array(n * 3)
  const arms = 3
  for (let i = 0; i < n; i++) {
    const r = Math.pow(Math.random(), 0.7) * 1.9
    const arm = (i % arms) / arms * TAU
    const spin = r * 2.6
    const spread = Math.pow(Math.random(), 3) * 0.45 * (Math.random() < 0.5 ? 1 : -1)
    const a = arm + spin + spread
    out.set([Math.cos(a) * r, rnd(0.12) * (1.9 - r) * 0.6, Math.sin(a) * r], i * 3)
  }
  return out
}

const helix: Gen = n => {
  const out = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const y = (Math.random() - 0.5) * 3
    const a = y * 2.4
    if (i % 6 === 0) {
      // Escalones entre las dos hebras
      const k = Math.random() * 2 - 1
      const ys = Math.round(y * 4) / 4
      const as = ys * 2.4
      out.set([Math.cos(as) * 0.7 * k, ys, Math.sin(as) * 0.7 * k], i * 3)
    } else {
      const s = i % 2 ? 0 : Math.PI
      out.set([Math.cos(a + s) * 0.7 + rnd(0.08), y, Math.sin(a + s) * 0.7 + rnd(0.08)], i * 3)
    }
  }
  return out
}

const wave: Gen = n => {
  const out = new Float32Array(n * 3)
  const side = Math.ceil(Math.sqrt(n))
  for (let i = 0; i < n; i++) {
    const x = ((i % side) / side - 0.5) * 3
    const z = (Math.floor(i / side) / side - 0.5) * 3
    const y = Math.sin(x * 2.2) * Math.cos(z * 2.2) * 0.35
    out.set([x, y, z], i * 3)
  }
  return out
}

const atom: Gen = n => {
  const out = new Float32Array(n * 3)
  const tilts = [0, Math.PI / 3, -Math.PI / 3]
  for (let i = 0; i < n; i++) {
    if (i % 5 === 0) {
      // Núcleo
      const v = [rnd(), rnd(), rnd()]
      const l = Math.hypot(...v) || 1
      const r = Math.cbrt(Math.random()) * 0.32
      out.set(v.map(c => (c / l) * r), i * 3)
      continue
    }
    // Cada órbita es un círculo en el plano xz girado sobre el eje z
    const t = tilts[i % 3], a = Math.random() * TAU, R = 1.35 + rnd(0.05)
    const px = Math.cos(a) * R, pz = Math.sin(a) * R
    out.set([px * Math.cos(t), px * Math.sin(t), pz], i * 3)
  }
  return out
}

export const shapes: Gen[] = [sphere, knot, galaxy, helix, wave, atom]
