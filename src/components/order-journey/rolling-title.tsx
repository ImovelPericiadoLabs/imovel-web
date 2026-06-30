'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/utils/tailwind'

const LINE_PX = 28
const DURATION_MS = 560

type Props = {
  text: string
  className?: string
}

export function RollingTitle({ text, className }: Props) {
  const [rolling, setRolling] = useState(false)
  const [fromText, setFromText] = useState(text)
  const [toText, setToText] = useState(text)
  const shown = useRef(text)

  useEffect(() => {
    if (text === shown.current) return

    setFromText(shown.current)
    setToText(text)
    shown.current = text

    let frame2 = 0
    const frame1 = window.requestAnimationFrame(() => {
      frame2 = window.requestAnimationFrame(() => setRolling(true))
    })

    const stop = window.setTimeout(() => setRolling(false), DURATION_MS)

    return () => {
      window.cancelAnimationFrame(frame1)
      window.cancelAnimationFrame(frame2)
      window.clearTimeout(stop)
    }
  }, [text])

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ height: LINE_PX }}
      aria-live="polite"
      aria-atomic="true"
    >
      {rolling ? (
        <div
          key={`${fromText}→${toText}`}
          className="journey-roll-strip flex flex-col will-change-transform"
        >
          <span className="block h-7 shrink-0 truncate text-sm font-semibold leading-7">
            {fromText}
          </span>
          <span className="block h-7 shrink-0 truncate text-sm font-semibold leading-7">
            {toText}
          </span>
        </div>
      ) : (
        <span className="block h-7 truncate text-sm font-semibold leading-7">
          {toText}
        </span>
      )}
    </div>
  )
}
