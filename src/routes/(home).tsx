import { A } from '@solidjs/router'
import { For, Show, createResource } from 'solid-js'

export const validTags = [
  'p5.js',
  'data-vis',
  'interactive',
  'art',
  'algorithms',
  'simulation',
  'game',
  'animation',
  'ai',
  'machine-learning',
] as const
export type Tag = (typeof validTags)[number]

export interface CurioInfo {
  id: string
  title: string
  created: Date
  tags: Tag[]
}

let cache: CurioInfo[] | null = null
const getCurios = async () => {
  if (cache !== null) {
    return cache
  }
  const context = import.meta.glob('./curio/*.tsx')
  const keys = Object.keys(context)
  const info: CurioInfo[] = await Promise.all(
    keys.map(async (key) => {
      const { info } = (await context[key]()) as any
      return info
    }),
  )
  cache = info
  return info
}

export default function Home() {
  const [curios, { mutate }] = createResource(getCurios)
  return (
    <main class='flex min-h-lvh w-full flex-col items-center gap-4 bg-background p-4 text-foreground'>
      <h1 class='text-8xl font-extrabold uppercase tracking-tight'>Code Curio</h1>
      <Show when={curios()}>
        {(curios) => (
          <For each={curios()}>
            {(curio) => (
              <A
                href={`curio/${curio.id}`}
                class='cursor-pointer rounded-lg bg-primary px-8 py-4 font-bold text-primary-foreground'
              >
                {curio.title}
              </A>
            )}
          </For>
        )}
      </Show>
    </main>
  )
}
