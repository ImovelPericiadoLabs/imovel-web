'use client'

import type { ComponentPropsWithoutRef } from 'react'
import { composeSectionTitle, type SurfaceVariant } from '@/styles/typography'
import { useTypographySurface } from '@/components/ui/surfaces'
import { cn } from '@/utils/tailwind'

type SectionTitleProps = ComponentPropsWithoutRef<'h2'> & {
  size?: 'default' | 'large'
  surface?: SurfaceVariant
}

export function SectionTitle({ className, size = 'default', surface, children, ...props }: SectionTitleProps) {
  const resolvedSurface = useTypographySurface(surface)

  return (
    <h2 className={cn(composeSectionTitle(size, resolvedSurface), className)} {...props}>
      {children}
    </h2>
  )
}
