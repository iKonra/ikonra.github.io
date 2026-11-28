/** Atlas de lo imposible: un tramo del viaje entre Proyectos y Stack. Es paisaje, no una sección para leer:
 *  acá solo está el largo del scroll (lo lee measure() en universe/state.ts); los objetos los dibuja universe/atlas
 *  y el nombre de cada uno aparece en la consola del HUD. */
export default function Atlas() {
  return (
    <section id="atlas" className="atlas" aria-hidden>
      <div id="atlas-track" className="atlas-track" />
    </section>
  )
}
