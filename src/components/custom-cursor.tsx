import { createSignal, onCleanup, onMount } from 'solid-js'

const CustomCursor = () => {
  const [position, setPosition] = createSignal({ x: 0, y: 0 })

  const handleMouseMove = (e: MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY })
  }

  onMount(() => {
    window.addEventListener('mousemove', handleMouseMove)
  })

  onCleanup(() => {
    window.removeEventListener('mousemove', handleMouseMove)
  })

  return (
    <svg
      width='24px'
      height='24px'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      class='pointer-events-none fixed z-50'
      style={{
        left: `${position().x}px`,
        top: `${position().y}px`,
      }}
    >
      <path
        d='M3 3L10 22L12.0513 15.8461C12.6485 14.0544 14.0544 12.6485 15.846 12.0513L22 10L3 3Z'
        stroke='#000'
        stroke-width={2}
        stroke-linejoin='round'
        fill='#fff'
      />
    </svg>
  )
}

export default CustomCursor
