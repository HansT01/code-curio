import { For, Show, createEffect, createSignal, onCleanup, onMount } from 'solid-js'
import { GithubIcon } from '~/components/icons'
import Loader from '~/components/widgets/loader'
import { cn } from '~/lib/cn'
import { CURIO_CANVAS_WIDTH } from '~/lib/curio/dimensions'
import { CurioMetadata } from '~/lib/curio/metadata'

export const info: CurioMetadata = {
  id: 'p2p-group-chat',
  title: 'P2P Group Chat',
  created: new Date('2026-08-22'),
  updated: new Date('2026-09-12'),
  tags: ['interactive'],
}

type Signal =
  | { type: 'peers'; ids: string[]; locations: Record<string, string> }
  | { type: 'leave'; id: string }
  | { type: 'offer'; from: string; location?: string; offer: RTCSessionDescriptionInit }
  | { type: 'answer'; from: string; location?: string; answer: RTCSessionDescriptionInit }
  | { type: 'ice'; from: string; location?: string; candidate: RTCIceCandidateInit }

type ChatMessage = { id: string; from: 'me' | string; text: string; timestamp: number }

// Wire format sent over the RTCDataChannel; unlike ChatMessage, `from` is always the real sender id.
type ChannelMessage =
  | { type: 'message'; id: string; from: string; text: string; timestamp: number }
  | { type: 'history'; messages: { id: string; from: string; text: string; timestamp: number }[] }

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }]

// Caps both local memory and the size of the history payload exchanged on every new connection.
const MAX_MESSAGES = 200

// Deterministic "Adjective Animal" name + hue, so every peer sees the same identity for the same id.
const ADJECTIVES = [
  'Swift',
  'Calm',
  'Bold',
  'Quiet',
  'Clever',
  'Brave',
  'Gentle',
  'Lucky',
  'Sunny',
  'Mighty',
  'Nimble',
  'Witty',
]
const ANIMALS = [
  'Fox',
  'Owl',
  'Otter',
  'Falcon',
  'Panda',
  'Wolf',
  'Lynx',
  'Heron',
  'Badger',
  'Raven',
  'Dolphin',
  'Tiger',
]

const hashId = (id: string) => {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return hash
}

const peerIdentity = (id: string) => {
  const hash = hashId(id)
  const adjective = ADJECTIVES[hash % ADJECTIVES.length]
  const animal = ANIMALS[Math.floor(hash / ADJECTIVES.length) % ANIMALS.length]
  return {
    name: `${adjective} ${animal}`,
    initials: `${adjective[0]}${animal[0]}`,
    color: `hsl(${hash % 360}, 55%, 42%)`,
  }
}

const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

