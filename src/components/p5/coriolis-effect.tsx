import p5, { Camera } from 'p5'
import { Accessor, createEffect, createSignal, onCleanup, onMount } from 'solid-js'
import { CircularQueue } from '~/util/circular-queue'
import { Box, Octree } from '~/util/octree'

class Particle {
  p: p5
  config: Accessor<typeof defaultConfig>
  radius: number
  position: p5.Vector
  velocity: p5.Vector
  history: CircularQueue<p5.Vector>
  count: number

  constructor(p: p5, config: Accessor<typeof defaultConfig>, radius: number) {
    this.p = p
    this.config = config
    this.radius = radius
    this.position = p.createVector(...this.fromSpherical(radius, p.randomGaussian(0, p.PI / 4), p.random(2 * p.PI)))
    this.velocity = p5.Vector.random3D()
    this.velocity.setMag(0)
    this.history = new CircularQueue(10)
    this.count = 0
  }

  separation(particles: Particle[]) {
    const avgOffset = this.p.createVector(0, 0, 0)
    let neighbors = 0
    for (let particle of particles) {
      if (this === particle) {
        continue
      }
      const distance = this.position.dist(particle.position)
      if (distance < this.config().separationRange && distance > 0) {
        const offset = p5.Vector.sub(this.position, particle.position)
        offset.normalize()
        offset.div(distance)
        avgOffset.add(offset)
        neighbors += 1
      }
    }
    if (neighbors > 0) {
      avgOffset.div(neighbors)
    }
    avgOffset.mult(this.config().separationFactor)
    this.velocity.add(avgOffset)
  }

  centrifuge() {
    const acceleration = p5.Vector.cross(
      this.p.createVector(0, 1, 0),
      p5.Vector.cross(this.p.createVector(0, 1, 0), this.position) as unknown as p5.Vector,
    ) as unknown as p5.Vector
    acceleration.mult(-0.0001 * this.config().centrifugalFactor)
    this.velocity.add(acceleration)
  }

  coriolis() {
    const acceleration = p5.Vector.cross(this.p.createVector(0, 1, 0), this.velocity) as unknown as p5.Vector
    acceleration.mult(-0.0002 * this.config().coriolisFactor)
    this.velocity.add(acceleration)
  }

  trackHistory() {
    if (this.count % 10 === 0) {
      if (this.history.isFull()) {
        this.history.dequeue()
      }
      this.history.enqueue(this.position.copy())
    }
    this.count++
  }

  alignToSurface() {
    const mag = this.velocity.mag()
    this.velocity = p5.Vector.cross(
      this.position,
      p5.Vector.cross(this.velocity, this.position) as unknown as p5.Vector,
    ) as unknown as p5.Vector
    this.velocity.setMag(mag)
  }

  fromSpherical(radius: number, phi: number, theta: number) {
    phi += this.p.PI / 2
    const x = radius * this.p.sin(phi) * this.p.sin(theta)
    const y = radius * this.p.cos(phi)
    const z = radius * this.p.sin(phi) * this.p.cos(theta)
    return [x, y, z] as const
  }

  fromCartesian(x: number, y: number, z: number) {
    const radius = this.p.sqrt(x * x + y * y + z * z)
    const phi = this.p.acos(z / radius)
    const theta = this.p.atan2(y, x)
    return [radius, phi, theta] as const
  }

  update(particles: Particle[]) {
    this.trackHistory()
    this.separation(particles)
    this.centrifuge()
    this.coriolis()
    this.alignToSurface()
    if (this.velocity.mag() > this.config().maxVelocity) {
      this.velocity.setMag(this.config().maxVelocity)
    }
    this.position.add(this.velocity)
    this.position.setMag(this.radius)
  }

  show() {
    if (this.config().trailMode) {
      let prev = this.position
      let index = 0
      for (let position of this.history.reverseIter()) {
        this.p.strokeWeight(4)
        this.p.stroke(255, (255 * (this.history.capacity - index)) / this.history.capacity)
        this.p.line(prev.x, prev.y, prev.z, position.x, position.y, position.z)
        prev = position
        index++
      }
    } else {
      this.p.push()
      this.p.translate(this.position.x, this.position.y, this.position.z)
      this.p.noStroke()
      this.p.fill(255)
      this.p.sphere(5)
      this.p.pop()
    }
  }
}

