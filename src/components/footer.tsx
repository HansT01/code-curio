import { A } from '@solidjs/router'
import { Component } from 'solid-js'

const Footer: Component = (props) => {
  return (
    <footer class='flex w-full justify-center divide-x divide-accent-fg bg-accent py-8 text-accent-fg'>
      <div class='flex flex-col items-start justify-center px-8'>
        <h1 class='text-4xl font-extralight'>Code Curio</h1>
        <small class='font-extralight'>©2024 Hans Teh</small>
      </div>
      <div class='flex flex-col items-start justify-center px-8'>
        <h2 class='text-2xl font-extralight'>Contact</h2>
        <A href='/'>
          <small class='font-extralight'>LinkedIn</small>
        </A>
        <A href='/'>
          <small class='font-extralight'>GitHub</small>
        </A>
        <A href='/'>
          <small class='font-extralight'>Discord</small>
        </A>
      </div>
    </footer>
  )
}

export default Footer
