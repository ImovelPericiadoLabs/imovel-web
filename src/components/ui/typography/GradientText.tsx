'use client'

import type { ComponentPropsWithoutRef } from 'react'
import { composeGradientText, type SurfaceVariant } from '@/styles/typography'
import { useTypographySurface } from '@/components/ui/surfaces'
import { cn } from '@/utils/tailwind'

type GradientTextProps = ComponentPropsWithoutRef<'span'> & {
  surface?: SurfaceVariant
}

export function GradientText({ className, surface, children, ...props }: GradientTextProps) {
  const resolvedSurface = useTypographySurface(surface)

  return (
    <span className={cn(composeGradientText(resolvedSurface), className)} {...props}>
      {children}
    </span>
  )
}
