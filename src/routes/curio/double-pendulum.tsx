import { A } from '@solidjs/router'
import { clientOnly } from '@solidjs/start'
import { Show, createSignal, onMount } from 'solid-js'
import CanvasLoader from '~/components/canvas-loader'
import GithubIcon from '~/components/icons/github'
import { CurioInfo } from '~/util/curio'

export const info: CurioInfo = {
  id: 'double-pendulum',
  title: 'Double Pendulum',
  created: new Date('2024-02-28'),
  tags: ['algorithms', 'animation', 'interactive', 'p5.js', 'physics', 'simulation', '3d'],
}

const DoublePendulumCanvas = clientOnly(() => import('~/components/p5/double-pendulum'))

export default function DoublePendulum() {
  const [isLoading, setIsLoading] = createSignal(true)

  onMount(() => {
    setIsLoading(false)
  })

  return (
    <main class='flex flex-col gap-6 p-8'>
      <h1 class='text-6xl font-thin'>Double Pendulum</h1>
      <div class='flex flex-wrap'>
        <A target='_blank' href='https://github.com/HansT01/code-curio/blob/main/src/components/p5/double-pendulum.tsx'>
          <button class='flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-primary-fg hover:bg-secondary hover:text-secondary-fg'>
            <GithubIcon />
            View Source Code
          </button>
        </A>
      </div>
      <section class='flex flex-col gap-4'>
        <A
          target='_blank'
          href='https://web.mit.edu/jorloff/www/chaosTalk/double-pendulum/double-pendulum-en.html'
          class='underline'
        >
          equations derived from here
        </A>
      </section>
      <section class='min-h-[480px]'>
        <Show when={!isLoading()} fallback={<CanvasLoader />}>
          <DoublePendulumCanvas />
        </Show>
      </section>
      <section class='flex flex-col gap-4'></section>
    </main>
  )
}