const defaultConfig = {
  trailMode: true,
  transparentSphere: false,
  maxVelocity: 3,
  separationRange: 40,
  separationFactor: 20,
  centrifugalFactor: 1,
  coriolisFactor: 100,
}

const CoriolisEffectCanvas = () => {
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

  createEffect(() => {
    const canvases = document.querySelectorAll<HTMLCanvasElement>('canvas.p5Canvas')
    canvases.forEach((canvas) => {
      if (canvas.style.visibility === 'hidden') {
        canvas.style.display = 'none'
      } else {
        canvas.style.display = 'block'
      }
    })
  })

  const createSketch = (ref: HTMLDivElement) => {
    const sketch = (p: p5) => {
      const sphereRadius = 200
      const particles: Particle[] = []
      let camera: Camera

      p.setup = () => {
        const canvas = p.createCanvas(dimensions().width, dimensions().height, p.WEBGL)
        canvas.parent(ref)
        canvas.style('visibility', 'visible')
        resetParticles(50)
      }

      p.draw = () => {
        p.background(50)
        p.orbitControl()
        p.strokeWeight(1)
        p.stroke(45, 149, 150)
        if (config().transparentSphere) {
          p.noFill()
        } else {
          p.fill(154, 208, 194)
        }
        p.sphere(sphereRadius)

        const radius = sphereRadius + 50
        const quadtree = new Octree<Particle>(new Box(0, 0, 0, radius, radius, radius), 5)
        for (let particle of particles) {
          quadtree.insert(particle)
        }
        for (let particle of particles) {
          const range = new Box(
            particle.position.x,
            particle.position.y,
            particle.position.z,
            particle.radius,
            particle.radius,
            particle.radius,
          )
          const neighbors = quadtree.query(range)
          particle.update(neighbors)
          particle.show()
        }
      }

      const resetParticles = (numParticles: number) => {
        particles.length = 0
        for (let i = 0; i < numParticles; i++) {
          particles.push(new Particle(p, config, sphereRadius))
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
    <div class='flex flex-col items-start gap-8' ref={parentRef}>
      <div class='flex flex-wrap gap-4'>
        <button
          class='cursor-pointer rounded-lg bg-primary px-4 py-3 text-primary-foreground hover:bg-secondary hover:text-secondary-foreground'
          onClick={() => setConfig({ ...config(), trailMode: !config().trailMode })}
        >
          Toggle Trail
        </button>
        <button
          class='cursor-pointer rounded-lg bg-primary px-4 py-3 text-primary-foreground hover:bg-secondary hover:text-secondary-foreground'
          onClick={() => setConfig({ ...config(), transparentSphere: !config().transparentSphere })}
        >
          Toggle Transparency
        </button>
      </div>
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
            class='h-2 w-full cursor-pointer appearance-none rounded-lg bg-primary'
            onChange={(e) => setConfig({ ...config(), separationFactor: parseFloat(e.target.value) })}
          />
        </div>
        <div class='flex flex-col items-start'>
          <label for='centrifugal-factor' class='mb-2'>
            Centrifugal Factor
          </label>
          <input
            id='centrifugal-factor'
            type='range'
            min={0}
            max={defaultConfig.centrifugalFactor * 5}
            value={defaultConfig.centrifugalFactor}
            step={defaultConfig.centrifugalFactor / 20}
            class='h-2 w-full cursor-pointer appearance-none rounded-lg bg-primary'
            onChange={(e) => setConfig({ ...config(), centrifugalFactor: parseFloat(e.target.value) })}
          />
        </div>
        <div class='flex flex-col items-start'>
          <label for='coriolis-factor' class='mb-2'>
            Coriolis Factor
          </label>
          <input
            id='coriolis-factor'
            type='range'
            min={0}
            max={defaultConfig.coriolisFactor * 5}
            value={defaultConfig.coriolisFactor}
            step={defaultConfig.coriolisFactor / 20}
            class='h-2 w-full cursor-pointer appearance-none rounded-lg bg-primary'
            onChange={(e) => setConfig({ ...config(), coriolisFactor: parseFloat(e.target.value) })}
          />
        </div>
      </div>
      <div class='[&>canvas]:rounded-2xl' ref={createSketch} />
    </div>
  )
}

export default CoriolisEffectCanvas
