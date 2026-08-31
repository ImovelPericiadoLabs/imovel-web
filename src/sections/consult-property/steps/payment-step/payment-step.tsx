'use client'

import { useFormContext } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { CreditCard } from 'lucide-react'
import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'
import {
  consultFlowHeroBlockClass,
  consultFlowHeroSubtitleClass,
  consultFlowHeroTitleClass,
  consultFlowHeroTitleSizeLargeClass,
} from '@/constants/consult-flow-hero-text'
import { queryKey } from '@/constants/queries'
import { cn } from '@/utils/tailwind'
import { trackGtmEvent } from '@/utils/analytics/gtm'
import { getPaymentMethods, type CheckoutBillingType } from '@/services/payments'
import { getMe } from '@/services/account'
import { useConsultDynamicPrice, type EntryPath } from '@/hooks/use-consult-price'
import {
  BoletoMethodIcon,
  CreditCardMethodIcon,
  PixMethodIcon,
  WalletBalanceIcon,
} from '@/components/icons/payment-method-icons'
import { PaymentMethodCard, type StatusTone } from './payment-method-card'
import type { FormTypes } from '@/sections/consult-property/validations'

type PaymentMethodType = FormTypes['paymentMethod']

const GATEWAY_OPTIONS: Array<{
  id: Exclude<PaymentMethodType, 'credits'>
  code: CheckoutBillingType
  title: string
  availableStatus: string
  availableTone: StatusTone
  description: string
  icon: typeof PixMethodIcon
}> = [
  {
    id: 'pix',
    code: 'PIX',
    title: 'Pix',
    availableStatus: 'Aprovação imediata',
    availableTone: 'ok',
    description: 'Pague com Pix',
    icon: PixMethodIcon,
  },
  {
    id: 'credit_card',
    code: 'CREDIT_CARD',
    title: 'Cartão',
    availableStatus: 'Crédito ou débito · em até 12x',
    availableTone: 'info',
    description: 'O link seguro aceita crédito e débito',
    icon: CreditCardMethodIcon,
  },
  {
    id: 'boleto',
    code: 'BOLETO',
    title: 'Boleto',
    availableStatus: '',
    availableTone: 'muted',
    description: 'Vencimento em 3 dias úteis',
    icon: BoletoMethodIcon,
  },
]

const UNAVAILABLE_STATUS = 'Instabilidade temporária'
const UNAVAILABLE_DESCRIPTION = 'Instabilidade temporária com o banco. Tente outro método.'

export function PaymentStep({
  currentBalance,
  onPix,
  onCredit,
  onBoleto,
  onCredits,
}: {
  currentBalance?: number
  onPix: () => void
  onCredit: () => void
  onBoleto: () => void
  onCredits: () => void
}) {
  const { setValue, watch } = useFormContext<FormTypes>()
  const { status } = useSession()
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
  const showBalanceOption = status === 'authenticated' || typeof currentBalance === 'number'

  const formattedBalance = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(balance)

  function isAvailable(code: CheckoutBillingType): boolean {
    const row = catalog?.methods?.find((item) => item.code === code)
    return row ? row.available : true
  }

  function goToConfirm(value: PaymentMethodType) {
    if (value === 'credits') return onCredits()
    if (value === 'pix') return onPix()
    if (value === 'credit_card' || value === 'debit_card') return onCredit()
    return onBoleto()
  }

  function handleSelectMethod(value: PaymentMethodType, code?: CheckoutBillingType) {
    if (value === 'credits') {
      if (!canUseBalance) return
      setValue('useBalance', true)
    } else {
      if (code && !isAvailable(code)) return
      setValue('useBalance', false)
    }

    setValue('paymentMethod', value, { shouldValidate: true })

    trackGtmEvent('payment_method_selected', {
      event_category: 'payment',
      event_label: value,
      event_description: 'Método de pagamento selecionado.',
      payment_method: value,
      use_balance: value === 'credits',
    })

    window.setTimeout(() => goToConfirm(value), 280)
  }

  const gridOptions = GATEWAY_OPTIONS.filter((option) => option.id !== 'boleto')
  const boleto = GATEWAY_OPTIONS.find((option) => option.id === 'boleto')

  return (
    <div className="relative flex-1 px-3 sm:px-4">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 pb-24 md:max-w-2xl md:pb-8">
        <div className={cn(consultFlowHeroBlockClass, 'items-center px-1 text-center md:items-start md:text-left')}>
          <CreditCard className="mb-1 hidden size-6 text-white/90 md:block" aria-hidden />
          <TextTitle className={cn(consultFlowHeroTitleClass, consultFlowHeroTitleSizeLargeClass, 'w-full')}>
            Escolha como pagar
          </TextTitle>
          <TextSubtitle className={cn(consultFlowHeroSubtitleClass, 'w-full')}>
            Selecione o método de pagamento de sua preferência.
          </TextSubtitle>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {showBalanceOption && (
            <PaymentMethodCard
              title="Saldo em conta"
              status={canUseBalance ? formattedBalance : `${formattedBalance} · insuficiente`}
              statusTone={canUseBalance ? 'ok' : 'bad'}
              description="Use seu saldo disponível"
              icon={WalletBalanceIcon}
              available={canUseBalance}
              selected={canUseBalance && paymentMethod === 'credits'}
              onSelect={() => handleSelectMethod('credits')}
              testId="option-Saldo em conta"
              delayMs={0}
            />
          )}

          {gridOptions.map((option, index) => {
            const available = isAvailable(option.code)
            return (
              <PaymentMethodCard
                key={option.id}
                title={option.title}
                status={available ? option.availableStatus : UNAVAILABLE_STATUS}
                statusTone={available ? option.availableTone : 'warn'}
                description={available ? option.description : UNAVAILABLE_DESCRIPTION}
                icon={option.icon}
                available={available}
                selected={available && paymentMethod === option.id}
                onSelect={() => handleSelectMethod(option.id, option.code)}
                testId={`option-${option.title}`}
                delayMs={(showBalanceOption ? index + 1 : index) * 45}
              />
            )
          })}

          {boleto && (
            <PaymentMethodCard
              title={boleto.title}
              status={isAvailable(boleto.code) ? boleto.availableStatus : UNAVAILABLE_STATUS}
              statusTone={isAvailable(boleto.code) ? boleto.availableTone : 'warn'}
              description={isAvailable(boleto.code) ? boleto.description : UNAVAILABLE_DESCRIPTION}
              icon={boleto.icon}
              available={isAvailable(boleto.code)}
              selected={isAvailable(boleto.code) && paymentMethod === 'boleto'}
              onSelect={() => handleSelectMethod('boleto', boleto.code)}
              testId="option-Boleto"
              delayMs={(showBalanceOption ? 3 : 2) * 45}
              className="md:col-span-2"
            />
          )}
        </div>
      </div>
    </div>
  )
}
