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

      class Quadtree {
        boundary: Rectangle
        capacity: number
        boids: Boid[]
        divided: boolean
        northeast: Quadtree | undefined
        northwest: Quadtree | undefined
        southeast: Quadtree | undefined
        southwest: Quadtree | undefined

        constructor(boundary: Rectangle, capacity: number) {
          this.boundary = boundary
          this.capacity = capacity
          this.boids = []
          this.divided = false
        }

        subdivide() {
          const x = this.boundary.x
          const y = this.boundary.y
          const w = this.boundary.w / 2
          const h = this.boundary.h / 2
          const ne = new Rectangle(x + w, y - h, w, h)
          const nw = new Rectangle(x - w, y - h, w, h)
          const se = new Rectangle(x + w, y + h, w, h)
          const sw = new Rectangle(x - w, y + h, w, h)
          this.northeast = new Quadtree(ne, this.capacity)
          this.northwest = new Quadtree(nw, this.capacity)
          this.southeast = new Quadtree(se, this.capacity)
          this.southwest = new Quadtree(sw, this.capacity)
          this.divided = true
        }

        insert(point: Boid) {
          if (!this.boundary.contains(point)) {
            return false
          }
          if (this.boids.length < this.capacity) {
            this.boids.push(point)
            return true
          } else {
            if (!this.divided) {
              this.subdivide()
            }
            if (this.northeast!.insert(point)) return true
            if (this.northwest!.insert(point)) return true
            if (this.southeast!.insert(point)) return true
            if (this.southwest!.insert(point)) return true
          }
        }

        query(range: Rectangle, found?: Boid[]) {
          if (!found) {
            found = []
          }
          if (!this.boundary.intersects(range)) {
            return found
          } else {
            for (let p of this.boids) {
              if (range.contains(p)) {
                found.push(p)
              }
            }
            if (this.divided) {
              this.northwest!.query(range, found)
              this.northeast!.query(range, found)
              this.southwest!.query(range, found)
              this.southeast!.query(range, found)
            }
            return found
          }
        }
      }

      class Rectangle {
        x: number
        y: number
        w: number
        h: number

        constructor(x: number, y: number, w: number, h: number) {
          this.x = x
          this.y = y
          this.w = w
          this.h = h
        }

        contains(boid: Boid) {
          return (
            boid.position.x >= this.x - this.w &&
            boid.position.x <= this.x + this.w &&
            boid.position.y >= this.y - this.h &&
            boid.position.y <= this.y + this.h
          )
        }

        intersects(range: Rectangle) {
          return !(
            range.x - range.w > this.x + this.w ||
            range.x + range.w < this.x - this.w ||
            range.y - range.h > this.y + this.h ||
            range.y + range.h < this.y - this.h
          )
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
        const quadtree = new Quadtree(new Rectangle(0, 0, p.width, p.height), 4)
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
