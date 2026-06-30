'use client'

import type { ComponentPropsWithoutRef } from 'react'
import { composeLeadText, type SurfaceVariant } from '@/styles/typography'
import { useTypographySurface } from '@/components/ui/surfaces'
import { cn } from '@/utils/tailwind'

type LeadTextProps = ComponentPropsWithoutRef<'span'> & {
  surface?: SurfaceVariant
}

export function LeadText({ className, surface, children, ...props }: LeadTextProps) {
  const resolvedSurface = useTypographySurface(surface)

  return (
    <span className={cn(composeLeadText(resolvedSurface), className)} {...props}>
      {children}
    </span>
  )
}
