import p5 from 'p5'
import { createEffect, createSignal, onCleanup, onMount } from 'solid-js'

const FlockingSimulationCanvas = () => {
  const [dimensions, setDimensions] = createSignal({ width: 854, height: 480 })
  const [config, setConfig] = createSignal({
    maxVelocity: 3,
    protectedRange: 8,
    visualRange: 40,
    separationFactor: 0.02,
    alignmentFactor: 0.02,
    cohesionFactor: 0.0002,
    edgeMargin: 100,
    edgeFactor: 0.05,
    mouseFactor: 0.01,
  })

  let parentRef: HTMLDivElement | undefined = undefined

  onMount(() => {
    const resize = () => {
      if (parentRef !== undefined) {
        setDimensions({ ...dimensions(), width: parentRef.clientWidth })
      }
    }
    resize()
    window.addEventListener('resize', resize)
    onCleanup(() => {
      window.removeEventListener('resize', resize)
    })
  })

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
          if (this.position.x < config().edgeMargin) {
            this.velocity.add(config().edgeFactor, 0)
          } else if (this.position.x > p.width - config().edgeMargin) {
            this.velocity.sub(config().edgeFactor, 0)
          }
          if (this.position.y < config().edgeMargin) {
            this.velocity.add(0, config().edgeFactor)
          } else if (this.position.y > p.height - config().edgeMargin) {
            this.velocity.sub(0, config().edgeFactor)
          }
        }

        mouse() {
          const distance = p.dist(this.position.x, this.position.y, p.mouseX, p.mouseY)
          if (distance < config().visualRange) {
            this.velocity.add(
              (this.position.x - p.mouseX) * config().mouseFactor,
              (this.position.y - p.mouseY) * config().mouseFactor,
            )
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
            if (distance < config().protectedRange) {
              xDelta += this.position.x - boid.position.x
              yDelta += this.position.y - boid.position.y
            }
          }
          this.velocity.add(xDelta * config().separationFactor, yDelta * config().separationFactor)
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
            if (distance < config().visualRange) {
              xVelAvg += boid.velocity.x
              yVelAvg += boid.velocity.y
              neighbors += 1
            }
          }
          if (neighbors > 0) {
            xVelAvg /= neighbors
            yVelAvg /= neighbors
          }
          this.velocity.add(xVelAvg * config().alignmentFactor, yVelAvg * config().alignmentFactor)
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
            if (distance < config().visualRange) {
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
            (xPosAvg - this.position.x) * config().cohesionFactor,
            (yPosAvg - this.position.y) * config().cohesionFactor,
          )
        }

        update(boids: Boid[]) {
          this.separation(boids)
          this.alignment(boids)
          this.cohesion(boids)
          this.edge()
          this.mouse()
          this.velocity.setMag(p.min(this.velocity.mag(), config().maxVelocity))
          this.position.add(this.velocity)
        }

        show() {
          p.push()
          p.translate(this.position.x, this.position.y)
          p.rotate(this.velocity.heading())
          p.triangle(-10, -5, -10, 5, 10, 0)
          p.pop()
        }
      }

      let flock: Boid[] = []

      p.setup = () => {
        const canvas = p.createCanvas(dimensions().width, dimensions().height)
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

      createEffect(() => {
        p.resizeCanvas(dimensions().width, dimensions().height)
      })
    }
    new p5(sketch, ref)
  }

  return (
    <div class='flex flex-col gap-8' ref={parentRef}>
      <button class=''></button>
      <div class='[&>canvas]:rounded-2xl' ref={(el) => createSketch(el)} />
    </div>
  )
}

export default FlockingSimulationCanvas
