import { A } from '@solidjs/router'
import dayjs from 'dayjs'
import { Pencil, X } from 'lucide-solid'
import { Component, For, JSX, Show, Suspense, createEffect, createResource, createSignal } from 'solid-js'
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
        'flex items-center gap-1 rounded-lg bg-accent px-3 py-1 text-accent-foreground hover:bg-secondary hover:text-secondary-foreground',
        {
          'bg-primary': props.highlight,
          'text-primary-foreground': props.highlight,
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

  createEffect(() => {
    console.log('Curio updates')
    console.log(curios())
  })

  return (
    <div class='flex flex-col gap-4'>
      <div class='flex flex-col gap-4'>
        <div class='flex items-center gap-4'>
          <h2 class='text-xl'>Filters</h2>
          <button class='cursor-pointer p-1' onclick={() => setShowFilters((showFilters) => !showFilters)}>
            <Pencil class='size-4 ' />
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
                <div class='flex flex-col gap-0 rounded-xl bg-primary px-4 py-2 text-primary-foreground'>
                  <h3>{curio.title}</h3>
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

interface SidebarNavigationProps {
  children: JSX.Element
}

const SidebarNavigation: Component<SidebarNavigationProps> = (props) => {
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
      window.dispatchEvent(new Event('resize'))
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
        style={{ width: `${sidebarWidth() - 4}px` }}
        class='fixed left-0 flex h-dvh overflow-y-auto bg-background text-foreground'
      >
        <div class='flex shrink flex-grow flex-col gap-4 px-8 py-6'>
          <h1 class='text-4xl'>Code Curio</h1>
          <CurioList />
        </div>
      </div>
      <div
        style={{
          'margin-left': `${sidebarWidth() - 4}px`,
          'width': '9px',
        }}
        class='fixed h-dvh cursor-col-resize select-none bg-accent text-accent-foreground'
        onmousedown={handleMouseDown}
      />
      <div
        style={{ 'margin-left': `${sidebarWidth() + 5}px` }}
        class='h-dvh flex-grow overflow-y-auto bg-primary text-primary-foreground'
      >
        {props.children}
      </div>
    </div>
  )
}

export default SidebarNavigation
