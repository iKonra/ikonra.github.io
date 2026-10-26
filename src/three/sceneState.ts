// Estado compartido entre la UI y la escena 3D, sin re-renderizar React.
export const palettes = [
  ['#1a0f0a', '#ff5a1f', '#ffd2b8'],
  ['#0a0f1f', '#3d6bff', '#c9d6ff'],
  ['#0f1405', '#b6e62e', '#efffc4'],
  ['#1a0a12', '#ff3d8b', '#ffd0e3'],
  ['#05141a', '#1fc8e0', '#c8f6ff'],
  ['#14100a', '#f2b51d', '#fff0c2'],
] as const

export const sceneState = { palette: 0, kick: 0 }

export function bore(index: number) {
  sceneState.palette = index % palettes.length
  sceneState.kick = 1
}
