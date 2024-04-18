import { A } from '@solidjs/router'

export default function Home() {
  return (
    <main class='flex flex-col gap-4 p-8'>
      <h1 class='text-6xl font-thin'>Welcome to Code Curio!</h1>
      <p>
        Welcome to Code Curio, a digital cabinet of curiosity where you can explore a collection of small, interactive
        canvas projects.
      </p>
      <p>
        This project was created out of a desire to bring to life the captivating visualizations and interactive
        projects often only seen as static images or videos online. As a sole developer, I wanted to share my creations
        with others, providing a platform where these projects could be experienced firsthand.
      </p>
      <p>For the best experience, please use a mouse and a browser with hardware acceleration.</p>
      <p>
        Head over to the{' '}
        <A target='_blank' class='underline' href={import.meta.env.VITE_GITHUB_URL}>
          GitHub page
        </A>{' '}
        to view the source code.
      </p>
    </main>
  )
}
