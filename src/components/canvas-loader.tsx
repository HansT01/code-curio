import { Loader2 } from 'lucide-solid'

const CanvasLoader = () => {
  return (
    <div class='flex h-[480px] w-[calc(min(854px,100%))] items-center justify-center rounded-2xl bg-accent text-accent-fg '>
      <Loader2 class='animate-spin' size={36} />
    </div>
  )
}

export default CanvasLoader
