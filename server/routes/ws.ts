import { defineWebSocketHandler } from 'nitro'

interface ChatPeer {
  id: string
  send(data: unknown): void
  // Only present on the Cloudflare Durable Object adapter - see resolveTarget below.
  peers?: Iterable<ChatPeer>
}

// Keyed by the client-chosen id (sent via 'hello'), not crossws' own peer.id, so
// clients can assign their own alias immediately instead of waiting on a round trip.
const peers = new Map<string, ChatPeer>()
// crossws peer.id -> client-chosen id, so `close` knows who to remove/announce.
const clientIds = new Map<string, string>()

// A Durable Object can hibernate and later wake for a new message; a `peer` cached across that
// boundary can go stale and throw "Cannot perform I/O on behalf of a different Durable Object" as
// soon as you call `.send()` on it. `peer.peers` (only present on the Cloudflare Durable adapter)
// re-resolves every currently-connected peer fresh on each call, so prefer that live lookup for
// actually sending. Other presets (plain Node dev) have no `.peers` and no hibernation risk, so the
// cached object is used directly there.
function resolveTarget(peer: ChatPeer, targetId: string): ChatPeer | undefined {
  const cached = peers.get(targetId)
  if (!peer.peers || !cached) return cached
  for (const live of peer.peers) if (live.id === cached.id) return live
  return cached
}

export default defineWebSocketHandler({
  close(peer) {
    const id = clientIds.get(peer.id)
    if (!id) return

    clientIds.delete(peer.id)
    peers.delete(id)
    for (const targetId of peers.keys()) {
      resolveTarget(peer, targetId)?.send({ type: 'leave', id })
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
      const target = resolveTarget(peer, signal.to)
      // `from` is set here rather than trusted from the payload, since the client can't spoof its peer id.
      target?.send({ ...signal, from: clientIds.get(peer.id) })
    }
  },
})
