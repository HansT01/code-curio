import { createSignal, onCleanup, onMount } from 'solid-js'
import { CurioMetadata } from '~/lib/curio/metadata'

export const info: CurioMetadata = {
  id: 'p2p-group-chat',
  title: 'P2P Group Chat',
  created: new Date('2026-08-22'),
  updated: new Date('2026-09-12'),
  tags: ['interactive'],
}

type Signal =
  | { type: 'peers'; self: string; ids: string[] }
  | { type: 'leave'; id: string }
  | { type: 'offer'; from: string; offer: RTCSessionDescriptionInit }
  | { type: 'answer'; from: string; answer: RTCSessionDescriptionInit }
  | { type: 'ice'; from: string; candidate: RTCIceCandidateInit }

type ChatMessage = { from: 'me' | string; text: string }

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }]

const peerLabel = (id: string) => `Peer-${id.slice(0, 4)}`

export default function P2PGroupChat() {
  const [socketReady, setSocketReady] = createSignal(false)
  const [peerCount, setPeerCount] = createSignal(0)
  const [messages, setMessages] = createSignal<ChatMessage[]>([])
  const [input, setInput] = createSignal('')

  let socket: WebSocket | undefined
  const connections = new Map<string, RTCPeerConnection>()
  const channels = new Map<string, RTCDataChannel>()

  const send = (signal: object) => socket?.send(JSON.stringify(signal))

  const setupChannel = (id: string, channel: RTCDataChannel) => {
    channels.set(id, channel)

    channel.onopen = () => setPeerCount(channels.size)
    channel.onclose = () => {
      channels.delete(id)
      setPeerCount(channels.size)
    }
    channel.onmessage = (event) => setMessages((prev) => [...prev, { from: id, text: event.data }])
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
    channels.get(id)?.close()
    channels.delete(id)
    connections.get(id)?.close()
    connections.delete(id)
    setPeerCount(channels.size)
  }

  onMount(() => {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    socket = new WebSocket(`${protocol}//${location.host}/ws`)
    socket.onopen = () => setSocketReady(true)
    socket.onclose = () => setSocketReady(false)

    socket.onmessage = async (event) => {
      const signal: Signal = JSON.parse(event.data)

      switch (signal.type) {
        case 'peers': {
          // We're the newcomer: initiate a connection to every peer already in the room.
          await Promise.all(signal.ids.map((id) => connectToPeer(id)))
          break
        }

        case 'leave': {
          removePeer(signal.id)
          break
        }

        case 'offer': {
          const connection = getOrCreateConnection(signal.from)
          await connection.setRemoteDescription(signal.offer)

          const answer = await connection.createAnswer()
          await connection.setLocalDescription(answer)
          send({ type: 'answer', to: signal.from, answer })
          break
        }

        case 'answer': {
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

    for (const channel of channels.values()) {
      if (channel.readyState === 'open') channel.send(text)
    }
    setMessages((prev) => [...prev, { from: 'me', text }])
    setInput('')
  }

  return (
    <main>
      <article class='flex flex-col gap-6 p-8'>
        <header>
          <h1 class='text-6xl font-thin'>P2P Group Chat</h1>
          <p class='mt-4'>
            {socketReady() ? `Connected to signaling server. Peers online: ${peerCount()}` : 'Connecting...'}
          </p>
        </header>

        <section class='bg-accent flex h-80 flex-col gap-2 overflow-y-auto rounded-lg p-4'>
          {messages().map((message) => (
            <p class={message.from === 'me' ? 'text-primary self-end' : 'text-background-fg self-start'}>
              {message.from === 'me' ? 'You' : peerLabel(message.from)}: {message.text}
            </p>
          ))}
        </section>

        <section class='flex gap-4'>
          <input
            type='text'
            value={input()}
            onInput={(event) => setInput(event.currentTarget.value)}
            onKeyDown={(event) => event.key === 'Enter' && sendMessage()}
            disabled={peerCount() === 0}
            class='bg-accent flex-1 rounded-lg px-4 py-3 disabled:opacity-50'
            placeholder='Type a message...'
          />
          <button
            onClick={sendMessage}
            disabled={peerCount() === 0}
            class='bg-primary text-primary-fg hover:bg-secondary hover:text-secondary-fg cursor-pointer rounded-lg px-4 py-3 disabled:cursor-not-allowed disabled:opacity-50'
          >
            Send
          </button>
        </section>
      </article>
    </main>
  )
}
