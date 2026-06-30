import type { ComponentPropsWithoutRef } from 'react'
import { section } from '@/styles/layout'
import { cn } from '@/utils/tailwind'

type SectionProps = ComponentPropsWithoutRef<'section'> & {
  gap?: 'sm' | 'md' | 'lg'
}

export function Section({ className, gap = 'md', children, ...props }: SectionProps) {
  const gapClass = gap === 'sm' ? section.gapSm : gap === 'lg' ? section.gapLg : section.gapMd

  return (
    <section className={cn(section.base, gapClass, className)} {...props}>
      {children}
    </section>
  )
}
