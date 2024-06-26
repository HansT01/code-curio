import p5 from 'p5'
import { Accessor, createSignal } from 'solid-js'
import { isMouseInCanvas } from '~/utils/camera'
import { Quadtree, Rectangle } from '~/utils/quadtree'
import Canvas from './p5/canvas'
import Slider from './widgets/slider'

class Boid {
  p: p5
  config: Accessor<typeof defaultConfig>
  position: p5.Vector
  velocity: p5.Vector

  constructor(p: p5, config: Accessor<typeof defaultConfig>) {
    this.p = p
    this.config = config
    this.position = p.createVector(p.random(-p.width / 2, p.width / 2), p.random(-p.height / 2, p.height / 2))
    this.velocity = p5.Vector.random2D()
    this.velocity.setMag(p.random(1, 2))
  }

  edge() {
    const halfWidth = this.p.width / 2
    const halfHeight = this.p.height / 2
    if (this.position.x < this.config().edgeMargin - halfWidth) {
      this.velocity.add(this.config().edgeFactor, 0)
    } else if (this.position.x > halfWidth - this.config().edgeMargin) {
      this.velocity.sub(this.config().edgeFactor, 0)
    }
    if (this.position.y < this.config().edgeMargin - halfHeight) {
      this.velocity.add(0, this.config().edgeFactor)
    } else if (this.position.y > halfHeight - this.config().edgeMargin) {
      this.velocity.sub(0, this.config().edgeFactor)
    }
  }

  mouse() {
    if (!isMouseInCanvas(this.p)) {
      return
    }
    const x = this.p.mouseX - this.p.width / 2
    const y = this.p.mouseY - this.p.height / 2
    const distance = this.p.dist(this.position.x, this.position.y, x, y)
    if (distance < this.config().visualRange) {
      this.velocity.add(
        (this.position.x - x) * this.config().mouseFactor,
        (this.position.y - y) * this.config().mouseFactor,
      )
    }
  }

  separation(boids: Boid[]) {
    let xOffset = 0
    let yOffset = 0
    let neighbors = 0
    for (let boid of boids) {
      if (this === boid) {
        continue
      }
      const distance = this.p.dist(this.position.x, this.position.y, boid.position.x, boid.position.y)
      if (distance < this.config().visualRange && distance > 0) {
        const offset = p5.Vector.sub(this.position, boid.position)
        offset.normalize()
        offset.div(distance)
        xOffset += offset.x
        yOffset += offset.y
        neighbors += 1
      }
    }
    if (neighbors > 0) {
      xOffset /= neighbors
      yOffset /= neighbors
    }
    this.velocity.add(xOffset * this.config().separationFactor, yOffset * this.config().separationFactor)
  }

  alignment(boids: Boid[]) {
    let xVelAvg = 0
    let yVelAvg = 0
    let neighbors = 0
    for (let boid of boids) {
      if (this === boid) {
        continue
      }
      const distance = this.p.dist(this.position.x, this.position.y, boid.position.x, boid.position.y)
      if (distance < this.config().visualRange) {
        xVelAvg += boid.velocity.x
        yVelAvg += boid.velocity.y
        neighbors += 1
      }
    }
    if (neighbors > 0) {
      xVelAvg /= neighbors
      yVelAvg /= neighbors
    }
    this.velocity.add(xVelAvg * this.config().alignmentFactor, yVelAvg * this.config().alignmentFactor)
  }

  cohesion(boids: Boid[]) {
    let xPosAvg = 0
    let yPosAvg = 0
    let neighbors = 0
    for (let boid of boids) {
      if (this === boid) {
        continue
      }
      const distance = this.p.dist(this.position.x, this.position.y, boid.position.x, boid.position.y)
      if (distance < this.config().visualRange) {
        xPosAvg += boid.position.x
        yPosAvg += boid.position.y
        neighbors += 1
      }
    }
    if (neighbors > 0) {
      xPosAvg /= neighbors
      yPosAvg /= neighbors
    }
    this.velocity.add(
      (xPosAvg - this.position.x) * this.config().cohesionFactor,
      (yPosAvg - this.position.y) * this.config().cohesionFactor,
    )
  }

  update(boids: Boid[]) {
    this.separation(boids)
    this.alignment(boids)
    this.cohesion(boids)
    this.edge()
    this.mouse()
    this.velocity.setMag(this.p.min(this.velocity.mag(), this.config().maxVelocity))
    this.position.add(this.velocity)
  }

  show() {
    this.p.push()
    this.p.translate(this.position.x, this.position.y)
    this.p.rotate(this.velocity.heading())
    this.p.triangle(-10, -5, -10, 5, 10, 0)
    this.p.pop()
  }
}

const defaultConfig = {
  maxVelocity: 3,
  visualRange: 40,
  separationFactor: 2,
  alignmentFactor: 0.02,
  cohesionFactor: 0.002,
  edgeMargin: 100,
  edgeFactor: 0.05,
  mouseFactor: 0.01,
}

const FlockingSimulationCanvas = () => {
  const [config, setConfig] = createSignal(defaultConfig)
  const flock: Boid[] = []

  const setup = (p: p5) => {
    for (let i = 0; i < 300; i++) {
      flock.push(new Boid(p, config))
    }
  }

  const draw = (p: p5) => {
    p.background(50)
    p.translate(p.width / 2, p.height / 2)
    const quadtree = new Quadtree<Boid>(new Rectangle(0, 0, p.width, p.height), 5)
    for (let boid of flock) {
      quadtree.insert(boid)
    }
    for (let boid of flock) {
      const range = new Rectangle(boid.position.x, boid.position.y, config().visualRange, config().visualRange)
      const neighbors = quadtree.query(range)
      boid.update(neighbors)
      boid.show()
    }
  }

  return (
    <div class='flex w-full flex-col gap-4'>
      <div class='flex flex-wrap gap-4'>
        <Slider
          id='separation-factor'
          label='Separation Factor'
          min={0}
          max={defaultConfig.separationFactor * 5}
          value={defaultConfig.separationFactor}
          onChange={(e) => setConfig({ ...config(), separationFactor: parseFloat(e.target.value) })}
        />
        <Slider
          id='alignment-factor'
          label='Alignment Factor'
          min={0}
          max={defaultConfig.alignmentFactor * 5}
          value={defaultConfig.alignmentFactor}
          onChange={(e) => setConfig({ ...config(), alignmentFactor: parseFloat(e.target.value) })}
        />
        <Slider
          id='cohesion-factor'
          label='Cohesion Factor'
          min={0}
          max={defaultConfig.cohesionFactor * 5}
          value={defaultConfig.cohesionFactor}
          onChange={(e) => setConfig({ ...config(), cohesionFactor: parseFloat(e.target.value) })}
        />
      </div>
      <small>Use the cursor to repel the boids.</small>
      <Canvas setup={setup} draw={draw} width={854} height={480} />
    </div>
  )
}

export default FlockingSimulationCanvas
