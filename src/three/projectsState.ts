// Estado compartido entre el scroll de Proyectos y su escena 3D, sin re-renderizar React.
export const projectsState = {
  /** Índice fraccional del proyecto visible (0 = primero), escrito por el scroll. */
  progress: 0,
  /** En celular: px libres encima del texto de cada panel, donde cabe el modelo 3D. Lo mide Projects.tsx. */
  rooms: [] as number[],
}