export default function P2PGroupChat() {
  // Chosen locally so our own alias renders immediately, instead of waiting on a server round trip.
  const [selfId, setSelfId] = createSignal<string | null>(null)
  const [peerIds, setPeerIds] = createSignal<string[]>([])
  // Keyed by client id, including our own - derived server-side from Cloudflare's request geo
  // data, never from a browser geolocation prompt. Absent entries just mean no data was available.
  const [peerLocations, setPeerLocations] = createSignal<Record<string, string>>({})
  const [pendingConnections, setPendingConnections] = createSignal(0)
  const [messages, setMessages] = createSignal<ChatMessage[]>([])
  const [input, setInput] = createSignal('')

  let socket: WebSocket | undefined
  let messageLogRef: HTMLElement | undefined
  const connections = new Map<string, RTCPeerConnection>()
  const channels = new Map<string, RTCDataChannel>()

  const send = (signal: object) => socket?.send(JSON.stringify(signal))

  // Keep the log pinned to the latest message whenever the list changes or first mounts.
  createEffect(() => {
    messages()
    messageLogRef?.scrollTo({ top: messageLogRef.scrollHeight })
  })

  // Own messages are stored as `from: 'me'` locally, but peers need our real id to attribute them.
  const toWireFrom = (from: string) => (from === 'me' ? selfId()! : from)

  const mergeMessages = (incoming: { id: string; from: string; text: string; timestamp: number }[]) => {
    setMessages((prev) => {
      const known = new Set(prev.map((m) => m.id))
      const additions = incoming
        .filter((m) => !known.has(m.id))
        .map((m) => ({ ...m, from: m.from === selfId() ? 'me' : m.from }))
      if (additions.length === 0) return prev
      return [...prev, ...additions].sort((a, b) => a.timestamp - b.timestamp).slice(-MAX_MESSAGES)
    })
  }

  // Deterministic id (not random) so every peer who independently witnesses the same leave converges on one entry.
  const addLeftMessage = (id: string) => {
    const text = `${peerIdentity(id).name} left the chat`
    setMessages((prev) =>
      [...prev, { id: `leave-${id}`, from: 'system', text, timestamp: Date.now() }].slice(-MAX_MESSAGES),
    )
  }

  const setupChannel = (id: string, channel: RTCDataChannel) => {
    channels.set(id, channel)

    channel.onopen = () => {
      setPeerIds([...channels.keys()])
      setPendingConnections((count) => count - 1)
      // Catch the other side up on everything we've seen, so a refresh/late join isn't missing history.
      const history: ChannelMessage = {
        type: 'history',
        messages: messages().map((m) => ({ ...m, from: toWireFrom(m.from) })),
      }
      channel.send(JSON.stringify(history))
    }
    channel.onclose = () => {
      channels.delete(id)
      setPeerIds([...channels.keys()])
    }
    channel.onmessage = (event) => {
      const data: ChannelMessage = JSON.parse(event.data)
      if (data.type === 'history') {
        mergeMessages(data.messages)
      } else {
        mergeMessages([data])
      }
    }
  }

  const getOrCreateConnection = (id: string) => {
    let connection = connections.get(id)
    if (connection) return connection

    setPendingConnections((count) => count + 1)
    connection = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        send({ type: 'ice', to: id, candidate: event.candidate.toJSON() })
      }
    }
    // The non-initiator receives the data channel here instead of creating one.
    connection.ondatachannel = (event) => setupChannel(id, event.channel)

    connections.set(id, connection)
    return connection
  }

  const connectToPeer = async (id: string) => {
    const connection = getOrCreateConnection(id)
    setupChannel(id, connection.createDataChannel('chat'))

    const offer = await connection.createOffer()
    await connection.setLocalDescription(offer)
    send({ type: 'offer', to: id, offer })
  }

  const removePeer = (id: string) => {
    const wasConnected = channels.has(id)

    channels.get(id)?.close()
    channels.delete(id)
    connections.get(id)?.close()
    connections.delete(id)
    setPeerIds([...channels.keys()])

    if (!wasConnected) {
      setPendingConnections((count) => count - 1)
    }
  }

  onMount(() => {
    setSelfId(crypto.randomUUID())

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    socket = new WebSocket(`${protocol}//${location.host}/ws`)
    socket.onopen = () => send({ type: 'hello', id: selfId() })

    socket.onmessage = async (event) => {
      const signal: Signal = JSON.parse(event.data)

      switch (signal.type) {
        case 'peers': {
          setPeerLocations((prev) => ({ ...prev, ...signal.locations }))
          // We're the newcomer: initiate a connection to every peer already in the room.
          await Promise.all(signal.ids.map((id) => connectToPeer(id)))
          break
        }

        case 'leave': {
          removePeer(signal.id)
          addLeftMessage(signal.id)
          setPeerLocations((prev) => {
            const next = { ...prev }
            delete next[signal.id]
            return next
          })
          break
        }

        case 'offer': {
          if (signal.location) setPeerLocations((prev) => ({ ...prev, [signal.from]: signal.location! }))
          const connection = getOrCreateConnection(signal.from)
          await connection.setRemoteDescription(signal.offer)

          const answer = await connection.createAnswer()
          await connection.setLocalDescription(answer)
          send({ type: 'answer', to: signal.from, answer })
          break
        }

        case 'answer': {
          if (signal.location) setPeerLocations((prev) => ({ ...prev, [signal.from]: signal.location! }))
          await connections.get(signal.from)?.setRemoteDescription(signal.answer)
          break
        }

        case 'ice': {
          await connections.get(signal.from)?.addIceCandidate(signal.candidate)
          break
        }
      }
    }
  })

  onCleanup(() => {
    socket?.close()
    for (const id of [...connections.keys()]) removePeer(id)
  })

  const sendMessage = () => {
    const text = input().trim()
    if (!text || channels.size === 0) return

    const message: ChatMessage = { id: crypto.randomUUID(), from: 'me', text, timestamp: Date.now() }
    const payload: ChannelMessage = {
      type: 'message',
      id: message.id,
      from: selfId()!,
      text,
      timestamp: message.timestamp,
    }
    for (const channel of channels.values()) {
      if (channel.readyState === 'open') channel.send(JSON.stringify(payload))
    }
    setMessages((prev) => [...prev, message].slice(-MAX_MESSAGES))
    setInput('')
  }

  return (
    <main>
      <article class='flex flex-col gap-6 p-8'>
        <header>
          <h1 class='text-6xl font-thin'>P2P Group Chat</h1>
        </header>
        <section class='flex flex-col gap-4'>
          <p>
            Peer-to-peer (P2P) networking lets devices talk directly to one another instead of routing everything
            through a central server. WebRTC brings this capability to the browser, letting two tabs exchange data in
            real time once a connection between them has been established.
          </p>
          <p>
            This curio is a group chat built on WebRTC data channels. A small signaling server helps peers find each
            other and exchange the connection details needed to get started, but once that handshake is done, messages
            travel directly between browsers - the server never sees the conversation itself.
          </p>
        </section>

        <div class='flex w-full flex-col gap-4' style={{ 'max-width': `${CURIO_CANVAS_WIDTH}px` }}>
          <section class='flex flex-wrap items-center gap-2'>
            <div class='bg-accent flex items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5'>
              <span
                class='flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white'
                style={{ 'background-color': selfId() ? peerIdentity(selfId()!).color : '#94a3b8' }}
              >
                {selfId() ? peerIdentity(selfId()!).initials : '·'}
              </span>
              <span class='text-sm font-medium'>You{selfId() ? ` · ${peerIdentity(selfId()!).name}` : ''}</span>
              <Show when={selfId() && peerLocations()[selfId()!]}>
                <span class='text-xs opacity-60'>· {peerLocations()[selfId()!]}</span>
              </Show>
            </div>

            {peerIds().map((id) => {
              const identity = peerIdentity(id)
              return (
                <div class='bg-accent flex items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5'>
                  <span
                    class='flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white'
                    style={{ 'background-color': identity.color }}
                  >
                    {identity.initials}
                  </span>
                  <span class='text-sm font-medium'>{identity.name}</span>
                  <Show when={peerLocations()[id]}>
                    <span class='text-xs opacity-60'>· {peerLocations()[id]}</span>
                  </Show>
                </div>
              )
            })}
          </section>

          <Show
            when={messages().length > 0 || peerIds().length > 0}
            fallback={
              <Show
                when={pendingConnections() > 0}
                fallback={
                  <div class='bg-accent flex h-96 w-full items-center justify-center rounded-2xl'>
                    <p class='opacity-60'>Waiting for someone to join...</p>
                  </div>
                }
              >
                <Loader width={CURIO_CANVAS_WIDTH} height={384} size={48} />
              </Show>
            }
          >
            <section ref={messageLogRef} class='bg-accent flex h-96 flex-col gap-2 overflow-y-auto rounded-lg p-4'>
              <For each={messages()}>
                {(message, index) => {
                  const isMe = message.from === 'me'
                  const isSystem = message.from === 'system'
                  const identity = isSystem
                    ? null
                    : isMe
                      ? selfId()
                        ? peerIdentity(selfId()!)
                        : null
                      : peerIdentity(message.from)
                  const previous = messages()[index() - 1]
                  const showMeta = !previous || previous.from !== message.from

                  return (
                    <Show when={!isSystem} fallback={<p class='py-1 text-center text-xs opacity-50'>{message.text}</p>}>
                      <div
                        class={cn('flex items-end gap-2', {
                          'flex-row-reverse': isMe,
                          'mt-1': showMeta && index() > 0,
                        })}
                      >
                        <div class='w-8 shrink-0'>
                          <Show when={showMeta && identity}>
                            <span
                              class='flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white'
                              style={{ 'background-color': identity!.color }}
                            >
                              {identity!.initials}
                            </span>
                          </Show>
                        </div>

                        <div class={cn('flex max-w-[75%] flex-col gap-1', isMe ? 'items-end' : 'items-start')}>
                          <Show when={showMeta}>
                            <span class='flex items-baseline gap-2 px-1'>
                              <span class='text-xs font-semibold' style={{ color: isMe ? undefined : identity!.color }}>
                                {isMe ? 'You' : identity!.name}
                              </span>
                              <span class='text-[10px] opacity-50'>{formatTime(message.timestamp)}</span>
                            </span>
                          </Show>
                          <div
                            class={cn(
                              'rounded-2xl px-4 py-2 wrap-break-word whitespace-pre-wrap',
                              isMe
                                ? 'bg-primary text-primary-fg rounded-br-sm'
                                : 'bg-background text-background-fg rounded-bl-sm',
                            )}
                          >
                            {message.text}
                          </div>
                        </div>
                      </div>
                    </Show>
                  )
                }}
              </For>
            </section>
          </Show>

          <section class='flex gap-4'>
            <input
              type='text'
              value={input()}
              onInput={(event) => setInput(event.currentTarget.value)}
              onKeyDown={(event) => event.key === 'Enter' && sendMessage()}
              disabled={peerIds().length === 0}
              class='bg-accent min-w-0 flex-1 rounded-lg px-4 py-3 disabled:opacity-50'
              placeholder='Type a message...'
            />
            <button
              onClick={sendMessage}
              disabled={peerIds().length === 0}
              class='bg-primary text-primary-fg hover:bg-secondary hover:text-secondary-fg cursor-pointer rounded-lg px-4 py-3 disabled:cursor-not-allowed disabled:opacity-50'
            >
              Send
            </button>
          </section>
        </div>

        <section class='flex'>
          <a
            target='_blank'
            href={`${import.meta.env.VITE_GITHUB_URL}/blob/main/src/routes/curio/p2p-group-chat.tsx`}
            class='bg-primary text-primary-fg hover:bg-secondary hover:text-secondary-fg flex cursor-pointer items-center gap-2 rounded-lg px-4 py-3'
          >
            <GithubIcon />
            View Source Code
          </a>
        </section>
      </article>
    </main>
  )
}
