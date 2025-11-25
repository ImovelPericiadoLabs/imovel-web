'use client'
import { useFormContext } from 'react-hook-form'
import { QrCode, CreditCard, Barcode, DollarSign, LucideIcon } from 'lucide-react'
import TextTitle from '@/components/text-title'
import OptionCard from '@/components/option-card/option-card.tsx'
import { Switch } from '@/components/switch'

type PaymentMethodType = 'pix' | 'credit_card' | 'debit_card' | 'boleto'

interface PaymentOption {
  id: PaymentMethodType
  title: string
  subtitle: string
  icon: LucideIcon
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'pix',
    title: 'Pix',
    subtitle: 'Aprovação imediata',
    icon: QrCode,
  },
  {
    id: 'credit_card',
    title: 'Cartão de Crédito',
    subtitle: 'Em até 12x',
    icon: CreditCard,
  },
  {
    id: 'debit_card',
    title: 'Cartão de Débito',
    subtitle: 'Transferência instantânea',
    icon: CreditCard,
  },
  {
    id: 'boleto',
    title: 'Boleto',
    subtitle: 'Vencimento em 3 dias úteis',
    icon: Barcode,
  },
]

interface PaymentStepProps {
  currentBalance?: number
  onNextStep: () => void
}

export function PaymentStep({ currentBalance = 240.0, onNextStep }: PaymentStepProps) {
  const { setValue, watch } = useFormContext()
  const useBalance = watch('useBalance')

  const formattedBalance = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(currentBalance)

  function handleSelectMethod(value: PaymentMethodType) {
    setValue('paymentMethod', value, { shouldValidate: true })

    onNextStep()
  }

  function toggleBalance(checked: boolean) {
    setValue('useBalance', checked)
  }

  return (
    <div className="relative flex-1 px-4">
      <div className="flex flex-col gap-5 pb-24 md:pb-0">
        <div className="px-1">
          <TextTitle>Escolha como pagar</TextTitle>
        </div>

        <div className="grid auto-rows-fr gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900">Saldo em conta</span>
                <span className="text-sm text-gray-500">{formattedBalance}</span>
              </div>
            </div>
            <Switch checked={useBalance} onCheckedChange={toggleBalance} />
          </div>

          {PAYMENT_OPTIONS.map((option) => (
            <OptionCard
              key={option.id}
              icon={option.icon}
              title={option.title}
              subtitle={option.subtitle}
              onClick={() => handleSelectMethod(option.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
