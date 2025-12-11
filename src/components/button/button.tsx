import { cn } from '@/utils/tailwind'
import Link from 'next/link'
import { ComponentProps } from 'react'

type Props = {
  className?: string
  href?: string
  isLoading?: boolean
} & ComponentProps<'button'> & ComponentProps<typeof Link>

export default function Button({ children, className, href, isLoading, ...rest }: Props) {
  const baseClasses = cn(
    `
      cursor-pointer w-full bg-primary hover:bg-primary-hover text-white 
      text-base leading-6 font-semibold px-11 py-3 rounded-full shadow-lg
      disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-gray-300 disabled:shadow-none
      flex items-center justify-center transition-transform active:scale-95
    `,
    'touch-manipulation', 
    className
  )

  if (href && !rest.disabled && !isLoading) {
    return (
      <Link 
        href={href} 
        className={baseClasses}
        prefetch={true} 
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      {...rest}
      className={baseClasses}
      disabled={rest.disabled || isLoading}
    >
      {children}
    </button>
  )
}