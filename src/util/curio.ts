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
export const getCurios = async () => {
  'use server'
  if (cache !== null) {
    return cache
  }
  const context = import.meta.glob('/src/routes/curio/*.tsx')
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
