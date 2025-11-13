'use client'

import type { ElementType } from 'react'
import { cn } from '@/utils/tailwind'

interface OptionCardProps {
  icon: ElementType
  title: string
  subtitle: string
  onClick: () => void
  isSelected: boolean
}

/**
 * Componente de card reutilizável para seleção de opções.
 * Usado nas etapas de confirmação e tipo de documento.
 */
export default function OptionCard({
  icon: Icon,
  title,
  subtitle,
  onClick,
  isSelected,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="option-card"
      className={cn(
        'flex items-center gap-4 p-4 bg-white rounded-lg border border-[#E7E7E7] cursor-pointer transition-all duration-200 h-full',
        'shadow-[0_1px_2px_rgba(10,13,18,0.05)]',
        'h-full',
        'text-left',
        isSelected
          ? 'border-primary ring-2 ring-primary/20'
          : 'hover:border-gray-300',
      )}
    >
      <Icon className={cn('size-6 shrink-0 text-dark')} />

      <div className="flex-1 min-w-0">
        <h3 className="text-base font-medium text-dark">{title}</h3>
        <p className="text-xs font-normal text-gray">{subtitle}</p>
      </div>
    </button>
  )
}