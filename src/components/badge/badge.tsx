import { cn } from '@/utils/tailwind'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center justify-center gap-2 border font-medium uppercase tracking-wider w-fit',
  {
    variants: {
      size: {
        sm: 'text-[0.625rem] px-[0.5rem] py-[0.125rem] rounded-[0.625rem]',
        md: 'text-[0.75rem] px-3 py-1 rounded-[5rem]',
        lg: 'text-[0.875rem] px-[1rem] py-[0.375rem] rounded-[1rem]',
        xl: 'text-[1rem] px-[1.25rem] py-[0.5rem] rounded-[1.25rem]',
      },
      variant: {
        success: 'border-[#04A13A] text-[#04A13A]',
        info: 'border-[#3BE2C259] text-[#3BE2C2]',
        warning: 'text-[#FF9500] border-[#FF9500]',
        danger: 'border-[#FF3B30] text-[#FF3B30]',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'info',
    },
  },
)

type Props = {
  children: React.ReactNode
  className?: string
}

export default function Badge({
  children,
  className,
  size,
  variant,
}: Props & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ size, variant, className }))}>{children}</div>
}
