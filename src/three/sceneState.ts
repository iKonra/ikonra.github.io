// Estado compartido entre la UI y la escena 3D, sin re-renderizar React.
export const palettes = [
  ['#ff5a1f', '#ffd2b8'],
  ['#3d6bff', '#c9d6ff'],
  ['#b6e62e', '#efffc4'],
  ['#ff3d8b', '#ffd0e3'],
  ['#1fc8e0', '#c8f6ff'],
  ['#f2b51d', '#fff0c2'],
] as const

export const SHAPES = 6

/** shape: figura del hero; kick: impulso del botón "Me aburrí", decae solo. */
export const sceneState = { palette: 0, shape: 4, kick: 0 }

export function bore(index: number) {
  sceneState.palette = index % palettes.length
  sceneState.shape = (4 + index) % SHAPES
  sceneState.kick = 1
}
