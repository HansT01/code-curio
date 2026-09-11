import { defineWebSocketHandler } from 'nitro'

interface ChatPeer {
  id: string
  send(data: unknown): void
}

// Keyed by the client-chosen id (sent via 'hello'), not crossws' own peer.id, so
// clients can assign their own alias immediately instead of waiting on a round trip.
const peers = new Map<string, ChatPeer>()
// crossws peer.id -> client-chosen id, so `close` knows who to remove/announce.
const clientIds = new Map<string, string>()

export default defineWebSocketHandler({
  close(peer) {
    const id = clientIds.get(peer.id)
    if (!id) return

    clientIds.delete(peer.id)
    peers.delete(id)
    for (const other of peers.values()) {
      other.send({ type: 'leave', id })
    }
  },
  message(peer, message) {
    const signal = message.json<{ type: string; id?: string; to?: string }>()

    if (signal.type === 'hello' && signal.id) {
      // Tell the newcomer who's already here so it can initiate a connection to each.
      peer.send({ type: 'peers', ids: [...peers.keys()] })
      clientIds.set(peer.id, signal.id)
      peers.set(signal.id, peer)
      return
    }

    if (signal.to) {
      const target = peers.get(signal.to)
      // `from` is set here rather than trusted from the payload, since the client can't spoof its peer id.
      target?.send({ ...signal, from: clientIds.get(peer.id) })
    }
  },
})
