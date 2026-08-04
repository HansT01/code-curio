import { A } from '@solidjs/router'
import dayjs from 'dayjs'
import { Component, For, JSX, Show, Suspense, createResource, createSignal, onCleanup, onMount } from 'solid-js'
import { getRequestEvent } from 'solid-js/web'
import { cn } from '~/utils/cn'
import { Tag, getCurios, validTags } from '~/utils/curio'
import { MenuIcon, PencilIcon, XIcon } from '../icons'

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
        'bg-secondary text-secondary-fg hover:bg-background hover:text-background-fg flex cursor-pointer items-center gap-1 rounded-lg px-3 py-1',
        {
          'bg-background': props.highlight,
          'text-background-fg': props.highlight,
        },
      )}
      onClick={props.onClick}
    >
      <small>{props.children}</small>
      <Show when={props.removable}>
        <XIcon class='-mr-1' size={12} />
      </Show>
    </button>
  )
}

interface CurioListProps {
  onCurioClick: (e: MouseEvent) => void
}

const CurioList: Component<CurioListProps> = (props) => {
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
            class='bg-background text-background-fg hover:bg-accent hover:text-accent-fg flex cursor-pointer items-center gap-2 rounded-lg px-4 py-3'
            onClick={() => setShowFilters((showFilters) => !showFilters)}
          >
            <PencilIcon size={20} />
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
              <A href={`/curio/${curio.id}`} onClick={props.onCurioClick}>
                <div class='bg-background text-background-fg hover:bg-accent hover:text-accent-fg flex flex-col gap-0 overflow-x-hidden rounded-xl px-4 py-2'>
                  <h2>{curio.title}</h2>
                  <small>
                    Created {dayjs(curio.created).format('MMM YYYY')}
                    {!dayjs(curio.updated).isSame(curio.created, 'date') &&
                      ` · Updated ${dayjs(curio.updated).format('MMM YYYY')}`}
                  </small>
                  <Show when={curio.tags.length > 0}>
                    <div class='my-2 flex flex-wrap gap-2'>
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
        class={cn('bg-background text-background-fg fixed top-[64px] right-0 bottom-0 overflow-y-auto', {
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
          'border-secondary bg-primary text-primary-fg fixed -top-[80svh] bottom-0 left-0 overflow-x-hidden overflow-y-auto px-6 py-4 transition-[top] duration-200',
          { 'top-[64px]': isSidebar() || isOpen(), 'h-[calc(80svh-64px)] border-b-[9px]': !isSidebar() },
        )}
      >
        <CurioList onCurioClick={() => setIsOpen(false)} />
      </div>
      <Show when={isSidebar()}>
        <div
          style={{
            'left': `${sidebarWidth() - 4}px`,
          }}
          class='bg-secondary text-secondary-fg fixed top-0 bottom-0 w-[9px] cursor-col-resize select-none'
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          onMouseUp={handleResizeEnd}
          onTouchEnd={handleResizeEnd}
        />
      </Show>
      <div
        style={{ 'width': isSidebar() ? `${sidebarWidth() - 4}px` : '100vw' }}
        class={cn(
          'border-primary bg-primary text-primary-fg fixed top-0 left-0 flex h-[64px] items-center justify-between overflow-hidden px-6',
          {
            'bg-accent text-accent-fg border-b-2': !isSidebar(),
          },
        )}
      >
        <A href='/'>
          <h1 class='my-auto text-4xl font-extralight whitespace-nowrap'>Code Curio</h1>
        </A>
        <button
          class={cn({
            'hidden': isSidebar(),
          })}
          onClick={handleClick}
        >
          <MenuIcon stroke-width={1} size={32} />
        </button>
      </div>
    </div>
  )
}

export default Navigation
