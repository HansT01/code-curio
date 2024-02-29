import p5 from 'p5'
import { Accessor, createEffect, createSignal, onCleanup, onMount } from 'solid-js'
import { Camera2D } from '~/util/camera'
import { getCoOccurenceMatrix } from '~/util/data'

class LanguageBubble {
  p: p5
  config: Accessor<typeof defaultConfig>
  name: string
  index: number
  weights: number[]
  radius: number
  position: p5.Vector
  velocity: p5.Vector
  isDragging: boolean

  constructor(p: p5, config: Accessor<typeof defaultConfig>, name: string, index: number, weights: number[]) {
    this.p = p
    this.config = config
    this.name = name
    this.index = index
    this.weights = weights
    this.radius = weights[index] ** 0.333
    this.position = p.createVector(p.random(p.width), p.random(p.height))
    this.velocity = p5.Vector.random2D()
    this.velocity.setMag(0)
    this.isDragging = false
  }

  contains(x: number, y: number) {
    const distance = this.p.dist(x, y, this.position.x, this.position.y)
    return distance < this.radius
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
        ) ** this.config().weightExponent,
      )
      totalOffset.add(offset)
    }
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

  center() {
    const offset = this.p.createVector(this.p.width / 2, this.p.height / 2)
    offset.sub(this.position)
    offset.normalize()
    offset.mult(this.config().radialAccelerationFactor)
    this.velocity.add(offset)
  }

  decelerate() {
    this.velocity.mult(0.99)
  }

  drag(x: number, y: number) {
    if (!this.isDragging) {
      return
    }
    if (this.p.mouseIsPressed && this.p.mouseButton === this.p.LEFT) {
      this.velocity.setMag(0)
      this.position.set(x, y)
    } else {
      this.isDragging = false
    }
  }

  update(neighbors: LanguageBubble[]) {
    this.attraction(neighbors)
    this.repulsion(neighbors)
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

  showEdges(neighbors: LanguageBubble[]) {
    for (let neighbor of neighbors) {
      if (neighbor === this) {
        continue
      }
      const weight =
        this.p.max(
          this.weights[neighbor.index] / this.weights[this.index],
          neighbor.weights[this.index] / neighbor.weights[neighbor.index],
        ) ** this.config().weightExponent
      const threshold = 0.2
      const normalizedWeight = (weight - threshold) / (1 - threshold)

      this.p.push()
      this.p.stroke(255, normalizedWeight * 255)
      this.p.strokeWeight(5)
      this.p.line(this.position.x, this.position.y, neighbor.position.x, neighbor.position.y)
      this.p.push()
    }
  }
}

const defaultConfig = {
  weightExponent: 2,
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
      const camera = new Camera2D(p, true)

      p.mousePressed = () => {
        camera.mousePressed()
        const [x, y] = camera.mouseInWorld()
        let closest = null
        let closestDistance = Number.MAX_VALUE
        for (let bubble of bubbles) {
          let distance = p.dist(x, y, bubble.position.x, bubble.position.y)
          if (distance < bubble.radius && distance < closestDistance) {
            closest = bubble
            closestDistance = distance
          }
        }
        if (closest !== null) {
          closest.isDragging = true
        }
      }
      p.mouseDragged = () => camera.mouseDragged()
      p.mouseReleased = () => camera.mouseReleased()
      p.mouseWheel = (e: WheelEvent) => camera.mouseWheel(e)

      p.setup = () => {
        const canvas = p.createCanvas(dimensions().width, dimensions().height)
        canvas.parent(ref)
        canvas.style('visibility', 'visible')
      }

      p.draw = () => {
        p.background(50)
        p.translate(camera.x, camera.y)
        p.scale(camera.zoom)
        let dragging: LanguageBubble[] = []
        for (let bubble of bubbles) {
          if (bubble.isDragging) {
            bubble.drag(...camera.mouseInWorld())
            dragging.push(bubble)
          } else {
            bubble.update(bubbles)
            bubble.show()
          }
        }
        for (let bubble of dragging) {
          bubble.showEdges(bubbles)
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

      onMount(() => {
        const preventContextMenu = (e: MouseEvent) => {
          e.preventDefault()
        }
        ref.addEventListener('contextmenu', preventContextMenu)
        onCleanup(() => {
          ref.removeEventListener('contextmenu', preventContextMenu)
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
      <div class='flex flex-wrap gap-4'>
        <div class='flex flex-col items-start'>
          <label for='repulsion-factor' class='mb-2'>
            Repulsion Factor
          </label>
          <input
            id='repulsion-factor'
            type='range'
            min={0}
            max={defaultConfig.repulsionFactor * 5}
            value={defaultConfig.repulsionFactor}
            step={defaultConfig.repulsionFactor / 20}
            class='h-2 w-40 cursor-pointer appearance-none rounded-lg bg-primary accent-primary-fg'
            onChange={(e) => setConfig({ ...config(), repulsionFactor: parseFloat(e.target.value) })}
          />
        </div>
        <div class='flex flex-col items-start'>
          <label for='weight-exponent' class='mb-2'>
            Weight Exponent
          </label>
          <input
            id='weight-exponent'
            type='range'
            min={0}
            max={defaultConfig.weightExponent * 5}
            value={defaultConfig.weightExponent}
            step={defaultConfig.weightExponent / 20}
            class='h-2 w-40 cursor-pointer appearance-none rounded-lg bg-primary accent-primary-fg'
            onChange={(e) => setConfig({ ...config(), weightExponent: parseFloat(e.target.value) })}
          />
        </div>
      </div>
      <div class='[&>canvas]:rounded-2xl' ref={createSketch} />
    </div>
  )
}

export default ProgrammingLanguageOverlap
