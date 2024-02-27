import p5 from 'p5'
import { createEffect, createSignal, onCleanup, onMount } from 'solid-js'

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
  const [dimensions, setDimensions] = createSignal({ width: 854, height: 480 })
  const [config, setConfig] = createSignal(defaultConfig)

  let parentRef: HTMLDivElement | undefined = undefined

  onMount(() => {
    const resize = () => {
      if (parentRef !== undefined) {
        setDimensions({ ...dimensions(), width: Math.min(parentRef.clientWidth, 854) })
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
          let xOffset = 0
          let yOffset = 0
          let neighbors = 0
          for (let boid of boids) {
            if (this === boid) {
              continue
            }
            const distance = p.dist(this.position.x, this.position.y, boid.position.x, boid.position.y)
            if (distance < config().visualRange && distance > 0) {
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
          this.velocity.add(xOffset * config().separationFactor, yOffset * config().separationFactor)
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

      onCleanup(() => {
        p.remove()
      })
    }
    new p5(sketch, ref)
  }

  return (
    <div class='flex flex-col gap-8' ref={parentRef}>
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
            class='h-2 w-full cursor-pointer appearance-none rounded-lg bg-background'
            onchange={(e) => setConfig({ ...config(), separationFactor: parseFloat(e.target.value) })}
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
            class='h-2 w-full cursor-pointer appearance-none rounded-lg bg-background'
            onchange={(e) => setConfig({ ...config(), alignmentFactor: parseFloat(e.target.value) })}
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
            class='h-2 w-full cursor-pointer appearance-none rounded-lg bg-background'
            onchange={(e) => setConfig({ ...config(), cohesionFactor: parseFloat(e.target.value) })}
          />
        </div>
      </div>
      <div class='[&>canvas]:rounded-2xl' ref={(el) => createSketch(el)} />
    </div>
  )
}

export default FlockingSimulationCanvas
