import { A } from '@solidjs/router'

export default function Home() {
  return (
    <main class='flex flex-col gap-6 p-8'>
      <header>
        <h1 class='text-6xl font-thin'>Welcome to Code Curio!</h1>
      </header>
      <div class='flex flex-col gap-4'>
        <p>
          Welcome to Code Curio, a collection of original interactive experiments where I explore ideas in programming,
          mathematics, and computer graphics through projects I build myself.
        </p>
        <p>
          This website was created out of a desire to bring to life the captivating visualizations and interactive
          projects often only seen as static images or videos online. As a sole developer, I wanted to share my
          creations with others, providing myself a platform where these projects could be experienced firsthand.
        </p>
        <p>For the best experience, please use a mouse and a browser with hardware acceleration.</p>
        <p>
          Head over to the{' '}
          <A target='_blank' class='underline' href={import.meta.env.VITE_GITHUB_URL}>
            GitHub page
          </A>{' '}
          to view the source code.
        </p>
      </div>
    </main>
  )
}
