'use client'

import { Check, X as XIcon } from 'lucide-react'

export interface ChoiceCardsProps {
  value: boolean | undefined
  onChange: (hasInfo: boolean) => void
  yesLabel?: string
  noLabel?: string
  yesSubtitle?: string
  noSubtitle?: string
}

export function ChoiceCards({ 
  value, 
  onChange, 
  yesLabel = 'Tenho', 
  noLabel = 'Não Tenho',
  yesSubtitle = 'Eu possuo esta informação',
  noSubtitle = 'Não possuo ou não sei'
}: ChoiceCardsProps) {
  const isSim = value === true
  const isNao = value === false

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`
            w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left
            ${isSim 
              ? 'bg-primary/5 border-primary shadow-sm shadow-primary/10' 
              : 'bg-white border-gray-200 hover:border-gray-300'
            }
          `}
        >
          <div className={`size-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${isSim ? 'bg-primary' : 'bg-gray-100'}`}>
            <Check className={`size-6 ${isSim ? 'text-white' : 'text-gray-400'} stroke-[3px]`} />
          </div>
          <div className="flex flex-col flex-1">
            <span className={`text-base font-semibold ${isSim ? 'text-primary' : 'text-dark'}`}>{yesLabel}</span>
            <span className="text-xs text-gray-500">{yesSubtitle}</span>
          </div>
          {isSim && (
            <div className="size-6 bg-primary rounded-full flex items-center justify-center animate-in zoom-in duration-300">
              <Check className="size-4 text-white stroke-[3px]" />
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => onChange(false)}
          className={`
            w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left
            ${isNao
              ? 'bg-primary/5 border-primary shadow-sm shadow-primary/10' 
              : 'bg-white border-gray-200 hover:border-gray-300'
            }
          `}
        >
          <div className={`size-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${isNao ? 'bg-primary' : 'bg-gray-100'}`}>
            <XIcon className={`size-6 ${isNao ? 'text-white' : 'text-gray-400'} stroke-[3px]`} />
          </div>
          <div className="flex flex-col flex-1">
            <span className={`text-base font-semibold ${isNao ? 'text-primary' : 'text-dark'}`}>{noLabel}</span>
            <span className="text-xs text-gray-500">{noSubtitle}</span>
          </div>
          {isNao && (
            <div className="size-6 bg-primary rounded-full flex items-center justify-center animate-in zoom-in duration-300">
              <Check className="size-4 text-white stroke-[3px]" />
            </div>
          )}
        </button>
      </div>
    </div>
  )
}
