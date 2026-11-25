import * as THREE from 'three'

// Líneas con grosor en píxeles (WebGL solo dibuja líneas de 1 px): cada curva es una cinta que se abre en pantalla.

export type Curve = { points: THREE.Vector3[]; seed?: number; width?: number }

/** Arma una geometría con todas las curvas. Atributos: aNext (punto siguiente), aSide, aT (0…1 a lo largo), aSeed, aW (grosor relativo). */
export function ribbons(curves: Curve[]) {
  let verts = 0, idx = 0
  for (const c of curves) { verts += c.points.length * 2; idx += (c.points.length - 1) * 6 }
  const pos = new Float32Array(verts * 3), next = new Float32Array(verts * 3), side = new Float32Array(verts), t = new Float32Array(verts), seed = new Float32Array(verts), w = new Float32Array(verts)
  const index = new Uint32Array(idx)
  let v = 0, k = 0
  const n = new THREE.Vector3()
  for (const c of curves) {
    const len = c.points.length, s = c.seed ?? Math.random()
    c.points.forEach((p, i) => {
      if (i < len - 1) n.copy(c.points[i + 1])
      else n.copy(p).multiplyScalar(2).sub(c.points[i - 1])
      for (const sd of [-1, 1]) {
        pos.set([p.x, p.y, p.z], v * 3)
        next.set([n.x, n.y, n.z], v * 3)
        side[v] = sd
        t[v] = i / (len - 1)
        seed[v] = s
        w[v] = c.width ?? 1
        v++
      }
      if (i < len - 1) { const a = v - 2; index.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], k); k += 6 }
    })
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aNext', new THREE.BufferAttribute(next, 3))
  g.setAttribute('aSide', new THREE.BufferAttribute(side, 1))
  g.setAttribute('aT', new THREE.BufferAttribute(t, 1))
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  g.setAttribute('aW', new THREE.BufferAttribute(w, 1))
  g.setIndex(new THREE.BufferAttribute(index, 1))
  return g
}

/** Vértice de cinta. Requiere uRes (px) y uWidth (px). Deja vT, vSeed, vS (−1…1 a lo ancho) y vW (mundo). */
export const ribbonVertex = /* glsl */ `
attribute vec3 aNext; attribute float aSide, aT, aSeed, aW;
uniform vec2 uRes; uniform float uWidth;
varying float vT, vSeed, vS; varying vec3 vW;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.);
  vec4 a = projectionMatrix * viewMatrix * w, b = projectionMatrix * modelViewMatrix * vec4(aNext, 1.);
  vec2 d = (b.xy / b.w - a.xy / a.w) * uRes;
  d = length(d) > 1e-4 ? normalize(d) : vec2(1., 0.);
  a.xy += vec2(-d.y, d.x) * aSide * uWidth * aW / uRes * a.w;
  gl_Position = a;
  vT = aT; vSeed = aSeed; vS = aSide; vW = w.xyz;
}`

export function circle(r: number, n = 96, tilt?: THREE.Quaternion, from = 0, to = Math.PI * 2) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / n
    const p = new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)
    return tilt ? p.applyQuaternion(tilt) : p
  })
}
