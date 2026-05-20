import type { ReactNode } from 'react'
import { cn } from '@/utils/tailwind'

type Props = {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export default function AdminEmptyState({
  title,
  description,
  icon,
  action,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#dedee5] bg-[rgba(148,151,169,0.04)] px-6 py-12 text-center',
        className,
      )}
    >
      {icon && <div className="mb-3 text-[#7132f5]">{icon}</div>}
      <p className="text-sm font-semibold text-[#101114]">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-[#686b82]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
