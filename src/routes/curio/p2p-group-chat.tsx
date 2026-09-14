import { For, Show, createEffect, createMemo, createSignal, onCleanup, onMount } from 'solid-js'
import { GithubIcon } from '~/components/icons'
import Button from '~/components/widgets/button'
import ButtonLink from '~/components/widgets/button-link'
import Loader from '~/components/widgets/loader'
import { cn } from '~/lib/cn'
import { CURIO_CANVAS_WIDTH } from '~/lib/curio/dimensions'
import { CurioMetadata } from '~/lib/curio/metadata'

export const info: CurioMetadata = {
  id: 'p2p-group-chat',
  title: 'P2P Group Chat',
  created: new Date('2026-08-22'),
  updated: new Date('2026-09-12'),
  tags: ['interactive', 'networking', 'real-time'],
}

type Signal =
  | { type: 'peers'; ids: string[]; locations: Record<string, string> }
  | { type: 'leave'; id: string }
  | { type: 'offer'; from: string; location?: string; offer: RTCSessionDescriptionInit }
  | { type: 'answer'; from: string; location?: string; answer: RTCSessionDescriptionInit }
  | { type: 'ice'; from: string; location?: string; candidate: RTCIceCandidateInit }

type ChatMessage = { id: string; from: 'me' | string; text: string; timestamp: number }

type ChannelMessage =
  | { type: 'message'; id: string; from: string; text: string; timestamp: number }
  | { type: 'history'; messages: { id: string; from: string; text: string; timestamp: number }[] }

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }]

// Web Lock gives an instant yes/no on whether this id is already claimed elsewhere, so a
// duplicated tab's copied sessionStorage id doesn't collide with the original.
const SELF_ID_STORAGE_KEY = 'p2p-group-chat-self-id'
let cachedSelfId: string | undefined

const claimId = (id: string) =>
  new Promise<boolean>((resolveClaim) => {
    navigator.locks.request(`p2p-group-chat:self-id:${id}`, { ifAvailable: true }, (lock) => {
      resolveClaim(lock !== null)
      // Held until the tab closes/reloads; the browser releases it automatically.
      if (lock) return new Promise(() => {})
    })
  })

const resolveSelfId = async () => {
  if (cachedSelfId) return cachedSelfId

  const stored = sessionStorage.getItem(SELF_ID_STORAGE_KEY)
  const id = stored && (await claimId(stored)) ? stored : crypto.randomUUID()
  if (id !== stored) {
    sessionStorage.setItem(SELF_ID_STORAGE_KEY, id)
    await claimId(id)
  }
  cachedSelfId = id
  return id
}

