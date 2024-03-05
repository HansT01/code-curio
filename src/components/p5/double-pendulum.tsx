import p5 from 'p5'
import { Accessor, createSignal } from 'solid-js'
import Canvas from '../canvas'

class DoublePendulum {
  p: p5
  config: Accessor<typeof defaultConfig>
  theta1: number
  theta2: number
  dtheta1: number
  dtheta2: number
  energy: number

  constructor(p: p5, config: Accessor<typeof defaultConfig>, theta1: number, theta2: number) {
    this.p = p
    this.config = config
    this.theta1 = theta1
    this.theta2 = theta2
    this.dtheta1 = 0
    this.dtheta2 = 0
    this.energy = 0
  }

  positions() {
    const l1 = this.config().length1
    const l2 = this.config().length2
    const x1 = l1 * this.p.sin(this.theta1)
    const y1 = -l1 * this.p.cos(this.theta1)
    const x2 = x1 + l2 * this.p.sin(this.theta2)
    const y2 = y1 - l2 * this.p.cos(this.theta2)
    return [x1, -y1, x2, -y2] as const
  }

  drag(x: number, y: number) {
    const ydir = this.p.createVector(0, 1)
    const mouse = this.p.createVector(x, y)
    const angle = mouse.angleBetween(ydir)
    this.dtheta1 = (angle - this.theta1) / 2
    this.theta1 = angle
  }

  step(theta1: number, theta2: number, dtheta1: number, dtheta2: number) {
    const sqomega1 = this.config().gravity / this.config().length1
    const sqomega2 = this.config().gravity / this.config().length2

    const sindiff = this.p.sin(theta1 - theta2)
    const cosdiff = this.p.cos(theta1 - theta2)
    const a = 1 / (1 + sindiff * sindiff)
    const _theta1 = a * (dtheta1 - dtheta2 * cosdiff)
    const _theta2 = a * (2 * dtheta2 - dtheta1 * cosdiff)
    const b = _theta1 * _theta2 * sindiff
    const _dtheta1 = -b - 2 * sqomega1 * this.p.sin(theta1) - this.config().frictionCoeff * dtheta1
    const _dtheta2 = b - sqomega2 * this.p.sin(theta2) - this.config().frictionCoeff * dtheta2

    const energy =
      (dtheta1 * _theta1 + dtheta2 * _theta2) / 2 - sqomega1 * (2 * this.p.cos(theta1)) - sqomega2 * this.p.cos(theta2)

    return [_theta1, _theta2, _dtheta1, _dtheta2, energy] as const
  }

  rk4(dt: number) {
    let theta1 = this.theta1
    let theta2 = this.theta2
    let dtheta1 = this.dtheta1
    let dtheta2 = this.dtheta2
    const k1 = this.step(theta1, theta2, dtheta1, dtheta2)

    theta1 = this.theta1 + (k1[0] * dt) / 2
    theta2 = this.theta2 + (k1[1] * dt) / 2
    dtheta1 = this.dtheta1 + (k1[2] * dt) / 2
    dtheta2 = this.dtheta2 + (k1[3] * dt) / 2
    const k2 = this.step(theta1, theta2, dtheta1, dtheta2)

    theta1 = this.theta1 + (k2[0] * dt) / 2
    theta2 = this.theta2 + (k2[1] * dt) / 2
    dtheta1 = this.dtheta1 + (k2[2] * dt) / 2
    dtheta2 = this.dtheta2 + (k2[3] * dt) / 2
    const k3 = this.step(theta1, theta2, dtheta1, dtheta2)

    theta1 = this.theta1 + k3[0] * dt
    theta2 = this.theta2 + k3[1] * dt
    dtheta1 = this.dtheta1 + k3[2] * dt
    dtheta2 = this.dtheta2 + k3[3] * dt
    const k4 = this.step(theta1, theta2, dtheta1, dtheta2)

    this.theta1 += ((k1[0] + 2.0 * k2[0] + 2.0 * k3[0] + k4[0]) * dt) / 6.0
    this.theta2 += ((k1[1] + 2.0 * k2[1] + 2.0 * k3[1] + k4[1]) * dt) / 6.0
    this.dtheta1 += ((k1[2] + 2.0 * k2[2] + 2.0 * k3[2] + k4[2]) * dt) / 6.0
    this.dtheta2 += ((k1[3] + 2.0 * k2[3] + 2.0 * k3[3] + k4[3]) * dt) / 6.0
    this.energy = k1[4]

    const pi = this.p.PI
    if (this.theta1 > 2.0 * pi) {
      this.theta1 = this.theta1 - 2.0 * pi
    }
    if (this.theta1 < -2.0 * pi) {
      this.theta1 = this.theta1 + 2.0 * pi
    }
    if (this.theta2 > 2.0 * pi) {
      this.theta2 = this.theta2 - 2.0 * pi
    }
    if (this.theta2 < -2.0 * pi) {
      this.theta2 = this.theta2 + 2.0 * pi
    }
    this.dtheta1 = this.p.min(this.p.max(this.dtheta1, -pi), pi)
    this.dtheta2 = this.p.min(this.p.max(this.dtheta2, -pi), pi)
  }

  update() {
    this.rk4(1)
    console.log(this.theta2, this.dtheta2)
  }

  draw() {
    const [x1, y1, x2, y2] = this.positions()
    const diameter = this.config().radius * 2

    this.p.push()
    this.p.stroke(255)
    this.p.strokeWeight(5)
    this.p.line(0, 0, x1, y1)
    this.p.push()

    this.p.push()
    this.p.stroke(255)
    this.p.strokeWeight(5)
    this.p.line(x1, y1, x2, y2)
    this.p.push()

    this.p.push()
    this.p.stroke(0)
    this.p.strokeWeight(1)
    this.p.fill(255)
    this.p.ellipse(x1, y1, diameter, diameter)
    this.p.pop()

    this.p.push()
    this.p.stroke(0)
    this.p.strokeWeight(1)
    this.p.fill(255)
    this.p.ellipse(x2, y2, diameter, diameter)
    this.p.pop()
  }
}

const defaultConfig = {
  gravity: 1,
  frictionCoeff: 0.001,
  radius: 10,
  length1: 100,
  length2: 100,
}

const DoublePendulumCanvas = () => {
  const [config, setConfig] = createSignal(defaultConfig)
  let isDragging: boolean = false
  let dp: DoublePendulum

  const mouseInWorld = (p: p5) => {
    return [p.mouseX - p.width / 2, p.mouseY - p.height / 2]
  }

  const setup = (p: p5) => {
    dp = new DoublePendulum(p, config, (3 / 4) * p.PI, (3 / 5) * p.PI)

    p.mousePressed = () => {
      const [x, y] = mouseInWorld(p)
      const [x1, y1] = dp.positions()

      console.log(x, y, x1, y1)
      let distance = p.dist(x, y, x1, y1)
      if (distance < p.max(config().radius, 100)) {
        isDragging = true
      }
    }
    p.mouseReleased = () => {
      isDragging = false
    }
  }

  const draw = (p: p5) => {
    p.background(50)
    dp.update()
    if (isDragging) {
      const [x, y] = mouseInWorld(p)
      dp.drag(x, y)
    }
    dp.draw()
  }

  return (
    <div class='flex w-full flex-col gap-4'>
      <div class='flex flex-wrap gap-4'></div>
      <Canvas setup={setup} draw={draw} width={854} height={480} webgl />
    </div>
  )
}

export default DoublePendulumCanvas
