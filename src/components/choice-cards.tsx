'use client'

import { Check, X as XIcon } from 'lucide-react'

export interface ChoiceCardsProps {
  value: boolean | undefined
  onChange: (hasInfo: boolean, event?: React.MouseEvent | React.TouchEvent) => void
  yesLabel?: string
  noLabel?: string
  yesSubtitle?: string
  noSubtitle?: string
  tone?: 'registration' | 'allotment' | 'block' | 'lot'
  className?: string
}

export function ChoiceCards({ 
  value, 
  onChange, 
  yesLabel = 'Tenho', 
  noLabel = 'Não Tenho',
  yesSubtitle = 'Aperte aqui se souber',
  noSubtitle = 'Aperte aqui se não souber',
  tone = 'registration',
  className = ''
}: ChoiceCardsProps) {
  const isSim = value === true
  const isNao = value === false
  const toneStyles = {
    registration: {
      activeCard: 'bg-primary/5 border-primary shadow-sm shadow-primary/10 ring-1 ring-primary/10',
      inactiveCard: 'bg-white border-gray-200 hover:border-primary/40',
      activeIcon: 'bg-primary',
      inactiveIcon: 'bg-gray-100',
      activeLabel: 'text-primary',
      inactiveLabel: 'text-dark',
      activeCheck: 'bg-primary',
    },
    allotment: {
      activeCard: 'bg-emerald-50 border-emerald-300 shadow-sm shadow-emerald-100 ring-1 ring-emerald-200/50',
      inactiveCard: 'bg-white border-gray-200 hover:border-emerald-300',
      activeIcon: 'bg-emerald-600',
      inactiveIcon: 'bg-emerald-50',
      activeLabel: 'text-emerald-700',
      inactiveLabel: 'text-dark',
      activeCheck: 'bg-emerald-600',
    },
    block: {
      activeCard: 'bg-amber-50 border-amber-300 shadow-sm shadow-amber-100 ring-1 ring-amber-200/50',
      inactiveCard: 'bg-white border-gray-200 hover:border-amber-300',
      activeIcon: 'bg-amber-600',
      inactiveIcon: 'bg-amber-50',
      activeLabel: 'text-amber-700',
      inactiveLabel: 'text-dark',
      activeCheck: 'bg-amber-600',
    },
    lot: {
      activeCard: 'bg-violet-50 border-violet-300 shadow-sm shadow-violet-100 ring-1 ring-violet-200/50',
      inactiveCard: 'bg-white border-gray-200 hover:border-violet-300',
      activeIcon: 'bg-violet-600',
      inactiveIcon: 'bg-violet-50',
      activeLabel: 'text-violet-700',
      inactiveLabel: 'text-dark',
      activeCheck: 'bg-violet-600',
    },
  }
  const styles = toneStyles[tone]

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={(e) => onChange(true, e)}
          onTouchStart={(e) => onChange(true, e)}
          className={`
            w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left
            focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10
            ${isSim 
              ? styles.activeCard 
              : styles.inactiveCard
            }
          `}
        >
          <div className={`size-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${isSim ? styles.activeIcon : styles.inactiveIcon}`}>
            <Check className={`size-6 ${isSim ? 'text-white' : 'text-gray-400'} stroke-[3px]`} />
          </div>
          <div className="flex flex-col flex-1">
            <span className={`text-base font-semibold ${isSim ? styles.activeLabel : styles.inactiveLabel}`}>{yesLabel}</span>
            <span className="text-xs text-gray-500">{yesSubtitle}</span>
          </div>
          {isSim && (
            <div className={`size-6 rounded-full flex items-center justify-center animate-in zoom-in duration-300 ${styles.activeCheck}`}>
              <Check className="size-4 text-white stroke-[3px]" />
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={(e) => onChange(false, e)}
          onTouchStart={(e) => onChange(false, e)}
          className={`
            w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left
            focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10
            ${isNao
              ? styles.activeCard 
              : styles.inactiveCard
            }
          `}
        >
          <div className={`size-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${isNao ? styles.activeIcon : styles.inactiveIcon}`}>
            <XIcon className={`size-6 ${isNao ? 'text-white' : 'text-gray-400'} stroke-[3px]`} />
          </div>
          <div className="flex flex-col flex-1">
            <span className={`text-base font-semibold ${isNao ? styles.activeLabel : styles.inactiveLabel}`}>{noLabel}</span>
            <span className="text-xs text-gray-500">{noSubtitle}</span>
          </div>
          {isNao && (
            <div className={`size-6 rounded-full flex items-center justify-center animate-in zoom-in duration-300 ${styles.activeCheck}`}>
              <Check className="size-4 text-white stroke-[3px]" />
            </div>
          )}
        </button>
      </div>
    </div>
  )
}
