import { cn } from '@/utils/tailwind'
type Props = {
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>

export default function Button({ children, className, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={cn(
        'cursor-pointer w-full bg-primary hover:bg-primary-hover text-white text-base leading-6 font-semibold px-11 py-3 rounded-full shadow-lg',
        className,
      )}
    >
      {children}
    </button>
  )
}
