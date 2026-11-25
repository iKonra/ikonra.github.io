import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { model } from './assets'
import { J, damp, pose, smooth } from './journey'
import { U } from './shared'
import { compileObject } from './warm'

// La nave acompaña todo el viaje (modelada en Blender). Vive en coordenadas de pantalla: no importa la escala de cada etapa,
// siempre ocupa el mismo lugar del encuadre. Pliega las alas al acelerar.

const DEPTH = 6
const flameVertex = /* glsl */ `
varying float vY;
uniform float uLen;
void main(){
  vY = position.z;
  vec3 p = position;
  p.z *= uLen;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`
const flameFragment = /* glsl */ `
varying float vY; uniform float uTime, uPower, uSeed; uniform vec3 uColor;
void main(){
  float y = clamp(vY, 0., 1.); // 0 en la tobera, 1 en la punta
  float f = pow(max(1. - y, 0.), 1.6) * (.8 + .2 * sin(uTime * 60. + uSeed + y * 22.));
  float diamonds = .75 + .5 * pow(max(.5 + .5 * sin(y * 34. - 1.), 0.), 3.) * (1. - y);
  vec3 c = mix(uColor, vec3(1.), pow(max(1. - y * 2.2, 0.), 2.));
  gl_FragColor = vec4(c * f * diamonds * uPower, 1.);
}`
const uvVertex = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`
const glowFragment = /* glsl */ `
varying vec2 vUv; uniform float uPower; uniform vec3 uColor;
void main(){ float d = length(vUv - .5) * 2.; gl_FragColor = vec4(mix(uColor, vec3(1.), .4) * (exp(-d * d * 10.) * .9 + exp(-d * 5.) * .35) * smoothstep(1., .5, d) * uPower, 1.); }`

const nozzles: [number, number, number, number][] = [[-0.66, -0.02, 1.84, 1], [0.66, -0.02, 1.84, 1], [0, -0.06, 1.88, 0.78]]
const ORDER = 50
const e = new THREE.Euler(), qr = new THREE.Quaternion(), v = new THREE.Vector3()

export default function Ship() {
  const { camera, size } = useThree()
  const root = useRef<THREE.Group>(null)
  const [scene, setScene] = useState<THREE.Group | null>(null)
  const mats = useRef<THREE.MeshStandardMaterial[]>([])
  const mixer = useRef<{ m: THREE.AnimationMixer; a: THREE.AnimationAction } | null>(null)
  const st = useRef({ x: 0, y: 0, s: 0, fold: 0, vx: 0, vy: 0, bank: 0, yaw: 0, pitch: 0, power: 0.4 })

  useEffect(() => {
    let live = true
    model('ship.glb').then(g => {
      if (!live) return
      const s = g.scene.clone(true)
      s.traverse(o => {
        const me = o as THREE.Mesh
        if (!me.isMesh) return
        const mat = (me.material as THREE.MeshStandardMaterial).clone()
        // va en la cola transparente para poder dibujarse encima de túneles y nubes, pero es opaca
        mat.transparent = true
        mat.envMapIntensity = mat.name === 'glass' ? 2.2 : 1.5
        me.material = mat
        mats.current.push(mat)
        me.renderOrder = ORDER
        me.frustumCulled = false
      })
      const m = new THREE.AnimationMixer(s)
      const clip = g.animations[0]
      if (clip) {
        const a = m.clipAction(clip)
        a.play()
        a.paused = true
        mixer.current = { m, a }
      }
      // recién aparece cuando sus materiales están compilados
      return compileObject(s).then(() => { if (live) setScene(s) })
    }).catch(() => {})
    return () => { live = false }
  }, [])

  const fx = useMemo(() => {
    const cone = new THREE.CylinderGeometry(0.02, 0.145, 1, 20, 6, true)
    cone.rotateX(Math.PI / 2)
    cone.translate(0, 0, 0.5)
    const color = { value: new THREE.Color('#7fb8ff') }
    const flames = nozzles.map((_, i) => new THREE.ShaderMaterial({
      vertexShader: flameVertex, fragmentShader: flameFragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uTime: U.time, uLen: { value: 1 }, uPower: { value: 1 }, uSeed: { value: i * 9 }, uColor: color },
    }))
    const glow = new THREE.ShaderMaterial({ vertexShader: uvVertex, fragmentShader: glowFragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uPower: { value: 1 }, uColor: color } })
    return { cone, flames, glow, color, plane: new THREE.PlaneGeometry(1.5, 1.5) }
  }, [])

  useFrame((_, delta) => {
    const g = root.current
    if (!g) return
    const dt = Math.min(delta, 0.05)
    const s = st.current, cam = camera as THREE.PerspectiveCamera
    const pr = cam.projectionMatrix.elements
    // entra volando cuando la galaxia termina de formarse
    const enter = smooth(0.55, 1, J.birth)
    const want = pose.ship
    const time = U.time.value
    const tx = want.x + J.mx * 0.05 + Math.sin(time * 0.5) * 0.012, ty = want.y + J.my * 0.05 + Math.sin(time * 0.8) * 0.018 - (1 - enter) * 0.9
    const px = s.x, py = s.y
    s.x = damp(s.x, tx, 5, dt)
    s.y = damp(s.y, ty, 5, dt)
    s.s = damp(s.s, want.z * (J.explore ? 0.75 : 1) * (0.4 + 0.6 * enter), 5, dt)
    g.visible = s.s > 0.03 && !!scene
    if (!g.visible) return
    s.vx = damp(s.vx, (s.x - px) / Math.max(dt, 1e-3), 6, dt)
    s.vy = damp(s.vy, (s.y - py) / Math.max(dt, 1e-3), 6, dt)
    const speed = Math.min(Math.abs(J.v) * 0.35 + J.warp + J.tunnel, 1.6)
    s.fold = damp(s.fold, Math.min(1, J.warp * 1.1 + J.tunnel), 4, dt)
    s.power = damp(s.power, 0.35 + speed, 5, dt)
    s.bank = damp(s.bank, -s.vx * 0.9 - J.mx * 0.22, 4, dt)
    s.yaw = damp(s.yaw, -s.x * 0.42 - s.vx * 0.3 - J.mx * 0.12, 4, dt)
    s.pitch = damp(s.pitch, 0.2 - s.y * 0.28 + s.vy * 0.3 + J.my * 0.1, 4, dt)

    v.set(((s.x - J.shift.x) * DEPTH) / pr[0], ((s.y - J.shift.y) * DEPTH) / pr[5], -DEPTH + (1 - enter) * 3.5 - speed * 0.25)
    g.position.copy(v).applyQuaternion(cam.quaternion).add(cam.position)
    // vibración en el túnel
    if (J.tunnel > 0.05) g.position.x += (Math.random() - 0.5) * 0.02 * J.tunnel
    g.quaternion.copy(cam.quaternion).multiply(qr.setFromEuler(e.set(s.pitch, s.yaw, s.bank, 'YXZ')))
    const k = (0.2 / pr[5] / Math.tan(THREE.MathUtils.degToRad(21))) * s.s * Math.min(1, size.width / 900 + 0.25)
    g.scale.setScalar(k)

    if (mixer.current) {
      mixer.current.a.time = Math.min(0.999, s.fold) * mixer.current.a.getClip().duration
      mixer.current.m.update(0)
    }
    // a contraluz, un relleno suave para que la nave no se pierda
    const fill = 1.4 + 2.4 * smooth(-0.1, 0.8, v.copy(pose.light).dot(pose.dir))
    mats.current.forEach(m => { m.envMapIntensity = m.name === 'glass' ? 2.2 : fill })
    fx.color.value.setRGB(0.36, 0.62, 1).lerp(pose.tint, 0.25 + J.tunnel * 0.3)
    fx.flames.forEach((f, i) => {
      f.uniforms.uLen.value = (0.7 + s.power * 1.9) * nozzles[i][3] * (1 + Math.sin(time * 41 + i * 7) * 0.06)
      f.uniforms.uPower.value = 1.1 + s.power * 1.5
    })
    fx.glow.uniforms.uPower.value = 0.7 + s.power * 0.9
  })

  return (
    <group ref={root} visible={false}>
      {scene && <primitive object={scene} />}
      {nozzles.map(([x, y, z, s], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh geometry={fx.cone} material={fx.flames[i]} scale={[s, s, 1]} renderOrder={ORDER + 1} frustumCulled={false} />
          <mesh geometry={fx.plane} material={fx.glow} scale={s} position={[0, 0, 0.06]} renderOrder={ORDER + 2} frustumCulled={false} />
        </group>
      ))}
    </group>
  )
}
