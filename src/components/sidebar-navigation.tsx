import { A } from '@solidjs/router'
import dayjs from 'dayjs'
import { Menu, Pencil, X } from 'lucide-solid'
import { Component, For, JSX, Show, Suspense, createResource, createSignal, onCleanup, onMount } from 'solid-js'
import { getRequestEvent } from 'solid-js/web'
import { cn } from '~/util/cn'
import { Tag, getCurios, validTags } from '~/util/curio'

interface TagButtonProps {
  onClick?: (e: MouseEvent) => void
  removable?: boolean
  highlight?: boolean
  children: JSX.Element
}

const TagButton: Component<TagButtonProps> = (props) => {
  return (
    <button
      class={cn(
        'flex items-center gap-1 rounded-lg bg-secondary px-3 py-1 text-secondary-fg hover:bg-accent hover:text-accent-fg',
        {
          'bg-background': props.highlight,
          'text-background-fg': props.highlight,
        },
      )}
      onclick={props.onClick}
    >
      <small>{props.children}</small>
      <Show when={props.removable}>
        <X class='-mr-1' size={12} />
      </Show>
    </button>
  )
}

const CurioList: Component = () => {
  const [showFitlers, setShowFilters] = createSignal(false)
  const [filteredTags, setFilteredTags] = createSignal<Tag[]>([])
  const [curios] = createResource(getCurios)

  const toggleTag = (tag: Tag) => {
    if (filteredTags().includes(tag)) {
      unselectTag(tag)
    } else {
      selectTag(tag)
    }
  }

  const selectTag = (tag: Tag) => {
    if (!filteredTags().includes(tag)) {
      setFilteredTags((tags) => [...tags, tag])
    }
  }

  const unselectTag = (tag: Tag) => {
    setFilteredTags((tags) => tags.filter((item) => item !== tag))
  }

  return (
    <div class='flex flex-col gap-4'>
      <div class='flex flex-col gap-4'>
        <div>
          <button
            class='flex cursor-pointer items-center gap-2 rounded-lg bg-background px-4 py-3 text-background-fg hover:bg-accent hover:text-accent-fg'
            onclick={() => setShowFilters((showFilters) => !showFilters)}
          >
            <Pencil size={20} />
            Filters
          </button>
        </div>
        <Show when={showFitlers()}>
          <div class='flex flex-wrap gap-2'>
            <For each={validTags}>
              {(tag) => (
                <TagButton onClick={() => toggleTag(tag)} highlight={filteredTags().includes(tag)}>
                  {tag}
                </TagButton>
              )}
            </For>
          </div>
        </Show>
      </div>
      <Show when={filteredTags().length > 0}>
        <div class='flex flex-wrap gap-2'>
          <For each={filteredTags()}>
            {(tag) => (
              <TagButton removable onClick={() => unselectTag(tag)}>
                {tag}
              </TagButton>
            )}
          </For>
        </div>
      </Show>
      <Suspense>
        <For each={curios()}>
          {(curio) => (
            <Show when={filteredTags().every((tag) => curio.tags.includes(tag))}>
              <A href={`/curio/${curio.id}`}>
                <div class='flex flex-col gap-0 overflow-x-hidden rounded-xl bg-background px-4 py-2 text-background-fg'>
                  <h2>{curio.title}</h2>
                  <small>{dayjs(curio.created).format('DD/MM/YY')}</small>
                  <Show when={curio.tags.length > 0}>
                    <div class='my-1 flex flex-wrap gap-2'>
                      <For each={curio.tags}>
                        {(tag) => (
                          <TagButton
                            onClick={(e) => {
                              e.preventDefault()
                              selectTag(tag)
                            }}
                          >
                            {tag}
                          </TagButton>
                        )}
                      </For>
                    </div>
                  </Show>
                </div>
              </A>
            </Show>
          )}
        </For>
      </Suspense>
    </div>
  )
}

