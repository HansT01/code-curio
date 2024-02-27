import { getCurioID } from '~/util'
import { CurioInfo } from '../(home)'

export const info: CurioInfo = {
  id: getCurioID(import.meta.url),
  title: 'Flocking Simulation',
  created: new Date(2024, 2, 27),
  tags: [],
}

export default function FlockingSimulation() {
  return (
    <main class='flex min-h-lvh flex-col items-center gap-4 bg-background p-4 text-foreground'>
      <h1 class='text-8xl font-extrabold tracking-tight'>Flocking Simulation</h1>
    </main>
  )
}
