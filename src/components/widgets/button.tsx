import { Component, JSX } from 'solid-js'

export const buttonClass =
  'bg-primary text-primary-fg hover:bg-secondary hover:text-secondary-fg flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-3 disabled:cursor-not-allowed disabled:opacity-50'

interface ButtonProps {
  id?: string
  disabled?: boolean
  onClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>
  children: JSX.Element
}

const Button: Component<ButtonProps> = (props) => {
  return (
    <button id={props.id} disabled={props.disabled} class={buttonClass} onClick={props.onClick}>
      {props.children}
    </button>
  )
}

export default Button
