import { A } from '@solidjs/router'
import { clientOnly } from '@solidjs/start'
import GithubIcon from '~/components/icons/github'
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
      <div class='flex flex-wrap'>
        <A target='_blank' href='https://github.com/HansT01/code-curio/blob/main/src/components/p5/coriolis-effect.tsx'>
          <div class='text-primary-fg hover:text-secondary-fg flex items-center gap-2 rounded-lg bg-primary px-4 py-3 hover:bg-secondary'>
            <GithubIcon />
            View Source Code
          </div>
        </A>
      </div>
      <CoriolisEffectCanvas />
    </main>
  )
}
