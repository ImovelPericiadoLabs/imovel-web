import { cn } from '@/utils/tailwind'
type Props = {
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>

export default function Button({ children, className, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={cn(
        `
          cursor-pointer w-full bg-primary hover:bg-primary-hover text-white 
          text-base leading-6 font-semibold px-11 py-3 rounded-full shadow-lg
          disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-gray-300 disabled:shadow-none
        `,
        className,
      )}
    >
      {children}
    </button>
  )
}
