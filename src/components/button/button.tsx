import Link, { LinkProps } from 'next/link'
import { cn } from '@/utils/tailwind'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & 
  Partial<LinkProps> & {
    href?: string
    className?: string
    variant?: 'primary' | 'outline'
  }

export default function Button({ children, className, href, variant = 'primary', ...rest }: ButtonProps) {
  
  const variants = {
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-lg',
    outline: 'bg-transparent border border-primary text-primary hover:bg-primary/5'
  }

  const baseClasses = cn(
    `
      cursor-pointer w-full 
      text-base leading-6 font-semibold px-11 py-3 rounded-full 
      disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-gray-300 disabled:shadow-none
      flex items-center justify-center text-center decoration-0
    `,
    variants[variant],
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