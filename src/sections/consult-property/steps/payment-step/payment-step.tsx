'use client'

import { useFormContext } from 'react-hook-form'
import { QrCode, CreditCard, Barcode, DollarSign, LucideIcon, Check } from 'lucide-react'
import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'
import {
  consultFlowHeroBlockClass,
  consultFlowHeroSubtitleClass,
  consultFlowHeroTitleClass,
  consultFlowHeroTitleSizePrimaryClass,
} from '@/constants/consult-flow-hero-text'
import { cn } from '@/utils/tailwind'
import { Switch } from '@/components/switch'
import { trackGtmEvent } from '@/utils/analytics/gtm'

type PaymentMethodType = 'pix' | 'credit_card' | 'debit_card' | 'boleto'

interface PaymentOption {
  id: PaymentMethodType
  title: string
  subtitle: string
  icon: LucideIcon
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  { id: 'pix', title: 'Pix', subtitle: 'Aprovação imediata', icon: QrCode },
  { id: 'credit_card', title: 'Cartão de Crédito', subtitle: 'Em até 12x', icon: CreditCard },
  { id: 'debit_card', title: 'Cartão de Débito', subtitle: 'Transferência instantânea', icon: CreditCard },
  { id: 'boleto', title: 'Boleto', subtitle: 'Vencimento em 3 dias úteis', icon: Barcode },
]

export function PaymentStep({
  currentBalance = 240.0,
  onPix,
  onCredit,
  onDebit,
  onBoleto,
}: {
  currentBalance?: number
  onPix: () => void
  onCredit: () => void
  onDebit: () => void
  onBoleto: () => void
}) {
  const { setValue, watch } = useFormContext()
  const useBalance = watch('useBalance')
  const paymentMethod = watch('paymentMethod')

  const formattedBalance = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(currentBalance)

  function handleSelectMethod(value: PaymentMethodType) {
    setValue('paymentMethod', value, { shouldValidate: true })

    trackGtmEvent('payment_method_selected', {
      event_category: 'payment',
      event_label: value,
      event_description: 'Método de pagamento selecionado.',
      payment_method: value,
      use_balance: Boolean(useBalance),
    })

    setTimeout(() => {
      if (value === 'pix') return onPix()
      if (value === 'credit_card') return onCredit()
      if (value === 'debit_card') return onDebit()
      if (value === 'boleto') return onBoleto()
    }, 300)
  }

  function toggleBalance(checked: boolean) {
    setValue('useBalance', checked)
    trackGtmEvent('payment_balance_toggle', {
      event_category: 'payment',
      event_label: checked ? 'on' : 'off',
      event_description: 'Usuário ativou/desativou o uso de saldo.',
      use_balance: checked,
    })
  }

  return (
    <div className="relative flex-1 px-4">
      <div className="flex flex-col gap-5 pb-24 md:pb-0">
        <div className={cn(consultFlowHeroBlockClass, 'px-1')}>
          <TextTitle className={cn(consultFlowHeroTitleClass, consultFlowHeroTitleSizePrimaryClass)}>
            Escolha como pagar
          </TextTitle>
          <TextSubtitle className={consultFlowHeroSubtitleClass}>
            Selecione o método de pagamento de sua preferência
          </TextSubtitle>
        </div>

        <div className="flex flex-col gap-3">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gray-50 rounded-xl text-gray-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900">Saldo em conta</span>
                <span className="text-sm text-gray-500">{formattedBalance}</span>
              </div>
            </div>
            <Switch checked={useBalance} onCheckedChange={toggleBalance} />
          </div>

          {PAYMENT_OPTIONS.map((option) => {
            const isSelected = paymentMethod === option.id
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectMethod(option.id)}
                className={`
                  w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left
                  ${isSelected
                    ? 'bg-primary/5 border-primary shadow-sm shadow-primary/10'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className={`size-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-primary' : 'bg-gray-100'}`}>
                  <Check className={`size-6 ${isSelected ? 'text-white' : 'text-gray-400'} stroke-[3px]`} />
                </div>
                <div className="flex flex-col flex-1">
                  <span className={`text-base font-semibold ${isSelected ? 'text-primary' : 'text-dark'}`}>{option.title}</span>
                  <span className="text-xs text-gray-500">{option.subtitle}</span>
                </div>
                {isSelected && (
                  <div className="size-6 bg-primary rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                    <Check className="size-4 text-white stroke-[3px]" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
