import p5 from 'p5'
import { Accessor, createSignal } from 'solid-js'
import { CircularQueue } from '~/utils/circular-queue'
import { Box, Octree } from '~/utils/octree'
import Canvas from './p5/canvas'
import Button from './widgets/button'
import Slider from './widgets/slider'
import Stepper from './widgets/stepper'

class Particle {
  p: p5
  config: Accessor<typeof defaultConfig>
  position: p5.Vector
  velocity: p5.Vector
  history: CircularQueue<p5.Vector>
  count: number

  constructor(p: p5, config: Accessor<typeof defaultConfig>) {
    this.p = p
    this.config = config
    this.position = p.createVector(
      ...this.fromSpherical(config().radius, p.randomGaussian(0, p.PI / 4), p.random(2 * p.PI)),
    )
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
    this.position.setMag(this.config().radius)
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
  radius: 200,
  maxVelocity: 3,
  separationRange: 40,
  separationFactor: 20,
  centrifugalFactor: 1,
  coriolisFactor: 100,
}

const CoriolisEffectCanvas = () => {
  const [config, setConfig] = createSignal(defaultConfig)
  const [countIndex, setCountIndex] = createSignal(3)
  const count = [1, 5, 20, 50, 100, 200]
  const particles: Particle[] = []

  let resetParticles: (numParticles: number) => void

  const reduceParticles = () => {
    setCountIndex((index) => (index > 0 ? index - 1 : index))
    resetParticles(count[countIndex()])
  }

  const increaseParticles = () => {
    setCountIndex((index) => (index < count.length - 1 ? index + 1 : index))
    resetParticles(count[countIndex()])
  }

  const setup = (p: p5) => {
    resetParticles = (numParticles: number) => {
      particles.length = 0
      for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle(p, config))
      }
    }
    resetParticles(50)
  }

  const draw = (p: p5) => {
    p.background(50)
    if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
      p.orbitControl()
    }
    p.strokeWeight(1)
    p.stroke(45, 149, 150)
    if (config().transparentSphere) {
      p.noFill()
    } else {
      p.fill(154, 208, 194)
    }
    p.sphere(config().radius)

    const radius = config().radius + 50
    const quadtree = new Octree<Particle>(new Box(0, 0, 0, radius, radius, radius), 5)
    for (let particle of particles) {
      quadtree.insert(particle)
    }
    for (let particle of particles) {
      const range = new Box(
        particle.position.x,
        particle.position.y,
        particle.position.z,
        config().radius / 2,
        config().radius / 2,
        config().radius / 2,
      )
      const neighbors = quadtree.query(range)
      particle.update(neighbors)
      particle.show()
    }
  }

  return (
    <div class='flex flex-col items-start gap-4'>
      <div class='flex flex-wrap gap-4'>
        <Stepper
          id='particle-count'
          label='Particle Count'
          value={count[countIndex()]}
          increment={increaseParticles}
          decrement={reduceParticles}
        />
      </div>
      <div class='flex flex-wrap gap-4'>
        <Button
          id='toggle-trail'
          label='Toggle Trail'
          onClick={() => setConfig({ ...config(), trailMode: !config().trailMode })}
        />
        <Button
          id='toggle-transparency'
          label='Toggle Transparency'
          onClick={() => setConfig({ ...config(), transparentSphere: !config().transparentSphere })}
        />
      </div>
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
          id='centrifugal-factor'
          label='Centrifugal Factor'
          min={0}
          max={defaultConfig.centrifugalFactor * 5}
          value={defaultConfig.centrifugalFactor}
          onChange={(e) => setConfig({ ...config(), centrifugalFactor: parseFloat(e.target.value) })}
        />
        <Slider
          id='coriolis-factor'
          label='Coriolis Factor'
          min={0}
          max={defaultConfig.coriolisFactor * 5}
          value={defaultConfig.coriolisFactor}
          onChange={(e) => setConfig({ ...config(), coriolisFactor: parseFloat(e.target.value) })}
        />
      </div>
      <small>Use the mouse for camera controls.</small>
      <Canvas setup={setup} draw={draw} width={854} height={480} webgl />
    </div>
  )
}

export default CoriolisEffectCanvas
