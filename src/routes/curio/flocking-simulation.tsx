import { A } from '@solidjs/router'
import { clientOnly } from '@solidjs/start'
import GithubIcon from '~/components/icons/github'
import { CurioInfo } from '~/util/curio'

export const info: CurioInfo = {
  id: 'flocking-simulation',
  title: 'Flocking Simulation',
  created: new Date(2024, 2, 27),
  tags: ['ai', 'algorithms', 'animation', 'interactive', 'p5.js', 'simulation'],
}

const FlockingSimulationCanvas = clientOnly(() => import('~/components/p5/flocking-simulation'))

export default function FlockingSimulation() {
  return (
    <main class='flex flex-col gap-6 p-8'>
      <h1 class='text-6xl font-thin'>Flocking Simulation</h1>
      <div class='flex flex-wrap'>
        <A
          target='_blank'
          href='https://github.com/HansT01/code-curio/blob/main/src/components/p5/flocking-simulation.tsx'
        >
          <div class='flex items-center gap-2 rounded-lg bg-background px-4 py-3 text-foreground hover:bg-accent hover:text-accent-foreground'>
            <GithubIcon />
            View Source Code
          </div>
        </A>
      </div>
      <p class='whitespace-pre-wrap'>
        A flocking simulation, often referred to as "boids," is a computer-generated model that simulates the flocking
        behavior of birds or other animals. It involves creating a group of simulated entities (boids) that follow
        simple rules, such as separation, alignment, and cohesion, to mimic the natural movement patterns observed in
        flocks or herds.
      </p>
      <FlockingSimulationCanvas />
    </main>
  )
}
