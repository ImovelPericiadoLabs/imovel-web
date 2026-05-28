'use client'

import type { ComponentPropsWithoutRef } from 'react'
import { composeHeroTitle, type HeroTitleVariant, type SurfaceVariant } from '@/styles/typography'
import { useTypographySurface } from '@/components/ui/surfaces'
import { cn } from '@/utils/tailwind'

type HeroTitleProps = ComponentPropsWithoutRef<'h1'> & {
  variant?: HeroTitleVariant
  surface?: SurfaceVariant
}

export function HeroTitle({ className, variant = 'primary', surface, children, ...props }: HeroTitleProps) {
  const resolvedSurface = useTypographySurface(surface)

  return (
    <h1 className={cn(composeHeroTitle(variant, resolvedSurface), className)} {...props}>
      {children}
    </h1>
  )
}
