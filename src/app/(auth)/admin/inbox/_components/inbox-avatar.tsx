'use client'

import { cn } from '@/utils/tailwind'
import { initialsOf } from './inbox-helpers'

const sizeMap = {
  xs: 'h-6 w-6 text-[9px]',
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-11 w-11 text-xs',
} as const

type Props = {
  name: string
  size?: keyof typeof sizeMap
  className?: string
  online?: boolean
}

export function InboxAvatar({ name, size = 'md', className, online }: Props) {
  return (
    <div className={cn('relative shrink-0', className)}>
      <div
        className={cn(
          'flex items-center justify-center overflow-hidden rounded-full font-semibold',
          'bg-[rgba(113,50,245,0.14)] text-[#5741d8]',
          sizeMap[size],
        )}
        aria-hidden
      >
        {initialsOf(name)}
      </div>
      {online ? (
        <span
          className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-[#149E61]"
          aria-hidden
        />
      ) : null}
    </div>
  )
}
