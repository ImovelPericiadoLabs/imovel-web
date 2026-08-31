'use client'

import { useFormContext } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { QrCode, CreditCard, Barcode, DollarSign, LucideIcon, Check, TriangleAlert } from 'lucide-react'
import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'
import {
  consultFlowHeroBlockClass,
  consultFlowHeroSubtitleClass,
  consultFlowHeroTitleClass,
  consultFlowHeroTitleSizePrimaryClass,
} from '@/constants/consult-flow-hero-text'
import { queryKey } from '@/constants/queries'
import { cn } from '@/utils/tailwind'
import { Switch } from '@/components/switch'
import { trackGtmEvent } from '@/utils/analytics/gtm'
import { getPaymentMethods, type CheckoutBillingType } from '@/services/payments'
import { getMe } from '@/services/account'
import { useConsultDynamicPrice, type EntryPath } from '@/hooks/use-consult-price'
import type { FormTypes } from '@/sections/consult-property/validations'

type PaymentMethodType = 'pix' | 'credit_card' | 'debit_card' | 'boleto'

interface PaymentOption {
  id: PaymentMethodType
  code: CheckoutBillingType
  title: string
  subtitle: string
  icon: LucideIcon
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  { id: 'pix', code: 'PIX', title: 'Pix', subtitle: 'Aprovação imediata', icon: QrCode },
  { id: 'credit_card', code: 'CREDIT_CARD', title: 'Cartão de Crédito', subtitle: 'Em até 12x', icon: CreditCard },
  { id: 'debit_card', code: 'DEBIT_CARD', title: 'Cartão de Débito', subtitle: 'Transferência instantânea', icon: CreditCard },
  { id: 'boleto', code: 'BOLETO', title: 'Boleto', subtitle: 'Vencimento em 3 dias úteis', icon: Barcode },
]

export function PaymentStep({
  currentBalance,
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
  const { setValue, watch } = useFormContext<FormTypes>()
  const { status } = useSession()
  const useBalance = Boolean(watch('useBalance'))
  const paymentMethod = watch('paymentMethod')
  const entryPath = watch('entryPath') as EntryPath | undefined
  const includeCertificates = Boolean(watch('includeCertificates'))
  const { payable } = useConsultDynamicPrice({ entryPath, includeCertificates })

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: status === 'authenticated',
  })
  const { data: catalog } = useQuery({
    queryKey: [queryKey.paymentMethods],
    queryFn: getPaymentMethods,
    staleTime: 30_000,
  })

  const balance = currentBalance ?? Number(me?.credits_balance ?? 0)
  const canUseBalance = balance > 0 && balance >= payable

  const formattedBalance = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(balance)

  function isAvailable(code: CheckoutBillingType): boolean {
    const row = catalog?.methods?.find((item) => item.code === code)
    return row ? row.available : true
  }

  function handleSelectMethod(value: PaymentMethodType, code: CheckoutBillingType) {
    if (!isAvailable(code)) return

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
    if (checked && !canUseBalance) return
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
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="p-2 bg-gray-50 rounded-xl text-gray-600 shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-gray-900">Saldo em conta</span>
                <span className="text-sm text-gray-500 truncate">{formattedBalance}</span>
              </div>
            </div>
            <Switch
              checked={useBalance && canUseBalance}
              disabled={!canUseBalance}
              onCheckedChange={toggleBalance}
              aria-label="Usar saldo em conta"
            />
          </div>

          {PAYMENT_OPTIONS.map((option) => {
            const available = isAvailable(option.code)
            const isSelected = available && paymentMethod === option.id
            const Icon = option.icon
            return (
              <button
                key={option.id}
                type="button"
                data-testid={`option-${option.title}`}
                disabled={!available}
                aria-disabled={!available}
                onClick={() => handleSelectMethod(option.id, option.code)}
                className={cn(
                  'w-full flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl border text-left transition-all duration-200',
                  !available && 'cursor-not-allowed bg-gray-50 border-gray-100 opacity-70',
                  available && isSelected && 'bg-primary/5 border-primary shadow-sm shadow-primary/10',
                  available && !isSelected && 'bg-white border-gray-200 hover:border-gray-300',
                )}
              >
                <div
                  className={cn(
                    'size-10 rounded-full flex items-center justify-center shrink-0 transition-colors',
                    !available && 'bg-amber-50',
                    available && isSelected && 'bg-primary',
                    available && !isSelected && 'bg-gray-100',
                  )}
                >
                  {!available ? (
                    <TriangleAlert className="size-5 text-amber-600" aria-hidden />
                  ) : isSelected ? (
                    <Check className="size-6 text-white stroke-[3px]" />
                  ) : (
                    <Icon className="size-5 text-gray-500" />
                  )}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className={`text-base font-semibold ${isSelected ? 'text-primary' : 'text-dark'}`}>
                    {option.title}
                  </span>
                  <span className={cn('text-xs', available ? 'text-gray-500' : 'text-amber-700')}>
                    {available ? option.subtitle : 'Indisponível'}
                  </span>
                </div>
                {isSelected && (
                  <div className="size-6 bg-primary rounded-full flex items-center justify-center animate-in zoom-in duration-300 shrink-0">
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
