import { Minus, Plus } from 'lucide-solid'
import p5 from 'p5'
import { Accessor, createSignal } from 'solid-js'
import { Quadtree, Rectangle } from '~/util/quadtree'
import Canvas from '../canvas'

class NeonBubble {
  p: p5
  config: Accessor<typeof defaultConfig>
  radius: number
  color?: [number, number, number]
  position: p5.Vector
  velocity: p5.Vector

  constructor(p: p5, config: Accessor<typeof defaultConfig>, radius: number, color?: [number, number, number]) {
    this.p = p
    this.config = config
    this.radius = radius
    this.color = color
    this.position = p.createVector(p.random(-p.width / 2, p.width / 2), p.random(-p.height / 2, p.height / 2))
    this.velocity = p5.Vector.random2D()
    this.velocity.setMag(20 / radius)
  }

  mass() {
    return this.radius ** 2
  }

  energy() {
    return 0.5 * this.mass() * (this.velocity.x ** 2 + this.velocity.y ** 2)
  }

  isOnLine(start: p5.Vector, end: p5.Vector) {
    const line = p5.Vector.sub(end, start)
    const length = line.mag()
    const direction = line.normalize()
    let t = p5.Vector.sub(this.position, start).dot(direction.x, direction.y)
    t = this.p.max(t, 0.0)
    t = this.p.min(t, length)
    const closestPoint = p5.Vector.add(start, direction.mult(t))
    const distance = this.p.dist(closestPoint.x, closestPoint.y, this.position.x, this.position.y)
    if (distance < this.radius) {
      return true
    }
    return false
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
  const [lightCountIndex, setLightCountIndex] = createSignal(5)
  const [obstacleCountIndex, setObstacleCountIndex] = createSignal(4)
  const count = [0, 1, 2, 4, 7, 10, 14, 20]
  const bubbles: NeonBubble[] = []
  const linePairs: [NeonBubble, NeonBubble][] = []

  let shader: p5.Shader
  let resetCanvas: () => void

  const preload = (p: p5) => {
    shader = p.loadShader('/shaders/neon-constellation.vert', '/shaders/neon-constellation.frag')
  }

  const setup = (p: p5) => {
    p.shader(shader)
    p.noStroke()
    resetCanvas = () => {
      bubbles.length = 0
      linePairs.length = 0

      for (let i = 0; i < count[lightCountIndex()]; i++) {
        bubbles.push(new NeonBubble(p, config, p.random(5, 10), [p.random(), p.random(), p.random()]))
      }
      for (let i = 0; i < bubbles.length; i++) {
        for (let j = i + 1; j < bubbles.length; j++) {
          linePairs.push([bubbles[i], bubbles[j]])
        }
      }
      for (let i = 0; i < count[obstacleCountIndex()]; i++) {
        bubbles.push(new NeonBubble(p, config, p.random(10, 60)))
      }

      shader.setUniform('u_lightPositions', new Array(count[count.length - 1] * 2).fill(0))
      shader.setUniform('u_lightRadii', new Array(count[count.length - 1]).fill(0))
      shader.setUniform('u_lightColors', new Array(count[count.length - 1] * 3).fill(0))

      shader.setUniform('u_obstaclePositions', new Array(count[count.length - 1] * 2).fill(0))
      shader.setUniform('u_obstacleRadii', new Array(count[count.length - 1]).fill(0))
    }
    resetCanvas()
  }

  const draw = (p: p5) => {
    p.rect(0, 0, p.width, p.height)
    shader.setUniform('u_resolution', [p.width, p.height])

    const quadtree = new Quadtree<NeonBubble>(new Rectangle(0, 0, p.width, p.height), 5)
    for (let bubble of bubbles) {
      quadtree.insert(bubble)
    }
    for (let bubble of bubbles) {
      const range = new Rectangle(bubble.position.x, bubble.position.y, 200, 200)
      const neighbors = quadtree.query(range)
      bubble.update(neighbors)
    }

    const lineStartPositions: number[] = []
    const lineEndPositions: number[] = []
    const lineColors: number[] = []
    for (let [bubble, neighbor] of linePairs) {
      const distance = p.dist(bubble.position.x, bubble.position.y, neighbor.position.x, neighbor.position.y)
      if (distance > 200) {
        continue
      }
      const range = new Rectangle(
        (bubble.position.x + neighbor.position.x) / 2,
        (bubble.position.y + neighbor.position.y) / 2,
        distance / 2,
        distance / 2,
      )
      const obstacles = quadtree.query(range)
      let anyOnLine = false
      for (let obstacle of obstacles) {
        if (obstacle === bubble || obstacle === neighbor) {
          continue
        }
        anyOnLine ||= obstacle.isOnLine(bubble.position, neighbor.position)
      }
      if (anyOnLine) {
        continue
      }
      lineStartPositions.push(bubble.position.x, bubble.position.y)
      lineEndPositions.push(neighbor.position.x, neighbor.position.y)
      lineColors.push(...bubble.color!.map((num, index) => (num + neighbor.color![index]) / 2))
    }

    const lightPositions: number[] = []
    const lightRadii: number[] = []
    const lightColors: number[] = []
    const obstaclePositions: number[] = []
    const obstacleRadii: number[] = []

    for (let bubble of bubbles) {
      if (bubble.color !== undefined) {
        lightPositions.push(bubble.position.x, bubble.position.y)
        lightRadii.push(bubble.radius)
        lightColors.push(...bubble.color)
      } else {
        obstaclePositions.push(bubble.position.x, bubble.position.y)
        obstacleRadii.push(bubble.radius)
      }
    }
    for (let i = lineStartPositions.length; i < 100; i++) {
      lineStartPositions.push(0, 0)
      lineEndPositions.push(0, 0)
      lineColors.push(0, 0, 0)
    }

    shader.setUniform('u_lightPositions', lightPositions)
    shader.setUniform('u_lightRadii', lightRadii)
    shader.setUniform('u_lightColors', lightColors)

    shader.setUniform('u_obstaclePositions', obstaclePositions)
    shader.setUniform('u_obstacleRadii', obstacleRadii)

    shader.setUniform('u_lineStart', lineStartPositions)
    shader.setUniform('u_lineEnd', lineEndPositions)
    shader.setUniform('u_lineColors', lineColors)
  }

  const increaseLightCount = () => {
    setLightCountIndex((index) => (index < count.length - 1 ? index + 1 : index))
    resetCanvas()
  }

  const reduceLightCount = () => {
    setLightCountIndex((index) => (index > 0 ? index - 1 : index))
    resetCanvas()
  }

  const increaseObstacleCount = () => {
    setObstacleCountIndex((index) => (index < count.length - 1 ? index + 1 : index))
    resetCanvas()
  }

  const reduceObstacleCount = () => {
    setObstacleCountIndex((index) => (index > 0 ? index - 1 : index))
    resetCanvas()
  }

  return (
    <div class='flex w-full flex-col gap-4'>
      <div class='flex flex-wrap gap-4'>
        <div class='flex flex-col items-start'>
          <label for='particle-count' class='mb-2'>
            Light Count
          </label>
          <div class='flex' id='particle-count'>
            <button
              class='h-full divide-secondary rounded-l-lg bg-primary px-2  py-3 text-primary-fg hover:bg-secondary hover:text-secondary-fg'
              onClick={reduceLightCount}
            >
              <Minus />
            </button>
            <div class='h-full w-16 bg-secondary py-3 text-center text-secondary-fg'>{count[lightCountIndex()]}</div>
            <button
              class='h-full divide-secondary rounded-r-lg bg-primary px-2  py-3 text-primary-fg hover:bg-secondary hover:text-secondary-fg'
              onClick={increaseLightCount}
            >
              <Plus />
            </button>
          </div>
        </div>
        <div class='flex flex-col items-start'>
          <label for='particle-count' class='mb-2'>
            Obstacle Count
          </label>
          <div class='flex' id='particle-count'>
            <button
              class='h-full divide-secondary rounded-l-lg bg-primary px-2  py-3 text-primary-fg hover:bg-secondary hover:text-secondary-fg'
              onClick={reduceObstacleCount}
            >
              <Minus />
            </button>
            <div class='h-full w-16 bg-secondary py-3 text-center text-secondary-fg'>{count[obstacleCountIndex()]}</div>
            <button
              class='h-full divide-secondary rounded-r-lg bg-primary px-2  py-3 text-primary-fg hover:bg-secondary hover:text-secondary-fg'
              onClick={increaseObstacleCount}
            >
              <Plus />
            </button>
          </div>
        </div>
      </div>
      <Canvas preload={preload} setup={setup} draw={draw} width={854} height={480} webgl />
    </div>
  )
}

export default NeonConstellationCanvas
