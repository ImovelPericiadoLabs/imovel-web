import Link, { LinkProps } from 'next/link'
import { cn } from '@/utils/tailwind'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & 
  Partial<LinkProps> & {
    href?: string
    className?: string
  }

export default function Button({ children, className, href, ...rest }: ButtonProps) {
  
  const baseClasses = cn(
    `
      cursor-pointer w-full bg-primary hover:bg-primary-hover text-white 
      text-base leading-6 font-semibold px-11 py-3 rounded-full shadow-lg
      disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-gray-300 disabled:shadow-none
      flex items-center justify-center text-center decoration-0
    `,
    className
  )

  if (href) {
    return (
      <Link 
        href={href} 
        className={baseClasses}
        {...(rest as Omit<LinkProps, 'href'>)} 
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      className={baseClasses}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  )
}