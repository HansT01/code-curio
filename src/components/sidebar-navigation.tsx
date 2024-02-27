import { Component, JSX, createSignal } from 'solid-js'

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
        <div class='flex-grow'></div>
        <div
          class='bg-accent text-accent-foreground h-dvh w-1 cursor-col-resize select-none'
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
