import { A } from '@solidjs/router'
import { clientOnly } from '@solidjs/start'
import { ErrorBoundary, Show, createSignal, onMount } from 'solid-js'
import CanvasLoader from '~/components/curios/p5/canvas-loader'
import { GithubIcon } from '~/components/icons'
import { CurioInfo } from '~/util/curio'

export const info: CurioInfo = {
  id: 'coriolis-effect',
  title: 'Coriolis Effect',
  created: new Date('2024-02-28'),
  tags: ['algorithms', 'animation', 'interactive', 'p5.js', 'physics', 'simulation', '3d'],
}

const CoriolisEffectCanvas = clientOnly(() => import('~/components/curios/coriolis-effect'))

export default function CoriolisEffect() {
  const [isLoading, setIsLoading] = createSignal(true)

  onMount(() => {
    setIsLoading(false)
  })

  return (
    <main class='flex flex-col gap-6 p-8'>
      <h1 class='text-6xl font-thin'>Coriolis Effect</h1>
      <div class='flex flex-wrap'>
        <A
          target='_blank'
          href={`${import.meta.env.VITE_GITHUB_URL}/blob/main/src/components/curios/coriolis-effect.tsx`}
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
          The Coriolis effect is a phenomenon that occurs due to the rotation of the Earth. It causes moving objects,
          such as air masses and ocean currents, to deflect to the right in the Northern Hemisphere and to the left in
          the Southern Hemisphere. This deflection is a result of the Earth's rotation and the conservation of angular
          momentum, which causes freely moving objects to appear to curve from an observer's perspective on the rotating
          Earth.
        </p>
        <p>
          One of the most well-known examples of the Coriolis effect is its impact on weather patterns. In the Northern
          Hemisphere, winds tend to curve to the right, leading to the formation of counterclockwise cyclones.
          Contrarily, in the Southern Hemisphere, winds curve to the left, leading to the formation of clockwise
          cyclones.
        </p>
        <p>
          Read more about the Coriolis effect{' '}
          <A target='_blank' href='https://en.wikipedia.org/wiki/Coriolis_force' class='underline'>
            here
          </A>
          .
        </p>
        <p>
          This simulation assumes the perspective of an observer rotating alongside a sphere representing Earth, and
          attempts to simulate the impact of the Coriolis force on the direction of winds.
        </p>
      </section>
      <section class='min-h-[480px]'>
        <ErrorBoundary fallback={(error, reset) => <CanvasLoader error={error.toString()} onClick={reset} />}>
          <Show when={!isLoading()} fallback={<CanvasLoader />}>
            <CoriolisEffectCanvas />
          </Show>
        </ErrorBoundary>
      </section>
      <section class='flex flex-col gap-4'>
        <h2 class='text-4xl font-extralight'>Understanding The Simulation</h2>
        <p>
          The simulation consisted of three acting forces: separation, centrifugal, and the Coriolis force. The
          centrifugal force directs the particles towards the equator, which then the Coriolis force deflects them in a
          manner consistent with the Coriolis effect. Without the inclusion of separation, the simulation lacked
          complexity and appeared static.
        </p>
        <p>
          To address performance constraints, the simulation was designed to accommodate a reduced number of fluid
          particles. To ensure visual clarity, an option was included to toggle the display of particle trails,
          providing users with the flexibility to prioritize visibility over particle quantity in the simulation.
        </p>
        <p>
          To compensate for the reduced accuracy resulting from the limited number of particles, I increased the
          magnitudes of both the centrifugal and Coriolis forces. This adjustment made the effects more pronounced and
          visually striking, but it also deviated from the realistic behavior of these forces on Earth. In reality, the
          Coriolis effect is subtle but its influence is remarkable at scale.
        </p>
        <p>
          If the Coriolis forces are exaggerated, the particles will begin to spiral. This phenomenon mirrors the
          cyclonic spin direction observed in weather systems in the northern and southern hemispheres.
        </p>
      </section>
    </main>
  )
}
