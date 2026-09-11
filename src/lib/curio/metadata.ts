import { CurioTag } from './tag'

export interface CurioMetadata {
  id: string
  title: string
  created: Date
  updated: Date
  tags: CurioTag[]
}

let cache: CurioMetadata[] | null = null

export const getAllCurioMetadata = async () => {
  'use server'
  if (cache !== null) {
    return cache
  }
  const context = import.meta.glob('/src/routes/curio/*.tsx')
  const keys = Object.keys(context)
  const info: CurioMetadata[] = await Promise.all(
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
