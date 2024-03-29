import { A } from '@solidjs/router'

export default function Home() {
  return (
    <main class='flex flex-col gap-8 p-8'>
      <h1 class='text-6xl font-thin'>Welcome to Code Curio!</h1>
      <p>
        Welcome to Code Curio, a digital cabinet of curiosity where you can explore a collection of small, interactive
        code projects crafted with passion and curiosity.
        <br />
        <br />
        This project was created out of a desire to bring to life the captivating visualizations and interactive
        projects often only seen as static images or videos online. As a sole developer, I wanted to share my creations
        with others, providing a platform where these projects could be experienced firsthand.
        <br />
        <br />
        For the best experience, please use a mouse.
        <br />
        <br />
        Head over to the{' '}
        <A target='_blank' class='underline' href='https://github.com/HansT01/code-curio'>
          GitHub page
        </A>{' '}
        to view the source code.
      </p>
    </main>
  )
}
