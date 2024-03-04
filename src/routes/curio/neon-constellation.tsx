import { A } from '@solidjs/router'
import { clientOnly } from '@solidjs/start'
import { Show, createSignal, onMount } from 'solid-js'
import CanvasLoader from '~/components/canvas-loader'
import GithubIcon from '~/components/icons/github'
import { CurioInfo } from '~/util/curio'

export const info: CurioInfo = {
  id: 'neon-constellation',
  title: 'Neon Constellation',
  created: new Date(2024, 3, 3),
  tags: ['algorithms', 'animation', 'art', 'interactive', 'p5.js', 'physics', 'simulation', 'shader'],
}

const NeonConstellationCanvas = clientOnly(() => import('~/components/p5/neon-constellation'))

export default function NeonConstellation() {
  const [isLoading, setIsLoading] = createSignal(true)

  onMount(() => {
    setIsLoading(false)
  })

  return (
    <main class='flex flex-col gap-6 p-8'>
      <h1 class='text-6xl font-thin'>Neon Constellation (Shader Render)</h1>
      <div class='flex flex-wrap'>
        <A
          target='_blank'
          href='https://github.com/HansT01/code-curio/blob/main/src/components/p5/neon-constellation.tsx'
        >
          <button class='flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-primary-fg hover:bg-secondary hover:text-secondary-fg'>
            <GithubIcon />
            View Source Code
          </button>
        </A>
      </div>
      <p>
        Neon Constellation isn't simulating anything to do with real life constellations. However, it is simulating the
        physics of bodies of motion within an indealized enclosed system. The kinetic energy obersvable in the
        simulation remains constant throughout the its lifetime.
      </p>
      <div class='min-h-[480px]'>
        <Show when={!isLoading()} fallback={<CanvasLoader />}>
          <NeonConstellationCanvas />
        </Show>
      </div>
      <p>
        This curio was my first time writing shader code. In the simulation for the Coriolis effect, I needed to use
        WebGL for 3D rendering. I noticed that rendering performance in 3D was quite slow, especially when trails were
        enabled. This was despite the fact that the amount of vertices in the render was miniscule compared to what
        modern games demanded. It became apparent to me that if I wanted to take my projects a step further, I would
        need to learn to make use of the GPU myself.
        <br />
        <br />
        Shaders are incredibly powerful, as they allow you to easily parallelize renders on the GPU. If you're
        interested in learning more about what you can do with shaders, I implore you to head over to Shadertoy to
        peruse through the works of others, all made using shaders!
        <br />
        <br />
        Errors were incredibly painful to debug. There was absolutely no context given by the WebGL api, nor the p5.js
        wrapper. I had spent a good few hours trying to figure out why nothing was rendering, only to realise that it
        had nothing to do with the shader code. It turned out that I had been trying to import shader code from the
        wrong directory! An issue I wasn't entirely able to resolve (yet), was to figure out how to clear the buffers
        when setting uniform variables in the fragment code when dealing with a variable sized input.
      </p>
    </main>
  )
}
