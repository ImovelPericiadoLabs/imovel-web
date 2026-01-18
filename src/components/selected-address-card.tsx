'use client'

import { MapPin } from 'lucide-react'

interface SelectedAddressCardProps {
  address: string
  className?: string
}

export default function SelectedAddressCard({ address, className = '' }: SelectedAddressCardProps) {
  if (!address) return null

  return (
    <div className={`bg-gray-50 p-4 rounded-lg border border-gray-100 flex gap-3 items-start ${className}`}>
      <MapPin className="size-5 text-primary shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-bold text-gray-700 mb-1">Endereço selecionado:</p>
        <p className="text-sm text-gray-600 leading-tight">{address}</p>
      </div>
    </div>
  )
}
