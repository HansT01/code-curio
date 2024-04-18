import { A } from '@solidjs/router'
import { clientOnly } from '@solidjs/start'
import { ErrorBoundary, Show, createSignal, onMount } from 'solid-js'
import CanvasLoader from '~/components/curios/p5/canvas-loader'
import { GithubIcon } from '~/components/icons'
import { CurioInfo } from '~/util/curio'

export const info: CurioInfo = {
  id: 'flocking-simulation',
  title: 'Flocking Simulation',
  created: new Date('2024-02-27'),
  tags: ['ai', 'algorithms', 'animation', 'interactive', 'p5.js', 'simulation'],
}

const FlockingSimulationCanvas = clientOnly(() => import('~/components/curios/flocking-simulation'))

export default function FlockingSimulation() {
  const [isLoading, setIsLoading] = createSignal(true)

  onMount(() => {
    setIsLoading(false)
  })

  return (
    <main class='flex flex-col gap-6 p-8'>
      <h1 class='text-6xl font-thin'>Flocking Simulation</h1>
      <div class='flex flex-wrap'>
        <A
          target='_blank'
          href={`${import.meta.env.VITE_GITHUB_URL}/blob/main/src/components/curios/flocking-simulation.tsx`}
        >
          <button class='flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-primary-fg hover:bg-secondary hover:text-secondary-fg'>
            <GithubIcon />
            View Source Code
          </button>
        </A>
      </div>
      <section class='flex flex-col gap-4'>
        <h2 class='text-4xl font-extralight'>Introduction</h2>
        <p>
          A flocking simulation, often referred to as boids, is a computer-generated model that simulates the flocking
          behavior of birds or other animals. It involves creating a group of simulated entities (boids) that follow
          simple rules, such as separation, alignment, and cohesion, to mimic the natural movement patterns observed in
          flocks or herds.
        </p>
        <p>
          I won't delve deeper into the boids algorithm, as it has been extensively covered as an introductory
          simulation project. This curio served as my introduction to integrating p5.js into the SolidStart framework.
          If you're interested in learning more about the boids algorithms I used, you can visit this{' '}
          <A
            target='_blank'
            href='https://vanhunteradams.com/Pico/Animal_Movement/Boids-algorithm.html'
            class='underline'
          >
            website
          </A>
          .
        </p>
      </section>
      <section class='min-h-[480px]'>
        <ErrorBoundary fallback={(error, reset) => <CanvasLoader error={error.toString()} onClick={reset} />}>
          <Show when={!isLoading()} fallback={<CanvasLoader />}>
            <FlockingSimulationCanvas />
          </Show>
        </ErrorBoundary>
      </section>
    </main>
  )
}
