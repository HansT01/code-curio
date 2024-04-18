import { Component, Show } from 'solid-js'
import { LoaderIcon } from '~/components/icons'
import { cn } from '~/utils/cn'

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
          <div class='flex flex-col gap-4 text-center'>
            <p>
              Oops! Something went terribly wrong.
              <br />
              Click to retry.
            </p>
            <p>{props.error}</p>
          </div>
        }
      >
        <LoaderIcon class='animate-spin' size={36} />
      </Show>
    </div>
  )
}

export default CanvasLoader
