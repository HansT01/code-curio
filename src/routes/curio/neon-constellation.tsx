import { A } from '@solidjs/router'
import { clientOnly } from '@solidjs/start'
import GithubIcon from '~/components/icons/github'
import { CurioInfo } from '~/util/curio'

export const info: CurioInfo = {
  id: 'neon-constellation',
  title: 'Neon Constellation',
  created: new Date(2024, 3, 3),
  tags: [],
}

const NeonConstellationCanvas = clientOnly(() => import('~/components/p5/neon-constellation'))

export default function NeonConstellation() {
  return (
    <main class='flex flex-col gap-6 p-8'>
      <h1 class='text-6xl font-thin'>Neon Constellation</h1>
      <div class='flex flex-wrap'>
        <A
          target='_blank'
          href='https://github.com/HansT01/code-curio/blob/main/src/components/p5/neon-constellation.tsx'
        >
          <button class='flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-primary-fg hover:bg-secondary hover:text-secondary-fg'>
            <GithubIcon />
            View Source Code
          </button>
        </A>
      </div>
      <p>This is the beginnings of a curio named Neon Constellation.</p>
      <NeonConstellationCanvas />
    </main>
  )
}
