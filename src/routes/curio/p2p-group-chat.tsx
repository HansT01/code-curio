import { clientOnly } from '@solidjs/start'
import { CurioMetadata } from '~/lib/curio/metadata'

export const info: CurioMetadata = {
  id: 'p2p-group-chat',
  title: 'P2P Group Chat',
  created: new Date('2026-08-22'),
  updated: new Date('2026-08-22'),
  tags: [],
}

const P2P = clientOnly(() => import('~/components/client-only/p2p'))

export default function P2PGroupChat() {
  return (
    <main>
      <article class='flex flex-col gap-6 p-8'>
        <header>
          <h1 class='text-6xl font-thin'>P2P Group Chat</h1>
        </header>
        <section>
          <P2P />
        </section>
      </article>
    </main>
  )
}
