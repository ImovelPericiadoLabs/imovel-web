import { cn } from '@/utils/tailwind'

type Variant = 'active' | 'inactive' | 'neutral' | 'warning' | 'brand'

const STYLES: Record<Variant, string> = {
  active: 'bg-[rgba(20,158,97,0.16)] text-[#026b3f]',
  inactive: 'bg-[#FEF3F2] text-[#D92D20] ring-1 ring-[#FEE4E2]',
  neutral: 'bg-[rgba(104,107,130,0.12)] text-[#484b5e]',
  warning: 'bg-amber-50 text-amber-950 ring-1 ring-amber-200/80',
  brand: 'bg-[rgba(133,91,251,0.12)] text-[#5741d8]',
}

type Props = {
  variant: Variant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

export default function AdminStatusBadge({ variant, children, className, dot }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        STYLES[variant],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'size-1.5 rounded-full',
            variant === 'active' && 'bg-[#149e61]',
            variant === 'warning' && 'bg-amber-500',
            variant === 'brand' && 'bg-[#7132f5]',
          )}
          aria-hidden
        />
      )}
      {children}
    </span>
  )
}
