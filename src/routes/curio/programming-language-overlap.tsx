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
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris maximus venenatis magna eget ornare. Integer
        efficitur odio nunc, vitae mattis diam vehicula vel. Nullam eu elementum tellus, eget mattis quam. Duis euismod
        leo id elit venenatis placerat sit amet et ligula. Curabitur id dolor sit amet enim placerat semper. Sed risus
        dui, venenatis a justo in, tristique elementum sem. Interdum et malesuada fames ac ante ipsum primis in
        faucibus.
      </p>
      <ProgrammingLanguageOverlapCanvas />
    </main>
  )
}
