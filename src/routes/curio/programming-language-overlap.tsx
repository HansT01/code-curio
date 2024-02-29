import { A } from '@solidjs/router'
import { clientOnly } from '@solidjs/start'
import GithubIcon from '~/components/icons/github'
import { CurioInfo } from '~/util/curio'

export const info: CurioInfo = {
  id: 'programming-language-overlap',
  title: 'Programming Language Overlap',
  created: new Date(2024, 2, 30),
  tags: [],
}

const ProgrammingLanguageOverlapCanvas = clientOnly(() => import('~/components/p5/programming-language-overlap'))

export default function ProgrammingLanguageOverlap() {
  return (
    <main class='flex flex-col gap-6 p-8'>
      <h1 class='text-6xl font-thin'>Programming Language Overlap</h1>
      <div class='flex flex-wrap'>
        <A target='_blank' href='/'>
          <button class='flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-primary-fg hover:bg-secondary hover:text-secondary-fg'>
            <GithubIcon />
            View Source Code
          </button>
        </A>
      </div>
      <ProgrammingLanguageOverlapCanvas />
    </main>
  )
}
