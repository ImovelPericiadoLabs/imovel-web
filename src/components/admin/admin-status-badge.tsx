import { cn } from '@/utils/tailwind'

type Variant = 'active' | 'inactive' | 'neutral'

const STYLES: Record<Variant, string> = {
  active: 'bg-[rgba(20,158,97,0.16)] text-[#026b3f] border-transparent',
  inactive: 'bg-[#FEF3F2] text-[#D92D20] border-[#FEE4E2]',
  neutral: 'bg-[rgba(104,107,130,0.12)] text-[#484b5e] border-transparent',
}

type Props = {
  variant: Variant
  children: React.ReactNode
  className?: string
}

export default function AdminStatusBadge({ variant, children, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold',
        STYLES[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
