import { cn } from '@/utils/tailwind'

export default function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-neutral-500 animate-pulse', className)}
      {...props}
    />
  )
}
