import { A } from '@solidjs/router'
import { clientOnly } from '@solidjs/start'
import { ErrorBoundary, Show, createSignal, onMount } from 'solid-js'
import CanvasLoader from '~/components/canvas-loader'
import GithubIcon from '~/components/icons/github'
import { CurioInfo } from '~/util/curio'

export const info: CurioInfo = {
  id: 'double-pendulum',
  title: 'Double Pendulum',
  created: new Date('2024-03-05'),
  tags: ['algorithms', 'animation', 'interactive', 'p5.js', 'physics'],
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
        <h2 class='text-4xl font-extralight'>Introduction</h2>
        <p>
          The double pendulum is a physical system that demonstrates chaotic behavior. Unlike a single pendulum, which
          consists of a single mass swinging from a fixed point, the double pendulum comprises two connected pendulums,
          each with its own mass and length, swinging from a common pivot point. Despite its simple structure, the
          double pendulum's motion can be incredibly complex and unpredictable, making it a subject of interest in
          physics and mathematics.
        </p>
      </section>
      <section class='min-h-[480px]'>
        <ErrorBoundary fallback={(error, reset) => <CanvasLoader error={error.toString()} onClick={reset} />}>
          <Show when={!isLoading()} fallback={<CanvasLoader />}>
            <DoublePendulumCanvas />
          </Show>
        </ErrorBoundary>
      </section>
      <section class='flex flex-col gap-4'>
        <h2 class='text-4xl font-extralight'>Numerical Analysis: Runga-Kutta methods</h2>
        <p>
          In the initial stages of the simulation, the approach was to calculate the angular acceleration at each point
          and directly apply it to update the velocity. While this method produced reasonable results, a noticeable
          discrepancy in the total energy of the system became apparent over time.
        </p>
        <p>
          The discrepancy in the total energy arose due to the nature of the double pendulum's motion. The system's
          dynamics were governed by non-linear equations, which meant that small changes in the initial conditions or
          calculation inaccuracies can lead to significant deviations in the predicted motion.
        </p>
        <p>
          To address this challenge, numerical analysis techniques were employed to approximate solutions to the
          non-linear equations. These techniques involved breaking down the motion of the double pendulum into small
          time steps and iteratively calculating the positions and velocities of the pendulum masses at each step. By
          using these approximations, the motion of the double pendulum could be simulated with greater accuracy than
          would have been possible by simply reducing the step size in the calculation. Additionally, numerical analysis
          allows for more efficient computation of the system's behavior, making it a valuable tool in studying complex
          dynamic systems like the double pendulum.
        </p>
        <p>
          For this simulation, the chosen numerical analysis technique was the Runge-Kutta (RK4) method. Unlike the
          Euler method, which only considers the first derivative in its calculations, RK4 takes into account the first
          four derivatives. This means that RK4 provides a more accurate approximation of the system's behavior by
          accounting for higher-order derivatives.
        </p>
        <p>
          Read more about the Runga-kutta methods{' '}
          <A target='_blank' href='https://en.wikipedia.org/wiki/Runge%E2%80%93Kutta_methods' class='underline'>
            here
          </A>
          .
        </p>
      </section>
    </main>
  )
}
