'use client'

import { MapPin } from 'lucide-react'

interface SelectedAddressCardProps {
  address: string
  className?: string
}

export default function SelectedAddressCard({ address, className = '' }: SelectedAddressCardProps) {
  if (!address) return null

  return (
    <div className={`bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex gap-4 items-start ${className}`}>
      <div className="p-2 bg-primary/5 rounded-xl">
        <MapPin className="size-5 text-primary shrink-0" />
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Endereço selecionado</p>
        <p className="text-sm font-semibold text-dark leading-snug">{address}</p>
      </div>
    </div>
  )
}
