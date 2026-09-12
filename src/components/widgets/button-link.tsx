import { Component, JSX } from 'solid-js'
import { cn } from '~/lib/cn'

interface ButtonLinkProps {
  href: string
  target?: string
  class?: string
  children: JSX.Element
}

const ButtonLink: Component<ButtonLinkProps> = (props) => {
  return (
    <a
      href={props.href}
      target={props.target}
      class={cn(
        'bg-primary text-primary-fg hover:bg-secondary hover:text-secondary-fg flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-3',
        props.class,
      )}
    >
      {props.children}
    </a>
  )
}

export default ButtonLink
