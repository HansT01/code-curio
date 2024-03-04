import { A } from '@solidjs/router'
import { clientOnly } from '@solidjs/start'
import { Show, createSignal, onMount } from 'solid-js'
import CanvasLoader from '~/components/canvas-loader'
import GithubIcon from '~/components/icons/github'
import { CurioInfo } from '~/util/curio'

export const info: CurioInfo = {
  id: 'neon-constellation',
  title: 'Neon Constellation (Shader Render)',
  created: new Date('2024-03-03'),
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
      <section class='flex flex-col gap-4'>
        <h2 class='text-4xl font-extralight'>Introduction</h2>
        <p>
          Neon Constellation isn't simulating anything to do with real world constellations. However, it is simulating
          the perfectly elastic physics of bodies in motion within an indealized enclosed system. In other words, the
          kinetic energy observable in the simulation remains constant until an external interference is applied. It is
          also simulating the casting of shadows.
        </p>
        <p>
          In this simulation, you are able to drag and throw around the lights and obstacles. You are also able to
          modify amount of energy lost when an object collides with the edge of the simulation.
        </p>
      </section>
      <section class='min-h-[480px]'>
        <Show when={!isLoading()} fallback={<CanvasLoader />}>
          <NeonConstellationCanvas />
        </Show>
      </section>
      <section class='flex flex-col gap-4'>
        <h2 class='text-4xl font-extralight'>My Experience With Shaders</h2>
        <p>
          This curio was my first time in writing shader code. In the simulation for the Coriolis effect, I needed to
          use WebGL for 3D rendering. I noticed that the rendering performance in 3D was quite slow, especially when
          trails were enabled. This was despite the fact that the amount of vertices in the render was miniscule
          compared to what modern games demanded. It became apparent to me that if I wanted to take my projects a step
          further, I would need to learn to make use of the GPU myself.
        </p>
        <p>
          Shaders are incredibly powerful, as they allow you to easily parallelize highly optimized renders on the GPU.
          If you're interested in learning more about what you can do with shaders, I implore you to head over to{' '}
          <A target='_blank' href='https://www.shadertoy.com/browse' class='underline'>
            Shadertoy
          </A>{' '}
          to peruse through the works of others, all made using GLSL shaders!
        </p>
        <p>
          Despite the visible results, my first experience writing shader code wasn't seamless. There was no direct
          feedback loop, so it made testing issues incredibly tedious. There were limited debugging capabilities, as
          code executes on the GPU. Optimizing shader code required knowledge in mathematics for vector and matrix
          operations. "If" statements may cause branching, which hinders the rendering performance. When I read other
          people's code, it was like trying to decipher an ancient cryptic text. I had no idea what I was doing when I
          was working on this curio, and I doubt many would either. But despite all that, this experience was something
          I definitely don't regret. After all, programming wouldn't be nearly as fun if it wasn't challenging.
        </p>
      </section>
    </main>
  )
}
