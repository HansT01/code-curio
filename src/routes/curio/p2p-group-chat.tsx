import { For, Show, createEffect, createMemo, createSignal, onCleanup, onMount } from 'solid-js'
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

// Persists selfId across SPA navigation within a tab (sessionStorage) and page reloads, while a
// Web Lock stops a duplicated tab's copied sessionStorage value from colliding with the tab it
// was duplicated from - if the id is already claimed elsewhere, we fall back to a fresh one
// instead. `navigator.locks` gives a definitive yes/no immediately (no polling/timeout needed to
// be sure nobody else holds it), so this adds no perceptible startup delay.
// Cached at module scope so repeat mounts in the same tab (e.g. navigating away and back) reuse
// the already-claimed id instantly without touching sessionStorage/locks again; the lock itself
// is only ever released when the tab's document is actually torn down (full reload/close), which
// is exactly when we want the identity slot to free up for a future visit.
const SELF_ID_STORAGE_KEY = 'p2p-group-chat-self-id'
let cachedSelfId: string | undefined

const claimId = (id: string) =>
  new Promise<boolean>((resolveClaim) => {
    navigator.locks.request(`p2p-group-chat:self-id:${id}`, { ifAvailable: true }, (lock) => {
      resolveClaim(lock !== null)
      // Held for as long as this tab's document is alive; the browser releases it automatically
      // on reload/close, so there's nothing to explicitly clean up here.
      if (lock) return new Promise(() => {})
    })
  })

const resolveSelfId = async () => {
  if (cachedSelfId) return cachedSelfId

  const stored = sessionStorage.getItem(SELF_ID_STORAGE_KEY)
  const id = stored && (await claimId(stored)) ? stored : crypto.randomUUID()
  if (id !== stored) {
    sessionStorage.setItem(SELF_ID_STORAGE_KEY, id)
    await claimId(id) // Always succeeds for a fresh id - nobody else could already hold it.
  }
  cachedSelfId = id
  return id
}

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

  // Deterministic id, same reasoning as addLeftMessage. Only called from the perspective of an
  // already-connected peer witnessing someone else join (see setupChannel's `isIncoming`) - the
  // newcomer itself never calls this for the peers it connects out to, since they didn't just join.
  const addJoinedMessage = (id: string) => {
    const text = `${peerIdentity(id).name} joined the chat`
    setMessages((prev) =>
      [...prev, { id: `join-${id}`, from: 'system', text, timestamp: Date.now() }].slice(-MAX_MESSAGES),
    )
  }

  // Called only for the peer who finds the room empty on arrival - there's no one to "join", they're
  // the one starting it, so this is the sole entry any later joiner's synced history begins with.
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
      // Only the side that received an unsolicited offer witnesses a join - the newcomer itself
      // initiated this connection, so the peer at the other end wasn't the one who just joined.
      if (isIncoming) addJoinedMessage(id)
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

    connection = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        send({ type: 'ice', to: id, candidate: event.candidate.toJSON() })
      }
    }
    // The non-initiator receives the data channel here instead of creating one - that means the
    // peer at the other end is the one initiating, i.e. the one who just joined.
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

    // Opening the socket and resolving/claiming selfId happen in parallel (network latency for
    // the former dwarfs the latter), so 'hello' is only sent once both are actually ready.
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
          // Nobody else is here yet - we're starting the room, not joining one.
          if (signal.ids.length === 0) addStartedMessage(selfId()!)
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
            fallback={<Loader width={CURIO_CANVAS_WIDTH} height={384} size={48} />}
          >
            <section
              ref={messageLogRef}
              class='bg-accent flex h-96 flex-col gap-2 overflow-y-auto rounded-2xl p-4'
            >
              <For each={messages()}>
                {(message, index) => {
                  const isSystem = message.from === 'system'

                  // Consecutive system messages (joins/leaves with no real message between them)
                  // collapse into a single compact, muted line instead of one row each - only the
                  // first message in a run renders anything, folding the whole run's text into it.
                  // These reads must stay reactive (via createMemo) since later-appended messages
                  // need to retroactively update an earlier run's rendered text.
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
