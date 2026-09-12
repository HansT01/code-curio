import { Component, JSX } from 'solid-js'
import { cn } from '~/lib/cn'

interface ButtonProps {
  id?: string
  class?: string
  disabled?: boolean
  onClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>
  children: JSX.Element
}

const Button: Component<ButtonProps> = (props) => {
  return (
    <button
      id={props.id}
      disabled={props.disabled}
      class={cn(
        'bg-primary text-primary-fg hover:bg-secondary hover:text-secondary-fg flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-3 disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  )
}

export default Button
