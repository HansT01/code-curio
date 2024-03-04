import p5 from 'p5'
import { Component, createEffect, createSignal, onCleanup, onMount } from 'solid-js'

export const logFPS = async (p: p5) => {
  while (p.isLooping()) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log((p.frameCount / p.millis()) * 1000)
  }
}

interface CanvasProps {
  preload?: (p: p5) => void
  setup: (p: p5) => void
  draw: (p: p5) => void
  width: number
  height: number
  webgl?: boolean
}

const Canvas: Component<CanvasProps> = (props) => {
  const [dimensions, setDimensions] = createSignal({ width: props.width, height: props.height })
  const [show, setShow] = createSignal(true)

  const sketch = (p: p5) => {
    p.preload = () => {
      setShow(false)
      if (props.preload !== undefined) {
        props.preload(p)
      }
    }
    p.setup = () => {
      setShow(true)
      const canvas = p.createCanvas(dimensions().width, dimensions().height, props.webgl ? p.WEBGL : undefined)
      canvas.style('visibility', 'visible')
      props.setup(p)
    }
    p.draw = () => {
      props.draw(p)
    }
  }

  const createSketch = (ref: HTMLDivElement) => {
    const p = new p5(sketch, ref)
    createEffect(() => {
      p.resizeCanvas(dimensions().width, dimensions().height)
    })
    onCleanup(() => {
      p.remove()
    })
  }

  const createResize = (ref: HTMLDivElement) => {
    const resize = () => {
      setDimensions({ ...dimensions(), width: Math.min(ref.clientWidth, 854) })
    }
    onMount(() => {
      resize()
      window.addEventListener('resize', resize)
    })
    onCleanup(() => {
      window.removeEventListener('resize', resize)
    })
  }

  const createPreventContextMenu = (ref: HTMLDivElement) => {
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }
    onMount(() => {
      ref.addEventListener('contextmenu', preventContextMenu)
    })
    onCleanup(() => {
      ref.removeEventListener('contextmenu', preventContextMenu)
    })
  }

  return (
    <div
      class='w-full [&>#p5\_loading]:hidden [&>[style*="visibility:_hidden;"]]:hidden [&>canvas]:rounded-2xl'
      ref={(ref) => {
        createSketch(ref)
        createResize(ref)
        createPreventContextMenu(ref)
      }}
    />
  )
}

export default Canvas
