import type { Quality } from '../quality'
import BlackDwarf from './BlackDwarf'
import Boson from './Boson'
import Dyson from './Dyson'
import Gravastar from './Gravastar'
import Primordial from './Primordial'
import QuarkStar from './QuarkStar'
import QuasiStar from './QuasiStar'
import AtlasSky from './Sky'
import WhiteHole from './WhiteHole'

/** El atlas completo. El orden tiene que coincidir con `atlasIds` (state.ts) y con las fichas de content.ts. */
export default function Atlas({ q }: { q: Quality }) {
  return (
    <>
      <AtlasSky q={q} />
      <Primordial i={0} />
      <Boson i={1} q={q} />
      <QuasiStar i={2} q={q} />
      <QuarkStar i={3} q={q} />
      <Gravastar i={4} />
      <WhiteHole i={5} />
      <Dyson i={6} q={q} />
      <BlackDwarf i={7} />
    </>
  )
}
