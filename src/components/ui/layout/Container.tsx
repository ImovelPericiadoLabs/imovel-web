import type { ComponentPropsWithoutRef } from 'react'
import { composeContainer } from '@/styles/layout'
import { cn } from '@/utils/tailwind'

type ContainerProps = ComponentPropsWithoutRef<'div'> & {
  size?: 'flow' | 'page' | 'full'
}

export function Container({ className, size = 'flow', children, ...props }: ContainerProps) {
  return (
    <div className={cn(composeContainer(size), className)} {...props}>
      {children}
    </div>
  )
}
