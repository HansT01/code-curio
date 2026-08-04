import { A } from '@solidjs/router'
import { clientOnly } from '@solidjs/start'
import { ErrorBoundary, Show, createSignal, onMount } from 'solid-js'
import CanvasLoader from '~/components/curios/p5/canvas-loader'
import { GithubIcon } from '~/components/icons'
import { CurioInfo } from '~/utils/curio'

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
    <main>
      <article class='flex flex-col gap-6 p-8'>
        <header>
          <h1 class='text-6xl font-thin'>Flocking Simulation</h1>
        </header>
        <section class='flex flex-col gap-4'>
          <p>
            A flocking simulation, often referred to as boids, is a computer-generated model that simulates the flocking
            behavior of birds or other animals. It involves creating a group of simulated entities (boids) that follow
            simple rules, such as separation, alignment, and cohesion, to mimic the natural movement patterns observed
            in flocks or herds.
          </p>
          <p>
            I won't delve deeper into the boids algorithm, as it has been extensively covered as an introductory
            simulation project. This curio served as my introduction to integrating p5.js into the SolidStart framework.
            If you're interested in learning more about the boids algorithms I used, you can visit this{' '}
            <a
              target='_blank'
              href='https://vanhunteradams.com/Pico/Animal_Movement/Boids-algorithm.html'
              class='underline'
            >
              website
            </a>
            .
          </p>
        </section>
        <section class='flex min-h-120 flex-col gap-6'>
          <ErrorBoundary fallback={(error, reset) => <CanvasLoader error={error.toString()} onClick={reset} />}>
            <Show when={!isLoading()} fallback={<CanvasLoader />}>
              <FlockingSimulationCanvas />
            </Show>
          </ErrorBoundary>
          <a
            target='_blank'
            href={`${import.meta.env.VITE_GITHUB_URL}/blob/main/src/components/curios/flocking-simulation.tsx`}
          >
            <button class='bg-primary text-primary-fg hover:bg-secondary hover:text-secondary-fg flex cursor-pointer items-center gap-2 rounded-lg px-4 py-3'>
              <GithubIcon />
              View Source Code
            </button>
          </a>
        </section>
      </article>
    </main>
  )
}
