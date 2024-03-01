import { A } from '@solidjs/router'
import { clientOnly } from '@solidjs/start'
import GithubIcon from '~/components/icons/github'
import { CurioInfo } from '~/util/curio'

export const info: CurioInfo = {
  id: 'coriolis-effect',
  title: 'Coriolis Effect',
  created: new Date(2024, 2, 28),
  tags: ['algorithms', 'animation', 'interactive', 'p5.js', 'physics', 'simulation', '3d'],
}

const CoriolisEffectCanvas = clientOnly(() => import('~/components/p5/coriolis-effect'))

export default function CoriolisEffect() {
  return (
    <main class='flex flex-col gap-6 p-8'>
      <h1 class='text-6xl font-thin'>Coriolis Effect</h1>
      <div class='flex flex-wrap'>
        <A target='_blank' href='https://github.com/HansT01/code-curio/blob/main/src/components/p5/coriolis-effect.tsx'>
          <button class='flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-primary-fg hover:bg-secondary hover:text-secondary-fg'>
            <GithubIcon />
            View Source Code
          </button>
        </A>
      </div>
      <p>
        The Coriolis effect is a phenomenon that occurs due to the rotation of the Earth. It causes moving objects, such
        as air masses or ocean currents, to be deflected to the right in the Northern Hemisphere and to the left in the
        Southern Hemisphere. This deflection is a result of the Earth's rotation and the conservation of angular
        momentum, which causes freely moving objects to appear to curve from an observer's perspective on the rotating
        Earth.
        <br />
        <br />
        One of the most well-known examples of the Coriolis effect is its impact on weather patterns. In the Northern
        Hemisphere, winds tend to curve to the right, leading to the formation of cyclones. In the Southern Hemisphere,
        winds curve to the left, influencing the formation of cyclones there as well.
        <br />
        <br />
        This simulation assumes the perspective of an observer rotating alongside a sphere representing Earth, and
        attempts to simulate the impact of the Coriolis force on the direction of winds.
      </p>
      <CoriolisEffectCanvas />
    </main>
  )
}
