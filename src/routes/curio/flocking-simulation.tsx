import { A } from '@solidjs/router'
import { clientOnly } from '@solidjs/start'
import { ErrorBoundary, Show, createSignal, onMount } from 'solid-js'
import { GithubIcon } from '~/components/icons'
import ButtonLink from '~/components/widgets/button-link'
import Loader from '~/components/widgets/loader'
import { CURIO_CANVAS_HEIGHT, CURIO_CANVAS_WIDTH } from '~/lib/curio/dimensions'
import { CurioMetadata } from '~/lib/curio/metadata'

export const info: CurioMetadata = {
  id: 'flocking-simulation',
  title: 'Flocking Simulation',
  created: new Date('2024-02-27'),
  updated: new Date('2024-02-27'),
  tags: ['algorithms', 'animation', 'interactive', 'p5.js', 'simulation'],
}

const FlockingSimulationCanvas = clientOnly(() => import('~/components/client-only/flocking-simulation'))

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
        <section class='min-h-120'>
          <ErrorBoundary
            fallback={(error, reset) => (
              <Loader
                width={CURIO_CANVAS_WIDTH}
                height={CURIO_CANVAS_HEIGHT}
                error={error.toString()}
                onClick={reset}
              />
            )}
          >
            <Show when={!isLoading()} fallback={<Loader width={CURIO_CANVAS_WIDTH} height={CURIO_CANVAS_HEIGHT} />}>
              <FlockingSimulationCanvas />
            </Show>
          </ErrorBoundary>
        </section>
        <section class='flex'>
          <ButtonLink
            target='_blank'
            href={`${import.meta.env.VITE_GITHUB_URL}/blob/main/src/components/client-only/flocking-simulation.tsx`}
          >
            <GithubIcon />
            View Source Code
          </ButtonLink>
        </section>
      </article>
    </main>
  )
}
