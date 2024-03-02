import p5 from 'p5'
import { Accessor, createSignal } from 'solid-js'
import Canvas from '../canvas'

class NeonBubble {
  p: p5
  config: Accessor<typeof defaultConfig>
  radius: number
  position: p5.Vector
  velocity: p5.Vector

  constructor(p: p5, config: Accessor<typeof defaultConfig>, radius: number) {
    this.p = p
    this.config = config
    this.radius = radius
    this.position = p.createVector(p.random(-p.width / 2, p.width / 2), p.random(-p.height / 2, p.height / 2))
    this.velocity = p5.Vector.random2D()
  }

  mass() {
    return this.radius ** 2
  }

  collide(bubble: NeonBubble) {
    if (bubble === this) {
      return
    }
    const distance = this.p.dist(this.position.x, this.position.y, bubble.position.x, bubble.position.y)
  }
}

const defaultConfig = {}

const NeonConstellationCanvas = () => {
  const [config, setConfig] = createSignal(defaultConfig)

  const setup = (p: p5) => {}

  const draw = (p: p5) => {
    p.background(50)
    p.translate(p.width / 2, p.height / 2)
  }

  return (
    <div class='flex w-full flex-col gap-4'>
      <Canvas setup={setup} draw={draw} width={854} height={480} webgl />
    </div>
  )
}

export default NeonConstellationCanvas