const isMobile = () => {
  const req = getRequestEvent()
  if (req === undefined) {
    return false
  }
  const userAgent = req.request.headers.get('user-agent')
  if (userAgent === null) {
    return false
  }
  const regex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
  const isMobile = regex.test(userAgent)
  console.log('Request is', isMobile ? 'from mobile device' : 'not from mobile device')
  return isMobile
}

interface NavigationProps {
  children: JSX.Element
}

const Navigation: Component<NavigationProps> = (props) => {
  const [sidebarWidth, setSidebarWidth] = createSignal(500)
  const [isSidebar, setIsSidebar] = createSignal(!isMobile())
  const [isOpen, setIsOpen] = createSignal(false)

  const handleMouseResize = (e: MouseEvent) => {
    let newWidth: number
    newWidth = e.clientX
    setSidebarWidth(newWidth)
    window.dispatchEvent(new Event('resize'))
  }
  const handleTouchResize = (e: TouchEvent) => {
    let newWidth: number
    newWidth = e.touches[0].clientX
    setSidebarWidth(newWidth)
    window.dispatchEvent(new Event('resize'))
  }

  const handleResizeStart = () => {
    document.addEventListener('mousemove', handleMouseResize)
    document.addEventListener('touchmove', handleTouchResize)
  }
  const handleResizeEnd = () => {
    document.removeEventListener('mousemove', handleMouseResize)
    document.removeEventListener('touchmove', handleTouchResize)
  }

  const handleClick = () => {
    setIsOpen(!isOpen())
  }

  onMount(() => {
    const handleResize = () => {
      setIsSidebar(window.innerWidth >= 1024)
    }
    handleResize()
    window.dispatchEvent(new Event('resize'))
    window.addEventListener('resize', handleResize)
    onCleanup(() => {
      window.removeEventListener('resize', handleResize)
    })
  })

  return (
    <div>
      <div
        style={{ 'left': isSidebar() ? `${sidebarWidth() + 5}px` : '0px' }}
        class={cn('fixed bottom-0 right-0 top-[64px] overflow-y-auto bg-background text-background-fg', {
          'top-0': isSidebar(),
        })}
      >
        {props.children}
      </div>
      <div
        class={cn(
          'pointer-events-none fixed inset-0 cursor-pointer bg-black opacity-0 transition-opacity duration-200',
          {
            'pointer-events-auto opacity-40': isOpen() && !isSidebar(),
          },
        )}
        onClick={() => setIsOpen(false)}
      />
      <div
        style={{ 'width': isSidebar() ? `${sidebarWidth() - 4}px` : '100vw' }}
        class={cn(
          'fixed -top-[80vh] bottom-0 left-0 overflow-y-auto overflow-x-hidden border-secondary bg-primary px-6 py-4 text-primary-fg transition-[top] duration-100',
          { 'top-[64px]': isSidebar() || isOpen(), 'h-[80vh] border-b-[9px]': !isSidebar() },
        )}
      >
        <CurioList />
      </div>
      <Show when={isSidebar()}>
        <div
          style={{
            'left': `${sidebarWidth() - 4}px`,
          }}
          class='fixed bottom-0 top-0 w-[9px] cursor-col-resize select-none bg-secondary text-secondary-fg'
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          onMouseUp={handleResizeEnd}
          onTouchEnd={handleResizeEnd}
        />
      </Show>
      <div
        style={{ 'width': isSidebar() ? `${sidebarWidth() - 4}px` : '100vw' }}
        class={cn(
          'fixed left-0 top-0 flex h-[64px] items-center justify-between overflow-hidden border-primary bg-primary px-6 text-primary-fg',
          {
            'border-b-2 bg-accent text-accent-fg': !isSidebar(),
          },
        )}
      >
        <A href='/'>
          <h1 class='my-auto whitespace-nowrap text-4xl font-extralight'>Code Curio</h1>
        </A>
        <button
          class={cn({
            'hidden': isSidebar(),
          })}
          onClick={handleClick}
        >
          <Menu stroke-width={1} size={32} absoluteStrokeWidth />
        </button>
      </div>
    </div>
  )
}

export default Navigation
