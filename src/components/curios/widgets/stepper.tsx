import { Component } from 'solid-js'
import { JSX } from 'solid-js/web/types/jsx'
import { MinusIcon, PlusIcon } from '~/components/icons'

interface StepperProps {
  id?: string
  label: string
  value: any
  increment: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>
  decrement: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>
}

const Stepper: Component<StepperProps> = (props) => {
  return (
    <div class='flex flex-col items-start'>
      <label for={props.id} class='mb-2'>
        {props.label}
      </label>
      <div id={props.id} class='flex'>
        <button
          class='divide-secondary bg-primary text-primary-fg hover:bg-secondary hover:text-secondary-fg h-full rounded-l-lg px-2 py-3'
          onClick={props.decrement}
        >
          <MinusIcon />
        </button>
        <div class='bg-secondary text-secondary-fg h-full w-16 py-3 text-center'>{props.value}</div>
        <button
          class='divide-secondary bg-primary text-primary-fg hover:bg-secondary hover:text-secondary-fg h-full rounded-r-lg px-2 py-3'
          onClick={props.increment}
        >
          <PlusIcon />
        </button>
      </div>
    </div>
  )
}

export default Stepper
