import { Loader2 } from 'lucide-solid'
import { Component, Show } from 'solid-js'
import { cn } from '~/util/cn'

interface CanvasLoaderProps {
  error?: string
  onClick?: (e: MouseEvent) => void
}

const CanvasLoader: Component<CanvasLoaderProps> = (props) => {
  return (
    <div
      class={cn(
        'flex h-[480px] w-full max-w-[854px] items-center justify-center rounded-2xl bg-accent text-accent-fg',
        { 'cursor-pointer': props.onClick !== undefined },
      )}
      onClick={props.onClick}
    >
      <Show
        when={props.error === undefined}
        fallback={
          <div class='flex flex-col gap-4'>
            <p>Oops! Something went terribly wrong. Click to retry.</p>
            <p>Error: {props.error}</p>
          </div>
        }
      >
        <Loader2 class='animate-spin' size={36} />
      </Show>
    </div>
  )
}

export default CanvasLoader
