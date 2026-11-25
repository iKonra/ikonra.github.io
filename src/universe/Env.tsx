import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'

/** Reflejos para los materiales metálicos: un entorno espacial mínimo generado en el momento (sin descargar un HDR). */
export default function Env() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl)
    const s = new THREE.Scene()
    s.add(new THREE.Mesh(
      new THREE.SphereGeometry(50, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        vertexShader: /* glsl */ `varying vec3 d; void main(){ d = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        // franja de la Vía Láctea y un degradé muy oscuro
        fragmentShader: /* glsl */ `varying vec3 d; void main(){ vec3 n = normalize(d); float b = exp(-pow(abs((n.y - n.x * .35) * 3.2), 2.)); gl_FragColor = vec4(vec3(.018, .024, .045) + vec3(.22, .2, .24) * b * (.5 + .5 * n.z), 1.); }`,
      }),
    ))
    const panel = (color: string, k: number, x: number, y: number, z: number, w: number, h: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }))
      m.position.set(x, y, z)
      m.lookAt(0, 0, 0)
      s.add(m)
    }
    panel('#fff0dc', 9, -14, 10, 12, 9, 6)
    panel('#8fb4ff', 5, 16, 2, -8, 4, 14)
    panel('#ffb48a', 2.2, 4, -14, 6, 14, 5)
    const env = pm.fromScene(s, 0.02).texture
    scene.environment = env
    return () => { scene.environment = null; env.dispose(); pm.dispose() }
  }, [gl, scene])
  return null
}
