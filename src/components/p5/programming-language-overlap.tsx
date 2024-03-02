import p5 from 'p5'
import { Accessor, createSignal, onCleanup, onMount } from 'solid-js'
import { Camera2D } from '~/util/camera'
import { getCoOccurenceMatrix } from '~/util/data'
import Canvas from '../canvas'

class Bubble {
  p: p5
  config: Accessor<typeof defaultConfig>
  name: string
  index: number
  weights: number[]
  radius: number
  position: p5.Vector
  velocity: p5.Vector

  constructor(p: p5, config: Accessor<typeof defaultConfig>, name: string, index: number, weights: number[]) {
    this.p = p
    this.config = config
    this.name = name
    this.index = index
    this.weights = weights
    this.radius = weights[index] ** 0.333
    this.position = p.createVector(p.random(-p.width / 2, p.width / 2), p.random(-p.height / 2, p.height / 2))
    this.velocity = p5.Vector.random2D()
    this.velocity.setMag(0)
  }

  contains(x: number, y: number) {
    const distance = this.p.dist(x, y, this.position.x, this.position.y)
    return distance < this.radius
  }

  attraction(bubbles: Bubble[]) {
    const totalOffset = this.p.createVector(0, 0)
    for (let bubble of bubbles) {
      if (bubble === this) {
        continue
      }
      const offset = p5.Vector.sub(bubble.position, this.position)
      offset.setMag(
        this.p.max(
          this.weights[bubble.index] / this.weights[this.index],
          bubble.weights[this.index] / bubble.weights[bubble.index],
        ) ** this.config().weightExponent,
      )
      totalOffset.add(offset)
    }
    totalOffset.mult(this.config().attractionFactor)
    this.velocity.add(totalOffset)
  }

  repulsion(bubbles: Bubble[]) {
    const totalOffset = this.p.createVector(0, 0)
    for (let bubble of bubbles) {
      if (bubble === this) {
        continue
      }
      const offset = p5.Vector.sub(this.position, bubble.position)
      offset.div(offset.magSq())
      offset.mult(this.weights[bubble.index])
      totalOffset.add(offset)
    }
    totalOffset.div(this.weights[this.index])
    totalOffset.mult(this.config().repulsionFactor)
    this.velocity.add(totalOffset)
  }

  center() {
    const offset = this.p.createVector(0, 0)
    offset.sub(this.position)
    offset.mult(this.config().radialAccelerationFactor)
    this.velocity.add(offset)
  }

  decelerate() {
    this.velocity.mult(0.98)
  }

  drag(x: number, y: number) {
    this.velocity.setMag(0)
    this.position.set(x, y)
  }

  update(bubbles: Bubble[]) {
    this.attraction(bubbles)
    this.repulsion(bubbles)
    this.center()
    this.decelerate()
    this.position.add(this.velocity)
  }

  show() {
    this.p.push()
    this.p.stroke(0)
    this.p.strokeWeight(1)
    this.p.fill(255)
    this.p.ellipse(this.position.x, this.position.y, this.radius * 2, this.radius * 2)
    this.p.pop()

    this.p.push()
    this.p.stroke(255)
    this.p.strokeWeight(1)
    this.p.textSize(8)
    this.p.textAlign(this.p.CENTER, this.p.CENTER)
    this.p.fill(0)
    this.p.text(this.name, this.position.x, this.position.y)
    this.p.pop()
  }

  showEdges(bubbles: Bubble[]) {
    for (let bubble of bubbles) {
      if (bubble === this) {
        continue
      }
      const weight =
        this.p.max(
          this.weights[bubble.index] / this.weights[this.index],
          bubble.weights[this.index] / bubble.weights[bubble.index],
        ) ** this.config().weightExponent
      const threshold = 0.2
      const normalizedWeight = (weight - threshold) / (1 - threshold)

      this.p.push()
      this.p.stroke(255, normalizedWeight * 255)
      this.p.strokeWeight(5)
      this.p.line(this.position.x, this.position.y, bubble.position.x, bubble.position.y)
      this.p.push()
    }
  }
}

class BubbleManager {
  p: p5
  camera: Camera2D
  bubbles: Bubble[]
  hovering: Bubble | null
  isDragging: boolean

  constructor(p: p5, bubbles: Bubble[]) {
    this.p = p
    this.camera = new Camera2D(p, true)
    this.bubbles = bubbles
    this.hovering = null
    this.isDragging = false
  }

