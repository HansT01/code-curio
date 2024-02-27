import p5 from 'p5'
import { createSignal } from 'solid-js'

const P5Demo = () => {
  let dx: number, yValues: number[], w: number
  let xSpacing = 16
  let theta = 0
  let amplitude = 75
  let period = 500
  let x = 50
  let y = 50

  const [width, setWidth] = createSignal(200)
  const [height, setHeight] = createSignal(200)

  const createSketch = (ref: HTMLDivElement) => {
    const sketch = (p: p5) => {
      p.setup = () => {
        const canvas = p.createCanvas(710, 400)
        canvas.parent(ref)
        w = p.width + 16
        dx = (p.TWO_PI / period) * xSpacing
        yValues = new Array(p.floor(w / xSpacing))
      }
      p.draw = () => {
        p.background(0)
        calcWave()
        renderWave()
      }

      function calcWave() {
        // Increment theta (try different values for
        // 'angular velocity' here)
        theta += 0.02

        // For every x value, calculate a y value with sine function
        let x = theta
        for (let i = 0; i < yValues.length; i++) {
          yValues[i] = p.sin(x) * amplitude
          x += dx
        }
      }

      function renderWave() {
        p.noStroke()
        p.fill(255)
        // A simple way to draw the wave with an ellipse at each location
        for (let x = 0; x < yValues.length; x++) {
          p.ellipse(x * xSpacing, p.height / 2 + yValues[x], 16, 16)
        }
      }
    }
    new p5(sketch, ref)
  }

  return <div ref={(el) => createSketch(el)} />
}

export default P5Demo
