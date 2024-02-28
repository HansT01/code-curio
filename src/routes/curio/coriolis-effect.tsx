import { clientOnly } from '@solidjs/start'
import { CurioInfo } from '~/util/curio'

export const info: CurioInfo = {
  id: 'coriolis-effect',
  title: 'Coriolis Effect',
  created: new Date(2024, 2, 27),
  tags: [],
}

const CoriolisEffectCanvas = clientOnly(() => import('~/components/p5/coriolis-effect'))

export default function CoriolisEffect() {
  return (
    <main class='flex flex-col gap-6 p-8'>
      <h1 class='text-6xl font-thin'>Coriolis Effect</h1>
      <div class='flex flex-wrap'></div>
      <CoriolisEffectCanvas />
    </main>
  )
}
