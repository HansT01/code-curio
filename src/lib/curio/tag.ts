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

export type CurioTag = (typeof validTags)[number]
