'use client'

import type { ComponentPropsWithoutRef } from 'react'
import { composeEyebrowText, type SurfaceVariant } from '@/styles/typography'
import { useTypographySurface } from '@/components/ui/surfaces'
import { cn } from '@/utils/tailwind'

type EyebrowTextProps = ComponentPropsWithoutRef<'span'> & {
  surface?: SurfaceVariant
}

export function EyebrowText({ className, surface, children, ...props }: EyebrowTextProps) {
  const resolvedSurface = useTypographySurface(surface)

  return (
    <span className={cn(composeEyebrowText(resolvedSurface), className)} {...props}>
      {children}
    </span>
  )
}
