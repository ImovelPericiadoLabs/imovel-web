import { PropsWithChildren } from 'react'
import { cn } from '@/utils/tailwind'

type Props = {
  className?: string
} & PropsWithChildren

export default function TextTitle({ className, children }: Props) {
  return <h1 className={cn('text-lg font-bold text-white leading-6', className)}>{children}</h1>
}
