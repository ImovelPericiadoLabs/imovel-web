import { PropsWithChildren } from 'react'
import { cn } from '@/utils/tailwind'

type Props = {
  className?: string
} & PropsWithChildren

export default function TextSubtitle({ className, children }: Props) {
  return <h1 className={cn('text-sm font-normal text-gray-2 leading-4', className)}>{children}</h1>
}
