import p5 from 'p5'
import { createEffect, createSignal, onCleanup, onMount } from 'solid-js'

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
      p.setup = () => {
        const canvas = p.createCanvas(dimensions().width, dimensions().height, p.WEBGL)
        canvas.parent(ref)
        canvas.style('visibility', 'visible')
      }

      p.draw = () => {
        p.background(51)
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
