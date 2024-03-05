import { A } from '@solidjs/router'
import { clientOnly } from '@solidjs/start'
import { ErrorBoundary, Show, createSignal, onMount } from 'solid-js'
import CanvasLoader from '~/components/canvas-loader'
import GithubIcon from '~/components/icons/github'
import { CurioInfo } from '~/util/curio'

export const info: CurioInfo = {
  id: 'programming-language-network',
  title: 'Programming Language Network',
  created: new Date('2024-03-01'),
  tags: ['animation', 'data-vis', 'interactive', 'p5.js'],
}

const ProgrammingLanguageOverlapCanvas = clientOnly(() => import('~/components/p5/programming-language-network'))

export default function ProgrammingLanguageOverlap() {
  const [isLoading, setIsLoading] = createSignal(true)

  onMount(() => {
    setIsLoading(false)
  })

  return (
    <main class='flex flex-col gap-6 p-8'>
      <h1 class='text-6xl font-thin'>Programming Language Network</h1>
      <div class='flex flex-wrap'>
        <A
          target='_blank'
          href='https://github.com/HansT01/code-curio/blob/main/src/components/p5/programming-language-network.tsx'
        >
          <button class='flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-primary-fg hover:bg-secondary hover:text-secondary-fg'>
            <GithubIcon />
            View Source Code
          </button>
        </A>
      </div>
      <section class='flex flex-col gap-4'>
        <h2 class='text-4xl font-extralight'>Introduction</h2>
        <p>
          Programming languages are tools that developers use to communicate instructions to computers. They encompass a
          set of rules and symbols that define the syntax and semantics for writing code.
        </p>
        <p>
          As developers gain experience and work on different projects, they often specialize in a set of programming
          languages. This specialization can be influenced by various factors such as personal interest, job
          requirements, industry trends, and project needs.
        </p>
        <p>
          The data used for this visualization is from the 2023 Stack Overflow Survey. Read more about it{' '}
          <A target='_blank' href='https://insights.stackoverflow.com/survey' class='underline'>
            here
          </A>
          .
        </p>
      </section>
      <section class='min-h-[480px]'>
        <ErrorBoundary fallback={(error, reset) => <CanvasLoader error={error.toString()} onClick={reset} />}>
          <Show when={!isLoading()} fallback={<CanvasLoader />}>
            <ProgrammingLanguageOverlapCanvas />
          </Show>
        </ErrorBoundary>
      </section>
      <section class='flex flex-col gap-4'>
        <h2 class='text-4xl font-extralight'>Methods</h2>
        <p>
          The data utilized in this visualization consisted of the programming languages they had worked with in the
          past year. Using this data, a co-occurrence matrix was generated and utilized for the visualization, which can
          be accessed in the{' '}
          <A
            target='_blank'
            href='https://github.com/HansT01/code-curio/blob/main/public/data/languages-co-occurence.json'
            class='underline'
          >
            public/data
          </A>{' '}
          directory of the source code.
        </p>
        <p>
          Each node in the visualization represents a programming language, with the radius of the node being
          proportional to the cube root of the number of respondents who have worked with that language. The simulation
          employs three distinct forces on each node: attraction and repulsion forces between nodes, and a radial
          acceleration to maintain stability.
        </p>
        <p>
          The attraction forces between nodes are based on the edges in the network, which are undirected. The strength
          of the attraction force is determined by the square of the higher overlap between two languages. For instance,
          if 5% of C programmers have worked with Assembly, but 90% of Assembly programmers have worked with C, the edge
          weight is a coefficient multiplied by 0.81. On the other hand, the repulsion force is inversely proportional
          to the squared distance between two nodes.
        </p>
      </section>
      <section class='flex flex-col gap-4'>
        <h2 class='text-4xl font-extralight'>Results</h2>
        <p>
          One notable observation from the simulation is the tendency for certain groups of languages to navigate
          towards each other despite shuffling. For example, languages like C, C++, and Assembly tend to cluster
          together, as do Microsoft products such as Visual Basic .NET, C#, VBA, PowerShell, and F#. Web-related
          languages also exhibit a tendency to cluster together.
        </p>
        <p>
          By graphing the interconnectedness of programming languages, this visualization can offer insights into the
          factors that shape developers' language choices and specialization paths. Alternatively, it could be used to
          confirm or challenge the biases and stereotypes about developers of certain languages, as it provides a visual
          representation of the clustering tendencies of languages based on their real-world usage.
        </p>
      </section>
    </main>
  )
}
