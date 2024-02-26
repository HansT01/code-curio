const getCurioInfo = async () => {
  'use server'
  const context = import.meta.glob('./curio/*.tsx')
  const keys = Object.keys(context)
  const info = await Promise.all(
    keys.map(async (key) => {
      const { curioInfo } = (await context[key]()) as any
      return curioInfo.id
    }),
  )
  console.log(info)
}

export default function Home() {
  const handleButton = () => {
    getCurioInfo()
  }
  return (
    <main class='flex min-h-lvh flex-col items-center gap-4 bg-background p-4 text-foreground'>
      <h1 class='text-8xl font-extrabold uppercase tracking-tight'>Code Curio</h1>
      <button
        class='cursor-pointer rounded-lg bg-primary px-8 py-4 font-bold text-primary-foreground'
        onclick={handleButton}
      >
        Button
      </button>
    </main>
  )
}
