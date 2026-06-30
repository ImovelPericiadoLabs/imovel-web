'use client'

import type { ComponentPropsWithoutRef } from 'react'
import { composeSectionDescription, type SurfaceVariant } from '@/styles/typography'
import { useTypographySurface } from '@/components/ui/surfaces'
import { cn } from '@/utils/tailwind'

type SectionDescriptionProps = ComponentPropsWithoutRef<'p'> & {
  surface?: SurfaceVariant
}

export function SectionDescription({ className, surface, children, ...props }: SectionDescriptionProps) {
  const resolvedSurface = useTypographySurface(surface)

  return (
    <p className={cn(composeSectionDescription(resolvedSurface), className)} {...props}>
      {children}
    </p>
  )
}
