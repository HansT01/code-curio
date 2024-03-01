import p5 from 'p5'
import { Component, createEffect, createSignal, onCleanup, onMount } from 'solid-js'

interface CanvasProps {
  sketch: (p: p5) => void
  width: number
  height: number
}

const Canvas: Component<CanvasProps> = (props) => {
  const [dimensions, setDimensions] = createSignal({ width: props.width, height: props.height })

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

  const createSketch = (ref: HTMLDivElement) => {
    const p = new p5(props.sketch, ref)
    onMount(() => {
      const children = ref.childNodes
      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement
        if (child.style.visibility === 'hidden') {
          child.style.display = 'none'
        } else {
          child.style.display = 'block'
        }
      }
    })
    createEffect(() => {
      p.resizeCanvas(dimensions().width, dimensions().height)
    })
    onCleanup(() => {
      p.remove()
    })
  }

  return (
    <div
      class='w-full [&>canvas]:rounded-2xl'
      ref={(ref) => {
        createResize(ref)
        createPreventContextMenu(ref)
        createSketch(ref)
      }}
    />
  )
}

export default Canvas