  hover() {
    if (this.isDragging) {
      return
    }
    const [x, y] = this.camera.cursorInWorld()
    let closest = null
    let closestDistance = Number.MAX_VALUE
    for (let bubble of this.bubbles) {
      let distance = this.p.dist(x, y, bubble.position.x, bubble.position.y)
      if (distance < bubble.radius && distance < closestDistance) {
        closest = bubble
        closestDistance = distance
      }
    }
    this.hovering = closest
  }

  dragStart() {
    const touches = this.p.touches as Touch[]
    this.hover()
    if (this.p.mouseButton === this.p.LEFT || touches.length === 1) {
      this.isDragging = true
    }
  }

  dragEnd() {
    const touches = this.p.touches as Touch[]
    if (touches.length > 0) {
      return
    }
    this.isDragging = false
    this.hover()
  }

  splitSelected() {
    const bubbles = this.bubbles.filter((bubble) => bubble !== this.hovering)
    return [this.hovering, bubbles] as const
  }

  draw() {
    const [x, y] = this.camera.cursorInWorld()
    const [selected, bubbles] = this.splitSelected()
    for (let bubble of bubbles) {
      bubble.update(this.bubbles)
      bubble.show()
    }
    if (selected === null) {
      return
    }
    if (this.isDragging) {
      selected.drag(x, y)
    } else {
      selected.update(bubbles)
    }
    selected.showEdges(bubbles)
    selected.show()
  }
}

const defaultConfig = {
  weightExponent: 2,
  attractionFactor: 0.1,
  repulsionFactor: 20,
  radialAccelerationFactor: 0.0001,
}

const ProgrammingLanguageOverlap = () => {
  const [config, setConfig] = createSignal(defaultConfig)

  let manager: BubbleManager
  let shuffle: () => void

  const setup = (p: p5) => {
    manager = new BubbleManager(p, [])
    manager.camera.x = p.width / 2
    manager.camera.y = p.height / 2

    p.mousePressed = () => {
      manager.camera.mousePressed()
      manager.dragStart()
    }
    p.mouseReleased = () => {
      manager.camera.mouseReleased()
      manager.dragEnd()
    }
    p.mouseMoved = () => manager.hover()
    p.mouseDragged = () => manager.camera.mouseDragged()
    p.mouseWheel = (e: WheelEvent) => manager.camera.mouseWheel(e)

    p.touchStarted = () => {
      manager.camera.touchStarted()
      manager.dragStart()
    }
    p.touchEnded = () => {
      manager.camera.touchEnded()
      manager.dragEnd()
    }
    p.touchMoved = (e: TouchEvent) => manager.camera.touchMoved(e)

    onMount(() => {
      getCoOccurenceMatrix().then((matrix) => {
        for (let i = 0; i < matrix.data.length; i++) {
          manager.bubbles.push(new Bubble(p, config, matrix.columns[i], i, matrix.data[i]))
        }
      })
    })

    onMount(() => {
      const resize = () => {
        if (manager !== undefined) {
          manager.camera.canvasResized()
        }
      }
      window.addEventListener('resize', resize)
      onCleanup(() => {
        window.removeEventListener('resize', resize)
      })
    })

    shuffle = () => {
      for (let bubble of manager.bubbles) {
        const angle = p.random(-p.PI / 2, p.PI / 2)
        const offset = p.createVector(p.width / 2, p.height / 2)
        offset.sub(bubble.position)
        offset.rotate(angle)
        offset.setMag(10)
        bubble.velocity.add(offset)
      }
    }
  }

  const draw = (p: p5) => {
    p.background(50)
    p.translate(manager.camera.x, manager.camera.y)
    p.scale(manager.camera.zoom)
    manager.draw()
  }

  return (
    <div class='flex flex-col items-start gap-4'>
      <div class='flex flex-wrap'>
        <button
          class='rounded-lg bg-primary px-4 py-3 text-primary-fg hover:bg-secondary hover:text-secondary-fg'
          onClick={() => shuffle()}
        >
          Shuffle
        </button>
      </div>
      <small>
        Use the cursor to reveal the relationship between the language bubbles. Use left click to drag them around, and
        use right click and scroll wheel for camera controls.
      </small>
      <Canvas setup={setup} draw={draw} width={854} height={480} />
    </div>
  )
}

export default ProgrammingLanguageOverlap
