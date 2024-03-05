import { Component, JSX } from 'solid-js'

interface ButtonProps {
  id?: string
  label: string
  onClick: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>
}

const Button: Component<ButtonProps> = (props) => {
  return (
    <button
      id={props.id}
      class='cursor-pointer rounded-lg bg-primary px-4 py-3 text-primary-fg hover:bg-secondary hover:text-secondary-fg'
      onClick={props.onClick}
    >
      {props.label}
    </button>
  )
}

export default Button
