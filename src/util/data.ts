import { promises as fs } from 'fs'

export const getCoOccurenceMatrix = async (): Promise<{ columns: string[]; data: number[][] }> => {
  'use server'
  const path = process.cwd() + '/src/data/languages-co-occurence.json'
  const file = await fs.readFile(path, 'utf8')
  const data = JSON.parse(file)
  return data
}
