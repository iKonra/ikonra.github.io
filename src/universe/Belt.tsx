import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { model, tex } from './assets'
import { hash, noise3 } from './glsl'
import { C, J, win } from './journey'
import { U, mulberry } from './shared'
import { Halo } from './worlds/common'
import type { Quality } from './quality'

// El cinturón de Kuiper: rocas modeladas en Blender (una sola textura horneada para todas) y un cometa que lo cruza.

type Rock = { p: THREE.Vector3; s: number; rx: number; ry: number; sp: number; axis: THREE.Vector3 }
const o = new THREE.Object3D(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color()

const tail = /* glsl */ `
varying vec2 vUv; uniform float uTime, uK, uIon;
${hash}
${noise3}
void main(){
  float x = vUv.x; // 0 en el núcleo
  float y = (vUv.y - .5) * 2.;
  float wide = mix(.05, uIon > .5 ? .22 : .9, pow(max(x, 0.), uIon > .5 ? .6 : .8));
  float n = fbm(vec3(x * 3.5 - uTime * .5, y / wide * 2.2, uIon * 9.), 5);
  float st = fbm(vec3(x * 1.2 - uTime * .35, y / wide * 7., 4.), 4);
  float f = exp(-pow(abs(y / wide), 2.) * 2.6) * pow(max(1. - x, 0.), 1.7) * (.75 + n * .9 + st * .7);
  vec3 c = uIon > .5 ? vec3(.30, .58, 1.) : vec3(1., .86, .66);
  gl_FragColor = vec4(c * max(f, 0.) * smoothstep(0., .02, x) * uK, 1.);
}`
const coma = /* glsl */ `
varying vec2 vUv; uniform float uK;
void main(){ float d = length(vUv - .5) * 2.; gl_FragColor = vec4(mix(vec3(.45, .9, .85), vec3(1.), exp(-d * d * 60.)) * (exp(-d * d * 60.) * 2.4 + exp(-d * 6.) * .9 + exp(-d * 2.6) * .16) * smoothstep(1., .5, d) * uK, 1.); }`
const uvVertex = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`

function Comet() {
  const root = useRef<THREE.Group>(null), tails = useRef<THREE.Group>(null)
  const m = useMemo(() => {
    const k = { value: 0 }
    const t = (ion: number) => new THREE.ShaderMaterial({ vertexShader: uvVertex, fragmentShader: tail, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: { uTime: U.time, uK: k, uIon: { value: ion } } })
    const g = new THREE.PlaneGeometry(1, 1, 1, 1)
    g.translate(0.5, 0, 0)
    return { k, a: t(0), b: t(1), g, coma: { uK: k } }
  }, [])
  useFrame(({ camera }) => {
    const r = root.current
    if (!r) return
    const f = win(J.t, 9.55, 10, 11.1, 11.6)
    r.visible = f > 0.01
    if (!r.visible) return
    m.k.value = f
    // cruza despacio, con el tiempo y con el scroll
    const u = ((U.time.value * 0.012 + (J.t - 10) * 0.16) % 1.3) - 0.15
    r.position.set(C.belt.x + 62 - u * 124, C.belt.y + 26 - u * 12, C.belt.z - 165)
    const t = tails.current
    if (t) {
      // la cola apunta siempre en contra de la luz
      t.quaternion.copy(camera.quaternion)
      t.rotateZ(0.16)
    }
  })
  return (
    <group ref={root}>
      <group ref={tails}>
        <mesh geometry={m.g} material={m.a} scale={[58, 15, 1]} rotation={[0, 0, -0.1]} renderOrder={-3} frustumCulled={false} />
        <mesh geometry={m.g} material={m.b} scale={[76, 9, 1]} renderOrder={-3} frustumCulled={false} />
      </group>
      <Halo size={9} fragment={coma} uniforms={m.coma} order={-2} />
    </group>
  )
}

export default function Belt({ q: qu }: { q: Quality }) {
  const group = useRef<THREE.Group>(null)
  const meshes = useRef<(THREE.InstancedMesh | null)[]>([])
  const [geos, setGeos] = useState<THREE.BufferGeometry[] | null>(null)

  useEffect(() => {
    let live = true
    model('rocks.glb').then(g => { if (live) setGeos([0, 1, 2, 3].map(i => (g.scene.getObjectByName(`rock_${i}`) as THREE.Mesh).geometry)) }).catch(() => {})
    return () => { live = false }
  }, [])

  const mat = useMemo(() => {
    const sfx = qu.bigTex ? '' : '-sm'
    return new THREE.MeshStandardMaterial({ map: tex(`rocks-color${sfx}.webp`, { aniso: 4, flipY: false }), normalMap: tex(`rocks-normal${sfx}.webp`, { srgb: false, aniso: 4, flipY: false }), normalScale: new THREE.Vector2(1.2, 1.2), roughness: 0.94, envMapIntensity: 0.5 })
  }, [qu.bigTex])

  const sets = useMemo(() => {
    const rnd = mulberry(404)
    const a = new THREE.Vector3(0, 1.4, 34), b = new THREE.Vector3(6, -1.5, -92), ab = b.clone().sub(a), p = new THREE.Vector3(), c = new THREE.Vector3()
    const out: Rock[][] = [[], [], [], []]
    for (let i = 0; i < qu.rocks; i++) {
      const z = 46 - rnd() * 250
      const u = THREE.MathUtils.clamp((z - a.z) / ab.z, -0.1, 1.2)
      c.copy(a).addScaledVector(ab, u)
      const ang = rnd() * 6.283, far = rnd()
      const s = 0.1 + Math.pow(rnd(), 3.2) * (far > 0.55 ? 4.6 : 1.5)
      const r = 2.6 + s * 1.8 + Math.pow(far, 1.5) * 52
      p.set(c.x + Math.cos(ang) * r, c.y + Math.sin(ang) * r * 0.5, z)
      out[i % 4].push({ p: p.clone(), s, rx: rnd() * 6.28, ry: rnd() * 6.28, sp: (0.04 + rnd() * 0.22) / (0.5 + s), axis: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize() })
    }
    return out
  }, [qu.rocks])

  useEffect(() => {
    if (!geos) return
    const rnd = mulberry(9)
    meshes.current.forEach((im, k) => {
      if (!im) return
      sets[k].forEach((_, i) => { im.setColorAt(i, col.setHSL(0.07 + rnd() * 0.5 * (rnd() > 0.6 ? 1 : 0.1), 0.08 + rnd() * 0.14, 0.72 + rnd() * 0.26)) })
      if (im.instanceColor) im.instanceColor.needsUpdate = true
    })
  }, [geos, sets])

  useFrame(() => {
    const g = group.current
    if (!g) return
    g.visible = J.t > 9.35 && J.t < 11.7
    if (!g.visible) return
    const t = U.time.value
    meshes.current.forEach((im, k) => {
      if (!im) return
      sets[k].forEach((r, i) => {
        o.position.copy(r.p)
        o.position.y += Math.sin(t * 0.15 + r.rx) * 0.12
        o.quaternion.setFromEuler(e.set(r.rx, r.ry, 0)).premultiply(q.setFromAxisAngle(r.axis, t * r.sp))
        o.scale.setScalar(r.s)
        o.updateMatrix()
        im.setMatrixAt(i, o.matrix)
      })
      im.instanceMatrix.needsUpdate = true
    })
  })

  return (
    <>
      <Comet />
      <group ref={group} position={C.belt}>
        {geos?.map((g, k) => <instancedMesh key={k} ref={el => { meshes.current[k] = el }} args={[g, mat, sets[k].length]} frustumCulled={false} />)}
      </group>
    </>
  )
}
