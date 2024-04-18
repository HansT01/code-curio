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
          class='h-full divide-secondary rounded-l-lg bg-primary px-2  py-3 text-primary-fg hover:bg-secondary hover:text-secondary-fg'
          onClick={props.decrement}
        >
          <MinusIcon />
        </button>
        <div class='h-full w-16 bg-secondary py-3 text-center text-secondary-fg'>{props.value}</div>
        <button
          class='h-full divide-secondary rounded-r-lg bg-primary px-2  py-3 text-primary-fg hover:bg-secondary hover:text-secondary-fg'
          onClick={props.increment}
        >
          <PlusIcon />
        </button>
      </div>
    </div>
  )
}

export default Stepper
