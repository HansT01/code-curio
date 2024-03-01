import p5 from 'p5'
import { Accessor, createSignal } from 'solid-js'
import { Quadtree, Rectangle } from '~/util/quadtree'
import Canvas from '../canvas'

class Boid {
  p: p5
  config: Accessor<typeof defaultConfig>
  position: p5.Vector
  velocity: p5.Vector

  constructor(p: p5, config: Accessor<typeof defaultConfig>) {
    this.p = p
    this.config = config
    this.position = p.createVector(p.random(p.width), p.random(p.height))
    this.velocity = p5.Vector.random2D()
    this.velocity.setMag(p.random(1, 2))
  }

  edge() {
    if (this.position.x < this.config().edgeMargin) {
      this.velocity.add(this.config().edgeFactor, 0)
    } else if (this.position.x > this.p.width - this.config().edgeMargin) {
      this.velocity.sub(this.config().edgeFactor, 0)
    }
    if (this.position.y < this.config().edgeMargin) {
      this.velocity.add(0, this.config().edgeFactor)
    } else if (this.position.y > this.p.height - this.config().edgeMargin) {
      this.velocity.sub(0, this.config().edgeFactor)
    }
  }

  mouse() {
    if (this.p.mouseX < 0 || this.p.mouseX > this.p.width || this.p.mouseY < 0 || this.p.mouseY > this.p.height) {
      return
    }
    const distance = this.p.dist(this.position.x, this.position.y, this.p.mouseX, this.p.mouseY)
    if (distance < this.config().visualRange) {
      this.velocity.add(
        (this.position.x - this.p.mouseX) * this.config().mouseFactor,
        (this.position.y - this.p.mouseY) * this.config().mouseFactor,
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
  const dimensions = { width: 854, height: 480 }
  const [config, setConfig] = createSignal(defaultConfig)

  const sketch = (p: p5) => {
    const flock: Boid[] = []

    p.setup = () => {
      const canvas = p.createCanvas(dimensions.width, dimensions.height)
      canvas.style('visibility', 'visible')
      for (let i = 0; i < 300; i++) {
        flock.push(new Boid(p, config))
      }
    }

    p.draw = () => {
      p.background(50)
      const quadtree = new Quadtree<Boid>(new Rectangle(-p.width, -p.height, 3 * p.width, 3 * p.height), 5)
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
  }

  return (
    <div class='flex w-full flex-col gap-4'>
      <div class='flex flex-wrap gap-4'>
        <div class='flex flex-col items-start'>
          <label for='separation-factor' class='mb-2'>
            Separation Factor
          </label>
          <input
            id='separation-factor'
            type='range'
            min={0}
            max={defaultConfig.separationFactor * 5}
            value={defaultConfig.separationFactor}
            step={defaultConfig.separationFactor / 20}
            class='h-2 w-40 cursor-pointer appearance-none rounded-lg bg-primary accent-primary-fg'
            onChange={(e) => setConfig({ ...config(), separationFactor: parseFloat(e.target.value) })}
          />
        </div>
        <div class='flex flex-col items-start'>
          <label for='alignment-factor' class='mb-2'>
            Alignment Factor
          </label>
          <input
            id='alignment-factor'
            type='range'
            min={0}
            max={defaultConfig.alignmentFactor * 5}
            value={defaultConfig.alignmentFactor}
            step={defaultConfig.alignmentFactor / 20}
            class='h-2 w-40 cursor-pointer appearance-none rounded-lg bg-primary accent-primary-fg'
            onChange={(e) => setConfig({ ...config(), alignmentFactor: parseFloat(e.target.value) })}
          />
        </div>
        <div class='flex flex-col items-start'>
          <label for='cohesion-factor' class='mb-2'>
            Cohesion Factor
          </label>
          <input
            id='cohesion-factor'
            type='range'
            min={0}
            max={defaultConfig.cohesionFactor * 5}
            value={defaultConfig.cohesionFactor}
            step={defaultConfig.cohesionFactor / 20}
            class='h-2 w-40 cursor-pointer appearance-none rounded-lg bg-primary accent-primary-fg'
            onChange={(e) => setConfig({ ...config(), cohesionFactor: parseFloat(e.target.value) })}
          />
        </div>
      </div>
      <small>Use the cursor to repel the boids.</small>
      <Canvas sketch={sketch} {...dimensions} />
    </div>
  )
}

export default FlockingSimulationCanvas
