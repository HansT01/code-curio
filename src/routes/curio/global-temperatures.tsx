import { getCurioID } from '~/util'

export const curioInfo = {
  id: getCurioID(import.meta.url),
  title: 'Global Temperatures',
}

export default function GlobalTemperatures() {
  return (
    <main class='flex min-h-lvh flex-col items-center gap-4 bg-background p-4 text-foreground'>
      <h1 class='text-8xl font-extrabold uppercase tracking-tight'>Global Temperatures</h1>
    </main>
  )
}
