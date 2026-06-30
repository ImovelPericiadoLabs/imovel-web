import type { ComponentPropsWithoutRef } from 'react'
import { centeredContent } from '@/styles/layout'
import { cn } from '@/utils/tailwind'

type CenteredContentProps = ComponentPropsWithoutRef<'div'> & {
  variant?: 'default' | 'hero' | 'heroBlock'
}

export function CenteredContent({
  className,
  variant = 'default',
  children,
  ...props
}: CenteredContentProps) {
  const variantClass =
    variant === 'hero' ? centeredContent.hero : variant === 'heroBlock' ? centeredContent.heroBlock : centeredContent.base

  return (
    <div className={cn(variantClass, className)} {...props}>
      {children}
    </div>
  )
}
