import { defineWebSocketHandler } from 'nitro'

interface ChatPeer {
  id: string
  send(data: unknown): void
}

const peers = new Map<string, ChatPeer>()

export default defineWebSocketHandler({
  open(peer) {
    // Tell the newcomer who's already here so it can initiate a connection to each.
    peer.send({ type: 'peers', self: peer.id, ids: [...peers.keys()] })
    peers.set(peer.id, peer)
  },
  close(peer) {
    peers.delete(peer.id)
    for (const other of peers.values()) {
      other.send({ type: 'leave', id: peer.id })
    }
  },
  message(peer, message) {
    const signal = message.json<{ to: string }>()
    const target = peers.get(signal.to)
    // `from` is set here rather than trusted from the payload, since the client can't spoof its peer id.
    target?.send({ ...signal, from: peer.id })
  },
})
