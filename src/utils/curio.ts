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
  'physics',
  '3d',
  'shader',
] as const
export type Tag = (typeof validTags)[number]

export interface CurioInfo {
  id: string
  title: string
  created: Date
  updated: Date
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
  info.sort((a, b) => {
    const aTime = a.updated.getTime()
    const bTime = b.updated.getTime()
    return aTime === bTime ? 0 : aTime > bTime ? -1 : 1
  })
  cache = info
  return info
}
