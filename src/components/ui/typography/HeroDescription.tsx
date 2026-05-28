'use client'

import type { ComponentPropsWithoutRef } from 'react'
import { composeHeroDescription, type SurfaceVariant } from '@/styles/typography'
import { useTypographySurface } from '@/components/ui/surfaces'
import { cn } from '@/utils/tailwind'

type HeroDescriptionProps = ComponentPropsWithoutRef<'p'> & {
  kind?: 'subtitle' | 'body'
  surface?: SurfaceVariant
}

export function HeroDescription({
  className,
  kind = 'subtitle',
  surface,
  children,
  ...props
}: HeroDescriptionProps) {
  const resolvedSurface = useTypographySurface(surface)

  return (
    <p className={cn(composeHeroDescription(kind, resolvedSurface), className)} {...props}>
      {children}
    </p>
  )
}
