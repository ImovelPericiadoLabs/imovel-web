'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/utils/tailwind'

type Props = {
  text: string
  className?: string
}

export function RollingTitle({ text, className }: Props) {
  const [display, setDisplay] = useState(text)
  const [outgoing, setOutgoing] = useState<string | null>(null)
  const prev = useRef(text)

  useEffect(() => {
    if (text === prev.current) return
    setOutgoing(prev.current)
    prev.current = text
    setDisplay(text)
    const id = window.setTimeout(() => setOutgoing(null), 420)
    return () => window.clearTimeout(id)
  }, [text])

  return (
    <div
      className={cn('relative h-7 overflow-hidden', className)}
      aria-live="polite"
      aria-atomic="true"
    >
      {outgoing ? (
        <span
          className={cn(
            'absolute inset-x-0 top-0 block truncate text-sm font-semibold leading-7 journey-roll-out',
            className,
          )}
        >
          {outgoing}
        </span>
      ) : null}
      <span
        className={cn(
          'absolute inset-x-0 top-0 block truncate text-sm font-semibold leading-7',
          outgoing ? 'journey-roll-in' : '',
          className,
        )}
      >
        {display}
      </span>
    </div>
  )
}