const MAX_MESSAGES = 200

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
  const [selfId, setSelfId] = createSignal<string | null>(null)
  const [peerIds, setPeerIds] = createSignal<string[]>([])
  const [peerLocations, setPeerLocations] = createSignal<Record<string, string>>({})
  const [messages, setMessages] = createSignal<ChatMessage[]>([])
  const [input, setInput] = createSignal('')

  let socket: WebSocket | undefined
  let messageLogRef: HTMLElement | undefined
  const connections = new Map<string, RTCPeerConnection>()
  const channels = new Map<string, RTCDataChannel>()

  const send = (signal: object) => socket?.send(JSON.stringify(signal))

  createEffect(() => {
    messages()
    messageLogRef?.scrollTo({ top: messageLogRef.scrollHeight })
  })

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

  // Deterministic id so every peer that independently witnesses this converges on the same entry.
  const addLeftMessage = (id: string) => {
    const text = `${peerIdentity(id).name} left the chat`
    setMessages((prev) =>
      [...prev, { id: `leave-${id}`, from: 'system', text, timestamp: Date.now() }].slice(-MAX_MESSAGES),
    )
  }

  // Only call from the side reacting to an unsolicited offer (isIncoming) - the newcomer didn't
  // just "join" from its own perspective.
  const addJoinedMessage = (id: string) => {
    const text = `${peerIdentity(id).name} joined the chat`
    setMessages((prev) =>
      [...prev, { id: `join-${id}`, from: 'system', text, timestamp: Date.now() }].slice(-MAX_MESSAGES),
    )
  }

  // Only for a peer who finds the room empty - there's no one to "join".
  const addStartedMessage = (id: string) => {
    const text = `${peerIdentity(id).name} started the chat`
    setMessages((prev) =>
      [...prev, { id: `start-${id}`, from: 'system', text, timestamp: Date.now() }].slice(-MAX_MESSAGES),
    )
  }

  const setupChannel = (id: string, channel: RTCDataChannel, isIncoming: boolean) => {
    channels.set(id, channel)

    channel.onopen = () => {
      setPeerIds([...channels.keys()])
      if (isIncoming) addJoinedMessage(id)
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

    connection = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        send({ type: 'ice', to: id, candidate: event.candidate.toJSON() })
      }
    }
    // ondatachannel firing here means the peer at the other end initiated, i.e. just joined.
    connection.ondatachannel = (event) => setupChannel(id, event.channel, true)

    connections.set(id, connection)
    return connection
  }

  const connectToPeer = async (id: string) => {
    const connection = getOrCreateConnection(id)
    setupChannel(id, connection.createDataChannel('chat'), false)

    const offer = await connection.createOffer()
    await connection.setLocalDescription(offer)
    send({ type: 'offer', to: id, offer })
  }

  const removePeer = (id: string) => {
    channels.get(id)?.close()
    channels.delete(id)
    connections.get(id)?.close()
    connections.delete(id)
    setPeerIds([...channels.keys()])
  }

  onMount(() => {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    socket = new WebSocket(`${protocol}//${location.host}/ws`)

    // Socket open and selfId resolution race independently, so 'hello' only fires once both are ready.
    let socketOpen = false
    let idReady = false
    const sayHelloIfReady = () => {
      if (socketOpen && idReady) send({ type: 'hello', id: selfId() })
    }

    socket.onopen = () => {
      socketOpen = true
      sayHelloIfReady()
    }

    resolveSelfId().then((id) => {
      setSelfId(id)
      idReady = true
      sayHelloIfReady()
    })

    socket.onmessage = async (event) => {
      const signal: Signal = JSON.parse(event.data)

      switch (signal.type) {
        case 'peers': {
          setPeerLocations((prev) => ({ ...prev, ...signal.locations }))
          if (signal.ids.length === 0) addStartedMessage(selfId()!)
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
            fallback={<Loader width={CURIO_CANVAS_WIDTH} height={384} size={48} />}
          >
            <section ref={messageLogRef} class='bg-accent flex h-96 flex-col gap-2 overflow-y-auto rounded-lg p-4'>
              <For each={messages()}>
                {(message, index) => {
                  const isSystem = message.from === 'system'

                  // Must stay reactive (createMemo) - a <For> row only runs once, so a plain read
                  // here would miss later-appended messages in the same consecutive-system run.
                  if (isSystem) {
                    const isFirstInRun = createMemo(() => messages()[index() - 1]?.from !== 'system')
                    const runText = createMemo(() => {
                      const all = messages()
                      const run: string[] = []
                      for (let i = index(); i < all.length && all[i].from === 'system'; i++) run.push(all[i].text)
                      return run.join(' · ')
                    })
                    return (
                      <Show when={isFirstInRun()}>
                        <p class='py-0.5 text-center text-[11px] opacity-40'>{runText()}</p>
                      </Show>
                    )
                  }

                  const previous = createMemo(() => messages()[index() - 1])
                  const isMe = message.from === 'me'
                  const identity = isMe ? (selfId() ? peerIdentity(selfId()!) : null) : peerIdentity(message.from)
                  const showMeta = createMemo(() => !previous() || previous()!.from !== message.from)

                  return (
                    <div
                      class={cn('flex items-end gap-2', {
                        'flex-row-reverse': isMe,
                        'mt-1': showMeta() && index() > 0,
                      })}
                    >
                      <div class='w-8 shrink-0'>
                        <Show when={showMeta() && identity}>
                          <span
                            class='flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white'
                            style={{ 'background-color': identity!.color }}
                          >
                            {identity!.initials}
                          </span>
                        </Show>
                      </div>

                      <div class={cn('flex max-w-[75%] flex-col gap-1', isMe ? 'items-end' : 'items-start')}>
                        <Show when={showMeta()}>
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
            <Button onClick={sendMessage} disabled={peerIds().length === 0}>
              Send
            </Button>
          </section>
        </div>

        <section class='flex'>
          <ButtonLink
            target='_blank'
            href={`${import.meta.env.VITE_GITHUB_URL}/blob/main/src/routes/curio/p2p-group-chat.tsx`}
          >
            <GithubIcon />
            View Source Code
          </ButtonLink>
        </section>
        <section class='flex flex-col gap-4'>
          <h2 class='text-4xl font-extralight'>Signaling, Durable Objects, and Deployment</h2>
          <p>
            Unlike the other curios, most of the code, client and server, was written by an AI coding agent (GitHub
            Copilot, using Claude).
          </p>
          <p>
            The mesh is full: every peer connects directly to every other peer, and a small signaling server just relays
            offers, answers, and ICE candidates by client id so connections can be established. Whoever joins last
            always initiates - it creates the data channel and sends the offer to everyone already in the room, while
            existing peers only ever react to an unsolicited offer. That asymmetry avoids offer glare without needing
            perfect-negotiation logic. Once a data channel opens between two browsers, chat messages travel directly
            between them - the server only ever sees connection metadata, never the conversation.
          </p>
          <p>
            The signaling server originally ran on Cloudflare Pages, which turned out to be the wrong fit: Pages
            Functions execute on stateless-per-invocation Worker isolates, so the in-memory map tracking connected peers
            wasn't reliably shared across concurrent WebSocket connections. Two tabs against the deployed URL would
            never see each other's offers. The fix was to move the deployment target to Cloudflare Workers with a
            Durable Object backing that same relay logic, giving every connection one consistent instance to route
            through. That introduced its own gotcha: a cached reference to a WebSocket peer breaks the moment the
            Durable Object hibernates and wakes up in a fresh JS context, so the relay re-resolves each target peer on
            every send instead of holding onto a stale handle.
          </p>
          <p>
            CI/CD mirrors that setup: every pull request gets its own isolated preview Worker with its own Durable
            Object instance and a URL posted back as a PR comment, so signaling changes can be tested without touching
            the production room, and a separate workflow deploys to production on merge.
          </p>
        </section>
      </article>
    </main>
  )
}
