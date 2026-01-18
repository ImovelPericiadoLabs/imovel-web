'use client'

import { MapPin, Building, LucideIcon } from 'lucide-react'
import { cn } from '@/utils/tailwind'

interface SummaryItem {
  icon?: LucideIcon
  title: string
  value: string
  key: string
}

interface AddressSummaryCardProps {
  address: string
  registrationNumber?: string
  allotment?: string
  block?: string
  lot?: string
  className?: string
}

export default function AddressSummaryCard({
  address,
  registrationNumber,
  allotment,
  block,
  lot,
  className
}: AddressSummaryCardProps) {
  const details: SummaryItem[] = [
    { key: 'registrationNumber', title: 'Matrícula', value: registrationNumber || '' },
    { key: 'allotment', title: 'Loteamento', value: allotment || '' },
    { key: 'block', title: 'Quadra', value: block || '' },
    { key: 'lot', title: 'Lote', value: lot || '' },
  ].filter(item => !!item.value)

  const hasDetails = details.length > 0

  return (
    <div className={cn(
      "bg-white/90 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-left animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm",
      className
    )}>
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="shrink-0 p-1.5 bg-primary/10 rounded-lg">
            <MapPin className="size-4 text-primary" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Endereço selecionado</span>
            <p className="text-sm font-semibold text-dark leading-tight break-words">
              {address || 'Endereço não informado'}
            </p>
          </div>
        </div>

        {hasDetails && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 pt-3 border-t border-gray-100">
            {details.map((item) => (
              <div key={item.key} className="flex flex-col">
                <span className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1">{item.title}</span>
                <span className="text-xs font-bold text-dark leading-tight">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
