import p5 from 'p5'
import { createEffect, createSignal, onCleanup, onMount } from 'solid-js'

class Particle {
  p: p5
  radius: number
  position: p5.Vector
  velocity: p5.Vector

  constructor(p: p5, radius: number) {
    this.p = p
    this.radius = radius
    this.position = p.createVector(...this.fromSpherical(radius, 0, p.PI / 2))
    this.velocity = p5.Vector.random3D()
    this.velocity.setMag(p.random(3, 6))
  }

  update(particles: Particle[]) {
    this.stabilizeVelocity()
    this.position.add(this.velocity)
    this.position.setMag(this.radius)
  }

  stabilizeVelocity() {
    const mag = this.velocity.mag()
    // @ts-ignore
    this.velocity = p5.Vector.cross(this.position, p5.Vector.cross(this.velocity, this.position))
    this.velocity.setMag(mag)
  }

  fromSpherical(radius: number, phi: number, theta: number) {
    const x = radius * this.p.sin(phi) * this.p.cos(theta)
    const y = radius * this.p.sin(phi) * this.p.sin(theta)
    const z = radius * this.p.cos(phi)
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

const CoriolisEffectCanvas = () => {
  const [dimensions, setDimensions] = createSignal({ width: 854, height: 480 })

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
      const sphereRadius = 200
      const particles: Particle[] = []

      p.setup = () => {
        const canvas = p.createCanvas(dimensions().width, dimensions().height, p.WEBGL)
        canvas.parent(ref)
        canvas.style('visibility', 'visible')

        particles.push(new Particle(p, sphereRadius))
      }

      p.draw = () => {
        p.background(50)
        p.orbitControl()
        p.stroke(241, 250, 218)
        p.fill(154, 208, 194)
        p.sphere(sphereRadius)
        for (let particle of particles) {
          particle.update(particles)
          particle.show()
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
      <div class='[&>canvas]:rounded-2xl' ref={createSketch} />
    </div>
  )
}

export default CoriolisEffectCanvas
