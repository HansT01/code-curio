import p5 from 'p5'
import { createSignal } from 'solid-js'

const FlockingSimulationCanvas = () => {
  const [width, setWidth] = createSignal(640)
  const [height, setHeight] = createSignal(360)

  const [maxVelocity, setMaxVelocity] = createSignal(2)
  const [protectedRange, setProtectedRange] = createSignal(4)
  const [visualRange, setVisualRange] = createSignal(15)
  const [separationFactor, setSeparationFactor] = createSignal(0.02)
  const [alignmentFactor, setAlignmentFactor] = createSignal(0.02)
  const [cohesionFactor, setCohesionFactor] = createSignal(0.0002)
  const [turnMargin, setTurnMargin] = createSignal(100)
  const [turnFactor, setTurnFactor] = createSignal(0.05)

  const createSketch = (ref: HTMLDivElement) => {
    const sketch = (p: p5) => {
      class Boid {
        position: p5.Vector
        velocity: p5.Vector

        constructor() {
          this.position = p.createVector(p.random(p.width), p.random(p.height))
          this.velocity = p5.Vector.random2D()
          this.velocity.setMag(p.random(1, 2))
        }

        edge() {
          if (this.position.x < turnMargin()) {
            this.velocity.add(turnFactor(), 0)
          } else if (this.position.x > p.width - turnMargin()) {
            this.velocity.sub(turnFactor(), 0)
          }
          if (this.position.y < turnMargin()) {
            this.velocity.add(0, turnFactor())
          } else if (this.position.y > p.height - turnMargin()) {
            this.velocity.sub(0, turnFactor())
          }
        }

        separation(boids: Boid[]) {
          let xDelta = 0
          let yDelta = 0
          for (let boid of boids) {
            if (this === boid) {
              continue
            }
            const distance = p.dist(this.position.x, this.position.y, boid.position.x, boid.position.y)
            if (distance < protectedRange()) {
              xDelta += this.position.x - boid.position.x
              yDelta += this.position.y - boid.position.y
            }
          }
          this.velocity.add(xDelta * separationFactor(), yDelta * separationFactor())
        }

        alignment(boids: Boid[]) {
          let xVelAvg = 0
          let yVelAvg = 0
          let neighbors = 0
          for (let boid of boids) {
            if (this === boid) {
              continue
            }
            const distance = p.dist(this.position.x, this.position.y, boid.position.x, boid.position.y)
            if (distance < visualRange()) {
              xVelAvg += boid.velocity.x
              yVelAvg += boid.velocity.y
              neighbors += 1
            }
          }
          if (neighbors > 0) {
            xVelAvg /= neighbors
            yVelAvg /= neighbors
          }
          this.velocity.add(xVelAvg * alignmentFactor(), yVelAvg * alignmentFactor())
        }

        cohesion(boids: Boid[]) {
          let xPosAvg = 0
          let yPosAvg = 0
          let neighbors = 0
          for (let boid of boids) {
            if (this === boid) {
              continue
            }
            const distance = p.dist(this.position.x, this.position.y, boid.position.x, boid.position.y)
            if (distance < visualRange()) {
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
            (xPosAvg - this.position.x) * cohesionFactor(),
            (yPosAvg - this.position.y) * cohesionFactor(),
          )
        }

        update(boids: Boid[]) {
          this.separation(boids)
          this.alignment(boids)
          this.cohesion(boids)
          this.edge()
          this.velocity.setMag(p.min(this.velocity.mag(), maxVelocity()))
          this.position.add(this.velocity)
        }

        show() {
          p.strokeWeight(3)
          p.stroke(255)
          p.point(this.position.x, this.position.y)
        }
      }

      let flock: Boid[] = []

      p.setup = () => {
        const canvas = p.createCanvas(width(), height())
        canvas.parent(ref)
        canvas.style('visibility', 'visible')

        for (let i = 0; i < 300; i++) {
          flock.push(new Boid())
        }
      }

      p.draw = () => {
        p.background(51)
        for (let boid of flock) {
          boid.update(flock)
          boid.show()
        }
      }

      p.mouseClicked = () => {
        flock = []
        for (let i = 0; i < 100; i++) {
          flock.push(new Boid())
        }
      }
    }
    new p5(sketch, ref)
  }

  return (
    <div class='flex flex-col gap-8'>
      <button class=''></button>
      <div class='[&>canvas]:rounded-2xl' ref={(el) => createSketch(el)} />
    </div>
  )
}

export default FlockingSimulationCanvas
