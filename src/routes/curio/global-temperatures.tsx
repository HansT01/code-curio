import { CurioInfo, getCurioID } from '~/util/curio'

export const info: CurioInfo = {
  id: getCurioID(import.meta.url),
  title: 'Global Temperatures',
  created: new Date(2024, 2, 27),
  tags: [],
}

export default function GlobalTemperatures() {
  return (
    <main class='flex min-h-lvh flex-col items-center gap-4 bg-background p-4 text-foreground'>
      <h1 class='text-8xl font-extrabold tracking-tight'>Global Temperatures</h1>
    </main>
  )
}
