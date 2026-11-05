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

const ringed: Gen = n => {
  const out = new Float32Array(n * 3)
  const golden = Math.PI * (3 - Math.sqrt(5))
  const body = Math.floor(n * 0.55)
  for (let i = 0; i < n; i++) {
    if (i < body) {
      // Planeta
      const y = 1 - (i / (body - 1)) * 2
      const r = Math.sqrt(1 - y * y), th = golden * i, R = 0.8
      out.set([Math.cos(th) * r * R, y * R, Math.sin(th) * r * R], i * 3)
    } else {
      // Anillos, con un hueco como la división de Cassini
      let rr = 1.1 + Math.random() * 0.75
      if (rr > 1.45 && rr < 1.52) rr += 0.08
      const a = Math.random() * TAU
      out.set([Math.cos(a) * rr, rnd(0.03), Math.sin(a) * rr], i * 3)
    }
  }
  return out
}

const blackHole: Gen = n => {
  const out = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    if (i % 4 === 0) {
      // Anillo de fotones que rodea el horizonte, de canto a la cámara
      const a = Math.random() * TAU, R = 0.62 + rnd(0.04)
      out.set([Math.cos(a) * R, Math.sin(a) * R, rnd(0.03)], i * 3)
    } else {
      // Disco de acreción: más denso cerca del centro, vacío adentro
      const r = 0.72 + Math.pow(Math.random(), 2.2) * 1.3
      const a = Math.random() * TAU
      out.set([Math.cos(a) * r, rnd(0.04) * r, Math.sin(a) * r], i * 3)
    }
  }
  return out
}

// 0 esfera, 1 nudo, 2 galaxia, 3 hélice, 4 planeta con anillos, 5 agujero negro
export const shapes: Gen[] = [sphere, knot, galaxy, helix, ringed, blackHole]
