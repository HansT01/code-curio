import { Component, JSX, Show } from 'solid-js'
import { LoaderIcon } from '~/components/icons'
import { cn } from '~/lib/cn'

interface LoaderProps {
  class?: string
  style?: JSX.CSSProperties
  size?: number
  error?: string
  onClick?: (e: MouseEvent) => void
}

const Loader: Component<LoaderProps> = (props) => {
  return (
    <div
      class={cn('bg-accent text-accent-fg flex items-center justify-center rounded-2xl', props.class, {
        'cursor-pointer': props.onClick !== undefined,
      })}
      style={props.style}
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
        <LoaderIcon class='animate-spin' size={props.size ?? 36} />
      </Show>
    </div>
  )
}

export default Loader
