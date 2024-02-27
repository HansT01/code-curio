import { Component, For, JSX, Suspense, createResource, createSignal } from 'solid-js'
import { getCurios } from '~/util/curio'

// interface TagProps {
//   onClick?: () => void
//   removeable?: boolean
//   children: JSX.Element
// }

const CurioList = () => {
  const [curios] = createResource(getCurios)
  return (
    <Suspense>
      <For each={curios()}>{(curio) => <p>{curio.title}</p>}</For>
    </Suspense>
  )
}

interface Props {
  children: JSX.Element
}

const SidebarNavigation: Component<Props> = (props) => {
  const [sidebarWidth, setSidebarWidth] = createSignal(500)
  const [isResizing, setIsResizing] = createSignal(false)

  const handleMouseDown = () => {
    setIsResizing(true)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isResizing()) {
      const newWidth = e.clientX
      setSidebarWidth(newWidth)
    }
  }

  const handleMouseUp = () => {
    setIsResizing(false)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  return (
    <div class='flex'>
      <div
        style={{ width: `${sidebarWidth()}px` }}
        class='fixed left-0 flex h-dvh overflow-y-auto bg-background text-foreground'
      >
        <div class='flex flex-grow flex-col gap-4 px-8 py-6'>
          <h1 class='text-6xl font-bold tracking-tight'>Code Curio</h1>
          <div class='flex flex-col gap-4'>
            <div class='flex items-center gap-4'>
              <h2 class='font-semibold'>Filters</h2>
              {/* <Pencil class='size-4' /> */}
            </div>
            <div class=''>
              <button
                class='flex items-center gap-3 rounded-lg border-2 px-3 py-1 hover:border-primary'
                // onclick={props.onClick}
              >
                <p class=''>p5.js</p>
                {/* <X class='-mr-1' size={16} /> */}
              </button>
            </div>
          </div>
          <CurioList />
        </div>
        <div
          class='h-dvh w-1 cursor-col-resize select-none bg-accent text-accent-foreground'
          onmousedown={handleMouseDown}
        />
      </div>
      <div style={{ 'margin-left': `${sidebarWidth()}px` }} class='flex-grow'>
        {props.children}
      </div>
    </div>
  )
}

export default SidebarNavigation
