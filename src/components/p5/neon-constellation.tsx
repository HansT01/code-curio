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
    this.velocity.setMag(3)
  }

  mass() {
    return this.radius ** 2
  }

  energy() {
    return 0.5 * this.mass() * (this.velocity.x ** 2 + this.velocity.y ** 2)
  }

  edge() {
    const halfWidth = this.p.width / 2
    const halfHeight = this.p.height / 2
    if (this.position.x - this.radius < -halfWidth) {
      this.velocity.x *= -1
      this.position.x = this.radius - halfWidth
    }
    if (this.position.x + this.radius > halfWidth) {
      this.velocity.x *= -1
      this.position.x = halfWidth - this.radius
    }
    if (this.position.y - this.radius < -halfHeight) {
      this.velocity.y *= -1
      this.position.y = this.radius - halfHeight
    }
    if (this.position.y + this.radius > halfHeight) {
      this.velocity.y *= -1
      this.position.y = halfHeight - this.radius
    }
  }

  collisions(bubbles: NeonBubble[]) {
    for (let bubble of bubbles) {
      if (bubble === this) {
        return
      }
      const distance = p5.Vector.sub(bubble.position, this.position)
      const overlap = bubble.radius + this.radius - distance.mag()
      if (overlap > 0) {
        const correction = distance
          .copy()
          .normalize()
          .mult(overlap / 2)
        const massOffset = this.mass() / bubble.mass()
        this.position.sub(correction.div(massOffset))
        bubble.position.add(correction.mult(massOffset))

        const m1 = this.mass()
        const m2 = bubble.mass()

        const angle = distance.heading()
        const sine = this.p.sin(angle)
        const cosine = this.p.cos(angle)

        const v1 = this.velocity.copy().rotate(-angle)
        const v2 = bubble.velocity.copy().rotate(-angle)

        const v1Final = ((m1 - m2) * v1.x + 2 * m2 * v2.x) / (m1 + m2)
        const v2Final = ((m2 - m1) * v2.x + 2 * m1 * v1.x) / (m1 + m2)

        this.velocity.x = cosine * v1Final - sine * v1.y
        this.velocity.y = cosine * v1.y + sine * v1Final
        bubble.velocity.x = cosine * v2Final - sine * v2.y
        bubble.velocity.y = cosine * v2.y + sine * v2Final
      }
    }
  }

  update(bubbles: NeonBubble[]) {
    this.edge()
    this.position.add(this.velocity)
    this.collisions(bubbles)
  }

  show() {
    this.p.push()
    this.p.stroke(0)
    this.p.strokeWeight(1)
    this.p.fill(255)
    this.p.ellipse(this.position.x, this.position.y, this.radius * 2, this.radius * 2)
    this.p.pop()
  }
}

const defaultConfig = {}

const NeonConstellationCanvas = () => {
  const [config, setConfig] = createSignal(defaultConfig)
  const bubbles: NeonBubble[] = []

  let testShader: p5.Shader

  const preload = (p: p5) => {
    testShader = p.loadShader('/shaders/neon-constellation.vert', '/shaders/neon-constellation.frag')
  }

  const setup = (p: p5) => {
    p.shader(testShader)
    p.noStroke()
  }

  const draw = (p: p5) => {
    p.clear()
    p.rect(0, 0, 1, 1)
  }

  return (
    <div class='flex w-full flex-col gap-4'>
      <Canvas preload={preload} setup={setup} draw={draw} width={854} height={480} webgl />
    </div>
  )
}

export default NeonConstellationCanvas
