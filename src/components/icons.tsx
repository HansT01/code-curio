import { Component } from 'solid-js'

interface IconProps {
  class?: string
  size?: number
  strokeWidth?: number
  fill?: string
}

export const MenuIcon: Component<IconProps> = (props) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={props.size ? props.size : 24}
      height={props.size ? props.size : 24}
      viewBox='0 0 24 24'
      fill={props.fill ? props.fill : 'none'}
      stroke='currentColor'
      stroke-width={props.strokeWidth ? props.strokeWidth : 2}
      stroke-linecap='round'
      stroke-linejoin='round'
      class={props.class}
    >
      <line x1='4' x2='20' y1='12' y2='12' />
      <line x1='4' x2='20' y1='6' y2='6' />
      <line x1='4' x2='20' y1='18' y2='18' />
    </svg>
  )
}

export const LoaderIcon: Component<IconProps> = (props) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={props.size ? props.size : 24}
      height={props.size ? props.size : 24}
      viewBox='0 0 24 24'
      fill={props.fill ? props.fill : 'none'}
      stroke='currentColor'
      stroke-width={props.strokeWidth ? props.strokeWidth : 2}
      stroke-linecap='round'
      stroke-linejoin='round'
      class={props.class}
    >
      <path d='M21 12a9 9 0 1 1-6.219-8.56' />
    </svg>
  )
}

export const GithubIcon: Component<IconProps> = (props) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={props.size ? props.size : 24}
      height={props.size ? props.size : 24}
      viewBox='0 0 24 24'
      fill={props.fill ? props.fill : 'none'}
      stroke='currentColor'
      stroke-width={props.strokeWidth ? props.strokeWidth : 2}
      stroke-linecap='round'
      stroke-linejoin='round'
      class={props.class}
    >
    <path d='M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4' />
    <path d='M9 18c-4.51 2-5-2-7-2' />
    </svg>
  )
}

export const XIcon: Component<IconProps> = (props) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={props.size ? props.size : 24}
      height={props.size ? props.size : 24}
      viewBox='0 0 24 24'
      fill={props.fill ? props.fill : 'none'}
      stroke='currentColor'
      stroke-width={props.strokeWidth ? props.strokeWidth : 2}
      stroke-linecap='round'
      stroke-linejoin='round'
      class={props.class}
    ><path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  )
}

export const PencilIcon: Component<IconProps> = (props) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={props.size ? props.size : 24}
      height={props.size ? props.size : 24}
      viewBox='0 0 24 24'
      fill={props.fill ? props.fill : 'none'}
      stroke='currentColor'
      stroke-width={props.strokeWidth ? props.strokeWidth : 2}
      stroke-linecap='round'
      stroke-linejoin='round'
      class={props.class}
    ><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
    </svg>
  )
}

export const PlusIcon: Component<IconProps> = (props) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={props.size ? props.size : 24}
      height={props.size ? props.size : 24}
      viewBox='0 0 24 24'
      fill={props.fill ? props.fill : 'none'}
      stroke='currentColor'
      stroke-width={props.strokeWidth ? props.strokeWidth : 2}
      stroke-linecap='round'
      stroke-linejoin='round'
      class={props.class}
    ><path d="M5 12h14"/><path d="M12 5v14"/>
    </svg>
  )
}

export const MinusIcon: Component<IconProps> = (props) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={props.size ? props.size : 24}
      height={props.size ? props.size : 24}
      viewBox='0 0 24 24'
      fill={props.fill ? props.fill : 'none'}
      stroke='currentColor'
      stroke-width={props.strokeWidth ? props.strokeWidth : 2}
      stroke-linecap='round'
      stroke-linejoin='round'
      class={props.class}
    ><path d="M5 12h14"/>
    </svg>
  )
}

