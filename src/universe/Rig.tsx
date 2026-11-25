import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { J, damp, pose, poseAt, scrollToT, smooth, strike, tunnelAt } from './journey'
import { U } from './shared'

// La cámara: sigue el viaje con inercia, reacciona al mouse (paralaje real, no solo giro) y en modo explorar orbita el destino.

/** Cuánto se desplaza la cámara con el mouse en cada etapa (las escalas son muy distintas). */
const sway: [number, number][] = [
  [0, 7], [0.6, 3], [1, 1.4], [2, 1], [2.5, 0.6], [2.6, 5], [3, 1.6], [3.6, 0.8], [4, 0.12], [4.5, 0.05], [5, 0.55], [9, 0.55], [9.6, 1.2],
  [10, 1.8], [11, 1.8], [12, 5], [12.7, 1.6], [13, 1.2], [13.5, 0.6], [14, 1.5],
]
function swayAt(t: number) {
  let i = 0
  while (i < sway.length - 2 && t > sway[i + 1][0]) i++
  const [t0, a] = sway[i], [t1, b] = sway[i + 1]
  return a + (b - a) * smooth(t0, t1, t)
}

const up = new THREE.Vector3(0, 1, 0), zero = new THREE.Vector3(), zAxis = new THREE.Vector3(0, 0, 1), xAxis = new THREE.Vector3(1, 0, 0)
const shown = new THREE.Color()
const m4 = new THREE.Matrix4(), q0 = new THREE.Quaternion(), q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), right = new THREE.Vector3(), pivot = new THREE.Vector3(), off = new THREE.Vector3()

export default function Rig({ still }: { still: boolean }) {
  const { camera, size, viewport, scene } = useThree()
  const light = useRef<THREE.DirectionalLight>(null)
  const first = useRef(true)
  const fine = useRef(true)

  useEffect(() => {
    fine.current = matchMedia('(hover: hover) and (pointer: fine)').matches
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      J.px = (e.clientX / innerWidth) * 2 - 1
      J.py = 1 - (e.clientY / innerHeight) * 2
    }
    const onDown = (e: PointerEvent) => { if (!(e.target as Element).closest?.('a, button, input, [data-ui]')) strike(e.clientX, e.clientY) }
    addEventListener('pointermove', onMove, { passive: true })
    addEventListener('pointerdown', onDown, { passive: true })
    return () => { removeEventListener('pointermove', onMove); removeEventListener('pointerdown', onDown) }
  }, [])

  useEffect(() => { if (import.meta.env.DEV) (window as unknown as { __J: { scene: unknown } }).__J.scene = scene }, [scene])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const cam = camera as THREE.PerspectiveCamera
    U.time.value += dt
    const time = U.time.value
    J.narrow = size.width <= 860 || size.width / size.height < 0.95

    // ---- t con inercia, velocidad y warp
    J.target = J.force ?? scrollToT(scrollY)
    const before = J.t
    J.t = first.current || still ? J.target : damp(J.t, J.target, 6, dt)
    if (!still && !first.current) {
      J.v = damp(J.v, (J.t - before) / Math.max(dt, 1e-3), 9, dt)
      J.warp = damp(J.warp, smooth(0.9, 4.2, Math.abs(J.v)), 7, dt)
    }
    first.current = false
    J.tunnel = still ? 0 : tunnelAt(J.t)
    if (still) J.birth = 1

    // ---- puntero; en pantallas táctiles, un balanceo lento
    const tx = still ? 0 : fine.current ? J.px : Math.sin(time * 0.23) * 0.35
    const ty = still ? 0 : fine.current ? J.py : Math.cos(time * 0.19) * 0.25
    J.mx = damp(J.mx, tx, 3.2, dt)
    J.my = damp(J.my, ty, 3.2, dt)
    if (!J.explore) { J.yawT = 0; J.pitchT = 0 }
    J.yaw = damp(J.yaw, J.yawT, 5, dt)
    J.pitch = damp(J.pitch, J.pitchT, 5, dt)

    // ---- pose
    poseAt(J.t, pose)
    m4.lookAt(zero, pose.dir, up)
    q0.setFromRotationMatrix(m4)
    cam.position.copy(pose.pos)
    if (Math.abs(J.yaw) > 1e-4 || Math.abs(J.pitch) > 1e-4) {
      right.copy(xAxis).applyQuaternion(q0)
      q1.setFromAxisAngle(up, J.yaw).multiply(q2.setFromAxisAngle(right, J.pitch))
      off.copy(pose.dir).multiplyScalar(pose.dist)
      pivot.copy(pose.pos).add(off)
      off.applyQuaternion(q1)
      cam.position.copy(pivot).sub(off)
      q0.premultiply(q1)
    }
    const s = swayAt(J.t) * (J.narrow ? 0.6 : 1)
    const sx = J.mx * s + Math.sin(time * 0.31) * s * 0.07, sy = J.my * s * 0.6 + Math.cos(time * 0.27) * s * 0.06
    cam.position.add(off.copy(xAxis).applyQuaternion(q0).multiplyScalar(sx))
    cam.position.add(off.copy(up).applyQuaternion(q0).multiplyScalar(sy))
    cam.quaternion.copy(q0)
    // el encuadre vuelve hacia el objetivo: el sujeto queda quieto y lo demás se mueve alrededor
    const back = Math.min(s / Math.max(pose.dist, 2), 0.12)
    cam.quaternion.multiply(q1.setFromAxisAngle(up, J.mx * back * 0.85))
    cam.quaternion.multiply(q1.setFromAxisAngle(xAxis, -J.my * back * 0.5))
    cam.quaternion.multiply(q1.setFromAxisAngle(zAxis, pose.roll + J.v * 0.012))
    cam.updateMatrixWorld()

    // ---- lente
    const asp = size.width / size.height
    const widen = J.narrow ? 1 : Math.min(Math.max(1.6 / asp, 1), 1.4)
    const tan = Math.tan(THREE.MathUtils.degToRad(pose.fov / 2)) * widen * (1 + J.warp * 0.16)
    cam.fov = THREE.MathUtils.radToDeg(Math.atan(tan)) * 2
    cam.aspect = asp
    cam.updateProjectionMatrix()
    const hide = J.explore ? 0 : 1
    J.shift.x = damp(J.shift.x, pose.shift.x * hide, still ? 999 : 8, dt)
    J.shift.y = damp(J.shift.y, pose.shift.y * hide, still ? 999 : 8, dt)
    cam.projectionMatrix.elements[8] = -J.shift.x
    cam.projectionMatrix.elements[9] = -J.shift.y
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert()

    // ---- luz y uniforms comunes
    U.light.value.copy(pose.light)
    U.lightColor.value.copy(pose.lightColor)
    U.tint.value.copy(pose.tint)
    shown.copy(pose.tint).convertLinearToSRGB()
    J.tint[0] = Math.round(shown.r * 255); J.tint[1] = Math.round(shown.g * 255); J.tint[2] = Math.round(shown.b * 255)
    U.res.value.set(size.width * viewport.dpr, size.height * viewport.dpr)
    U.pr.value = viewport.dpr
    if (light.current) {
      light.current.position.copy(pose.light).multiplyScalar(50)
      light.current.color.copy(pose.lightColor)
    }
    scene.environmentIntensity = 0.42
  }, -10)

  return <directionalLight ref={light} intensity={2.9} />
}
