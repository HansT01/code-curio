import { A } from '@solidjs/router'
import { Component, Show, createSignal, onCleanup, onMount } from 'solid-js'

const Footer: Component = () => {
  const [width, setWidth] = createSignal(1080)
  let footerRef: HTMLElement | undefined

  onMount(() => {
    const updateWidth = () => {
      if (footerRef === undefined) {
        return
      }
      setWidth(footerRef.offsetWidth)
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    onCleanup(() => {
      window.removeEventListener('resize', updateWidth)
    })
  })

  return (
    <footer class='divide-accent-fg bg-accent text-accent-fg flex w-full justify-center divide-x py-8' ref={footerRef}>
      <div class='flex flex-col items-start justify-center px-8'>
        <h1 class='text-4xl font-extralight'>Code Curio</h1>
        <small class='font-extralight'>©{new Date().getFullYear()} Hans Teh</small>
      </div>
      {/* Tailwind's divide-x selector is purely structural (:where(.divide-x > :not(:last-child))) -
          it has no concept of a hidden/visually-collapsed sibling, so the divider would still show
          against the first section unless this one is actually removed from the DOM, not just
          hidden via CSS. */}
      <Show when={width() >= 480}>
        <div class='flex flex-col items-start justify-center px-8'>
          <h2 class='text-2xl font-extralight'>Contact</h2>
          <A target='_blank' href='https://www.linkedin.com/in/hans-teh-628b4a227'>
            <small class='font-extralight'>LinkedIn</small>
          </A>
          <A target='_blank' href='https://github.com/HansT01'>
            <small class='font-extralight'>GitHub</small>
          </A>
          <A target='_blank' href='https://discord.com/users/197132595727826944'>
            <small class='font-extralight'>Discord</small>
          </A>
        </div>
      </Show>
    </footer>
  )
}

export default Footer
