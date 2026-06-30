'use client'

import { Info } from 'lucide-react'
import { ReactNode } from 'react'

interface InfoCardProps {
  children: ReactNode
  className?: string
}

export default function InfoCard({ children, className = '' }: InfoCardProps) {
  return (
    <div className={`bg-primary/5 border border-primary/10 rounded-xl p-4 flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500 ${className}`}>
      <div className="shrink-0">
        <div className="p-1.5 bg-primary/10 rounded-lg">
          <Info className="size-4 text-primary" />
        </div>
      </div>
      <p className="text-[12px] leading-relaxed text-gray-600 font-medium">
        {children}
      </p>
    </div>
  )
}
