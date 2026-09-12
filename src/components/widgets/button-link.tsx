import { Component, JSX } from 'solid-js'
import { buttonClass } from './button'

interface ButtonLinkProps {
  href: string
  target?: string
  children: JSX.Element
}

const ButtonLink: Component<ButtonLinkProps> = (props) => {
  return (
    <a href={props.href} target={props.target} class={buttonClass}>
      {props.children}
    </a>
  )
}

export default ButtonLink
