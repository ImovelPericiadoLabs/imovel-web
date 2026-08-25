import { Home } from 'lucide-react'

export function PropertyPhoto({ photo, title }: { photo?: string; title: string }) {
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photo} alt={title} loading="lazy" className="size-full object-cover" />
    )
  }

  return (
    <div className="flex size-full items-center justify-center bg-primary/5">
      <Home className="size-6 text-primary/40" />
    </div>
  )
}
