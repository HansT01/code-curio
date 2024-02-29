import p5 from 'p5'
import { Accessor, createEffect, createSignal, onCleanup, onMount } from 'solid-js'
import { getCoOccurenceMatrix } from '~/util/data'

class LanguageBubble {
  p: p5
  config: Accessor<typeof defaultConfig>
  name: string
  index: number
  weights: number[]
  position: p5.Vector
  velocity: p5.Vector

  constructor(p: p5, config: Accessor<typeof defaultConfig>, name: string, index: number, weights: number[]) {
    this.p = p
    this.config = config
    this.name = name
    this.index = index
    this.weights = weights
    this.position = p.createVector(p.random(p.width), p.random(p.height))
    this.velocity = p5.Vector.random2D()
    this.velocity.setMag(0)
  }

  attraction(neighbors: LanguageBubble[]) {
    const totalOffset = this.p.createVector(0, 0)
    for (let neighbor of neighbors) {
      if (neighbor === this) {
        continue
      }
      const offset = p5.Vector.sub(neighbor.position, this.position)
      offset.setMag(
        this.p.max(
          this.weights[neighbor.index] / this.weights[this.index],
          neighbor.weights[this.index] / neighbor.weights[neighbor.index],
        ) ** 2,
      )
      totalOffset.add(offset)
    }
    // totalOffset.div(this.weights[this.index])
    totalOffset.mult(this.config().attractionFactor)
    this.velocity.add(totalOffset)
  }

  repulsion(neighbors: LanguageBubble[]) {
    const totalOffset = this.p.createVector(0, 0)
    for (let neighbor of neighbors) {
      if (neighbor === this) {
        continue
      }
      const offset = p5.Vector.sub(this.position, neighbor.position)
      offset.div(offset.magSq())
      offset.mult(this.weights[neighbor.index])
      totalOffset.add(offset)
    }
    totalOffset.div(this.weights[this.index])
    totalOffset.mult(this.config().repulsionFactor)
    this.velocity.add(totalOffset)
  }

  decelerate() {
    this.velocity.mult(0.99)
  }

  center() {
    const offset = this.p.createVector(this.p.width / 2, this.p.height / 2)
    offset.sub(this.position)
    offset.normalize()
    offset.mult(this.config().radialAccelerationFactor)
    this.velocity.add(offset)
  }

  update(neighbors: LanguageBubble[]) {
    this.attraction(neighbors)
    this.repulsion(neighbors)
    this.center()
    this.decelerate()
    this.position.add(this.velocity)
  }

  show() {
    const diameter = this.weights[this.index] ** 0.333 * 2
    this.p.fill(255)
    this.p.ellipse(this.position.x, this.position.y, diameter, diameter)
    this.p.textSize(8)
    this.p.fill(0)
    this.p.text(this.name, this.position.x, this.position.y)
  }
}

const defaultConfig = {
  attractionFactor: 0.01,
  repulsionFactor: 1,
  radialAccelerationFactor: 0.01,
}

const ProgrammingLanguageOverlap = () => {
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
      const bubbles: LanguageBubble[] = []

      p.setup = () => {
        const canvas = p.createCanvas(dimensions().width, dimensions().height)
        canvas.parent(ref)
        canvas.style('visibility', 'visible')
      }

      p.draw = () => {
        p.background(50)
        for (let bubble of bubbles) {
          bubble.update(bubbles)
          bubble.show()
        }
      }

      onMount(() => {
        getCoOccurenceMatrix().then((matrix) => {
          for (let i = 0; i < matrix.data.length; i++) {
            bubbles.push(new LanguageBubble(p, config, matrix.columns[i], i, matrix.data[i]))
          }
        })
      })

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
      <div class='[&>canvas]:rounded-2xl' ref={createSketch} />
    </div>
  )
}

export default ProgrammingLanguageOverlap
