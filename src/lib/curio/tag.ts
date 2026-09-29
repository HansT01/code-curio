export const validTags = [
  'p5.js',
  'data-vis',
  'interactive',
  'art',
  'algorithms',
  'simulation',
  'game',
  'animation',
  'machine-learning',
  'physics',
  '3d',
  'shader',
  'networking',
  'real-time',
] as const

export type CurioTag = (typeof validTags)[number]
