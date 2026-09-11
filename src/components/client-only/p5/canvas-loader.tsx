import { Component } from 'solid-js'
import Loader from '~/components/widgets/loader'
import { CURIO_CANVAS_HEIGHT, CURIO_CANVAS_WIDTH } from '~/lib/curio/dimensions'

interface CanvasLoaderProps {
  error?: string
  onClick?: (e: MouseEvent) => void
}

const CanvasLoader: Component<CanvasLoaderProps> = (props) => {
  return (
    <Loader
      class='w-full'
      style={{ 'max-width': `${CURIO_CANVAS_WIDTH}px`, height: `${CURIO_CANVAS_HEIGHT}px` }}
      size={36}
      error={props.error}
      onClick={props.onClick}
    />
  )
}

export default CanvasLoader
