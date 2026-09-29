import { defineWebSocketHandler } from 'nitro'

interface ChatPeer {
  id: string
  send(data: unknown): void
  // Only present on the Cloudflare Durable Object adapter - see resolveTarget below.
  peers?: Iterable<ChatPeer>
  // Only the real Request seen by `open` carries Cloudflare's geo data (see openLocations below).
  request?: { cf?: CfLocation }
}

interface CfLocation {
  city?: string
  country?: string
}

// Keyed by the client-chosen id (from 'hello'), not crossws' own peer.id.
const peers = new Map<string, ChatPeer>()
// crossws peer.id -> client-chosen id, so `close` knows who to remove/announce.
const clientIds = new Map<string, string>()
// client-chosen id -> "City, Country" from Cloudflare's geo data (no browser prompt).
const locations = new Map<string, string>()
// crossws peer.id -> location, captured in `open` since `peer.request` loses `.cf` by the time
// `message` fires for hibernated peers.
const openLocations = new Map<string, string>()

const formatLocation = (cf: CfLocation | undefined) => {
  if (!cf) return undefined
  return [cf.city, cf.country].filter(Boolean).join(', ') || undefined
}

// A Durable Object can hibernate and wake for a new message; a cached `peer` can go stale and
// throw on `.send()`. `peer.peers` (Durable adapter only) re-resolves live, so prefer it when present.
function resolveTarget(peer: ChatPeer, targetId: string): ChatPeer | undefined {
  const cached = peers.get(targetId)
  if (!peer.peers || !cached) return cached
  for (const live of peer.peers) if (live.id === cached.id) return live
  return cached
}

export default defineWebSocketHandler({
  open(peer) {
    const location = formatLocation(peer.request?.cf)
    if (location) openLocations.set(peer.id, location)
  },
  close(peer) {
    const id = clientIds.get(peer.id)
    openLocations.delete(peer.id)
    if (!id) return

    clientIds.delete(peer.id)
    peers.delete(id)
    locations.delete(id)
    for (const targetId of peers.keys()) {
      resolveTarget(peer, targetId)?.send({ type: 'leave', id })
    }
  },
  message(peer, message) {
    const signal = message.json<{ type: string; id?: string; to?: string }>()

    if (signal.type === 'hello' && signal.id) {
      const location = openLocations.get(peer.id)
      openLocations.delete(peer.id)
      if (location) locations.set(signal.id, location)

      peer.send({ type: 'peers', ids: [...peers.keys()], locations: Object.fromEntries(locations) })
      clientIds.set(peer.id, signal.id)
      peers.set(signal.id, peer)
      return
    }

    if (signal.to) {
      const target = resolveTarget(peer, signal.to)
      const from = clientIds.get(peer.id)
      // `from`/`location` come from server state, not the payload, so a client can't spoof either.
      target?.send({ ...signal, from, location: from ? locations.get(from) : undefined })
    }
  },
})
