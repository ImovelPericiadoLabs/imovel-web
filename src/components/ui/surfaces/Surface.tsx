'use client'

import type { ComponentPropsWithoutRef } from 'react'
import type { SurfaceVariant } from '@/styles/contrast'
import { accentSurface, glassSurface, lightSectionSurface } from '@/styles/surfaces'
import { cn } from '@/utils/tailwind'
import { SurfaceContext } from './SurfaceContext'

type SurfaceProps = ComponentPropsWithoutRef<'div'> & {
  variant: SurfaceVariant
  as?: 'div' | 'section'
}

const variantClass: Record<SurfaceVariant, string> = {
  dark: 'bg-transparent',
  light: lightSectionSurface,
  glass: glassSurface,
  accent: accentSurface,
}

export function Surface({ variant, as: Tag = 'div', className, children, ...props }: SurfaceProps) {
  return (
    <SurfaceContext.Provider value={variant}>
      <Tag className={cn(variantClass[variant], className)} {...props}>
        {children}
      </Tag>
    </SurfaceContext.Provider>
  )
}
