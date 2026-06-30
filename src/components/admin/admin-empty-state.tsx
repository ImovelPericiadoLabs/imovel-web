import type { ReactNode } from 'react'
import Image from 'next/image'
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
        'flex flex-col items-center justify-center px-6 py-14 text-center',
        'bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(133,91,251,0.08),transparent)]',
        className,
      )}
    >
      <div className="relative mb-4 flex size-14 items-center justify-center rounded-2xl bg-[rgba(133,91,251,0.12)] ring-1 ring-[rgba(113,50,245,0.2)]">
        {icon ?? (
          <Image src="/images/logo.svg" alt="" width={28} height={28} className="opacity-40" />
        )}
      </div>
      <p className="text-sm font-bold text-[#101114]">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-[#686b82]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
