import { Component, JSX } from 'solid-js'

interface SliderProps {
  id?: string
  label: string
  min: number
  max: number
  value: number
  step?: number
  onChange: JSX.ChangeEventHandlerUnion<HTMLInputElement, Event>
}

const Slider: Component<SliderProps> = (props) => {
  return (
    <div class='flex flex-col items-start'>
      <label for={props.id}>{props.label}</label>
      <div class='relative mb-5'>
        <input
          id={props.id}
          type='range'
          value={props.value}
          min={props.min}
          max={props.max}
          step={props.step !== undefined ? props.step : (props.max - props.min) / 100}
          class='h-2 w-40 cursor-pointer appearance-none rounded-lg bg-primary accent-primary-fg'
          onChange={props.onChange}
        />
        <span class='absolute -bottom-5 start-0 text-sm'>{props.min}</span>
        <span class='absolute -bottom-5 end-0 text-sm'>{props.max}</span>
      </div>
    </div>
  )
}

export default Slider
