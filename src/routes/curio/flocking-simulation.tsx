import { clientOnly } from '@solidjs/start'
import { CurioInfo, getCurioID } from '~/util/curio'

export const info: CurioInfo = {
  id: getCurioID(import.meta.url),
  title: 'Flocking Simulation',
  created: new Date(2024, 2, 27),
  tags: ['ai', 'algorithms', 'animation', 'interactive', 'p5.js', 'simulation'],
}

const FlockingSimulationCanvas = clientOnly(() => import('~/components/p5/flocking-simulation'))

export default function FlockingSimulation() {
  return (
    <main class='flex flex-col gap-8 p-8'>
      <h1 class='text-6xl font-thin'>Flocking Simulator</h1>
      <p class='whitespace-pre-wrap'>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris maximus venenatis magna eget ornare. Integer
        efficitur odio nunc, vitae mattis diam vehicula vel. Nullam eu elementum tellus, eget mattis quam. Duis euismod
        leo id elit venenatis placerat sit amet et ligula. Curabitur id dolor sit amet enim placerat semper. Sed risus
        dui, venenatis a justo in, tristique elementum sem. Interdum et malesuada fames ac ante ipsum primis in
        faucibus.
        <br />
        <br />
        Nam aliquam euismod enim non tincidunt. Integer faucibus et nibh aliquam rutrum. Nam blandit massa sed velit
        finibus vulputate. Phasellus fringilla mollis dictum. Pellentesque tristique tellus eu ex tristique, vitae
        tempus odio vulputate. Aenean gravida elementum diam elementum malesuada. Suspendisse leo dui, aliquet in
        placerat sollicitudin, ultricies at lectus. Phasellus convallis magna id nulla vulputate, in pulvinar urna
        imperdiet.
      </p>
      <FlockingSimulationCanvas />
    </main>
  )
}
