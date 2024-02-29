import p5 from 'p5'
import { Accessor, createEffect, createSignal, onCleanup, onMount } from 'solid-js'

class Particle {
  p: p5
  config: Accessor<typeof defaultConfig>
  radius: number
  position: p5.Vector
  velocity: p5.Vector

  constructor(p: p5, config: Accessor<typeof defaultConfig>, radius: number) {
    this.p = p
    this.config = config
    this.radius = radius
    this.position = p.createVector(...this.fromSpherical(radius, p.randomGaussian(0, p.PI / 4), p.random(2 * p.PI)))
    this.velocity = p5.Vector.random3D()
    this.velocity.setMag(0)
  }

  separation(particles: Particle[]) {
    const avgOffset = this.p.createVector(0, 0, 0)
    let neighbors = 0
    for (let particle of particles) {
      if (this === particle) {
        continue
      }
      const distance = this.position.dist(particle.position)
      if (distance < 20 && distance > 0) {
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

  update(particles: Particle[]) {
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

  show() {
    this.p.push()
    this.p.translate(this.position.x, this.position.y, this.position.z)
    this.p.noStroke()
    this.p.fill(255)
    this.p.sphere(5)
    this.p.pop()
  }
}

class Octree {
  boundary: Box
  capacity: number
  particles: Particle[]
  divided: boolean
  northeast?: Octree
  northwest?: Octree
  southeast?: Octree
  southwest?: Octree
  northeast_z?: Octree
  northwest_z?: Octree
  southeast_z?: Octree
  southwest_z?: Octree

  constructor(boundary: Box, capacity: number) {
    this.boundary = boundary
    this.capacity = capacity
    this.particles = []
    this.divided = false
  }

  subdivide() {
    const x = this.boundary.x
    const y = this.boundary.y
    const z = this.boundary.z
    const w = this.boundary.w / 2
    const h = this.boundary.h / 2
    const d = this.boundary.d / 2
    const ne = new Box(x + w, y - h, z - d, w, h, d)
    const nw = new Box(x - w, y - h, z - d, w, h, d)
    const se = new Box(x + w, y + h, z - d, w, h, d)
    const sw = new Box(x - w, y + h, z - d, w, h, d)
    const ne_z = new Box(x + w, y - h, z + d, w, h, d)
    const nw_z = new Box(x - w, y - h, z + d, w, h, d)
    const se_z = new Box(x + w, y + h, z + d, w, h, d)
    const sw_z = new Box(x - w, y + h, z + d, w, h, d)
    this.northeast = new Octree(ne, this.capacity)
    this.northwest = new Octree(nw, this.capacity)
    this.southeast = new Octree(se, this.capacity)
    this.southwest = new Octree(sw, this.capacity)
    this.northeast_z = new Octree(ne_z, this.capacity)
    this.northwest_z = new Octree(nw_z, this.capacity)
    this.southeast_z = new Octree(se_z, this.capacity)
    this.southwest_z = new Octree(sw_z, this.capacity)
    this.divided = true
  }

  insert(particle: Particle) {
    if (!this.boundary.contains(particle)) {
      return false
    }
    if (this.particles.length < this.capacity) {
      this.particles.push(particle)
      return true
    } else {
      if (!this.divided) {
        this.subdivide()
      }
      if (this.northeast!.insert(particle)) return true
      if (this.northwest!.insert(particle)) return true
      if (this.southeast!.insert(particle)) return true
      if (this.southwest!.insert(particle)) return true
      if (this.northeast_z!.insert(particle)) return true
      if (this.northwest_z!.insert(particle)) return true
      if (this.southeast_z!.insert(particle)) return true
      if (this.southwest_z!.insert(particle)) return true
    }
  }

  query(range: Box, found?: Particle[]) {
    if (!found) {
      found = []
    }
    if (!this.boundary.intersects(range)) {
      return found
    } else {
      for (let particle of this.particles) {
        if (range.contains(particle)) {
          found.push(particle)
        }
      }
      if (this.divided) {
        this.northwest!.query(range, found)
        this.northeast!.query(range, found)
        this.southwest!.query(range, found)
        this.southeast!.query(range, found)
        this.northwest_z!.query(range, found)
        this.northeast_z!.query(range, found)
        this.southwest_z!.query(range, found)
        this.southeast_z!.query(range, found)
      }
      return found
    }
  }
}

class Box {
  x: number
  y: number
  z: number
  w: number
  h: number
  d: number

  constructor(x: number, y: number, z: number, w: number, h: number, d: number) {
    this.x = x
    this.y = y
    this.z = z
    this.w = w
    this.h = h
    this.d = d
  }

  contains(boid: Particle) {
    return (
      boid.position.x >= this.x - this.w &&
      boid.position.x <= this.x + this.w &&
      boid.position.y >= this.y - this.h &&
      boid.position.y <= this.y + this.h &&
      boid.position.z >= this.z - this.d &&
      boid.position.z <= this.z + this.d
    )
  }

  intersects(range: Box) {
    return !(
      range.x - range.w > this.x + this.w ||
      range.x + range.w < this.x - this.w ||
      range.y - range.h > this.y + this.h ||
      range.y + range.h < this.y - this.h ||
      range.z - range.d > this.z + this.d ||
      range.z + range.d < this.z - this.d
    )
  }
}

const defaultConfig = {
  maxVelocity: 3,
  separationFactor: 20,
  centrifugalFactor: 1,
  coriolisFactor: 200,
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

      p.setup = () => {
        const canvas = p.createCanvas(dimensions().width, dimensions().height, p.WEBGL)
        canvas.parent(ref)
        canvas.style('visibility', 'visible')

        for (let i = 0; i < 500; i++) {
          particles.push(new Particle(p, config, sphereRadius))
        }
      }

      p.draw = () => {
        p.background(50)
        p.orbitControl()
        p.stroke(241, 250, 218)
        p.fill(154, 208, 194)
        p.sphere(sphereRadius)
        const radius = sphereRadius + 50
        const quadtree = new Octree(new Box(0, 0, 0, radius, radius, radius), 8)
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
        p.background(50)
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
            class='h-2 w-full cursor-pointer appearance-none rounded-lg bg-background'
            onchange={(e) => setConfig({ ...config(), centrifugalFactor: parseFloat(e.target.value) })}
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
            class='h-2 w-full cursor-pointer appearance-none rounded-lg bg-background'
            onchange={(e) => setConfig({ ...config(), coriolisFactor: parseFloat(e.target.value) })}
          />
        </div>
      </div>
      <div class='[&>canvas]:rounded-2xl' ref={createSketch} />
    </div>
  )
}

export default CoriolisEffectCanvas
