import p5 from 'p5'
import { Show, createEffect, createSignal } from 'solid-js'
import CustomCursor from '../custom-cursor'

const P5Demo = () => {
  let dx: number, yValues: number[], w: number
  let xSpacing = 16
  let theta = 0
  let amplitude = 75
  let period = 500

  const [width, setWidth] = createSignal(600)
  const [height, setHeight] = createSignal(400)

  let parentRef: HTMLDivElement | undefined = undefined

  // onMount(() => {
  //   const resize = () => {
  //     if (parentRef !== undefined) {
  //       setWidth(parentRef.clientWidth)
  //     }
  //   }
  //   resize()
  //   window.addEventListener('resize', resize)
  //   onCleanup(() => {
  //     window.removeEventListener('resize', resize)
  //   })
  // })

  const [cursorVisible, setCursorVisible] = createSignal(false)

  const createSketch = (ref: HTMLDivElement) => {
    const sketch = (p: p5) => {
      p.setup = () => {
        const canvas = p.createCanvas(width(), height())
        canvas.parent(ref)
        canvas.style('visibility', 'visible')
        canvas.mouseOut(() => {
          setCursorVisible(false)
        })
        canvas.mouseOver(() => {
          setCursorVisible(true)
        })
        w = p.width + 16
        dx = (p.TWO_PI / period) * xSpacing
        yValues = new Array(p.floor(w / xSpacing))
      }

      p.draw = () => {
        p.background(0)
        calcWave()
        renderWave()
      }

      createEffect(() => {
        p.resizeCanvas(width(), height())
      })

      function calcWave() {
        theta += 0.02
        let x = theta
        for (let i = 0; i < yValues.length; i++) {
          yValues[i] = p.sin(x) * amplitude
          x += dx
        }
      }

      function renderWave() {
        p.noStroke()
        p.fill(255)
        for (let x = 0; x < yValues.length; x++) {
          p.ellipse(x * xSpacing, p.height / 2 + yValues[x], 16, 16)
        }
      }
    }
    new p5(sketch, ref)
  }

  return (
    <div ref={parentRef}>
      <Show when={cursorVisible()}>
        <CustomCursor />
      </Show>
      <div class='[&>canvas]:cursor-none [&>canvas]:rounded-2xl' ref={(el) => createSketch(el)} />
    </div>
  )
}

export default P5Demo
