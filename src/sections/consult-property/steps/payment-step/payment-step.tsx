'use client'

import { useFormContext } from 'react-hook-form'
import {
  Wallet,
  QrCode,
  CreditCard,
  Barcode,
  DollarSign
} from 'lucide-react'
import TextTitle from '@/components/text-title'
import OptionCard from '@/components/option-card/option-card.tsx'
// Assumindo que você tenha um componente de Switch (ex: Shadcn UI ou similar). 
// Se não tiver, substitua por um input type="checkbox" estilizado.
import { Switch } from '@/components/switch/switch'

type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'boleto'

export function PaymentStep() {
  // Assumindo que o contexto possui esses campos
  const { setValue, watch } = useFormContext()

  const useBalance = watch('useBalance')

  function handleSelectMethod(value: PaymentMethod) {
    setValue('paymentMethod', value, { shouldValidate: true })
    // Adicione handleNextStep() aqui se quiser avançar automaticamente ao clicar
    // handleNextStep() 
  }

  function toggleBalance(checked: boolean) {
    setValue('useBalance', checked)
  }

  return (
    <div className="relative flex-1 px-4 -mt-10">
      <div className="flex flex-col gap-5 pb-24 md:pb-0">

        {/* Cabeçalho */}
        <div className="px-1">
          <TextTitle>Escolha como pagar</TextTitle>
        </div>

        <div className="grid auto-rows-fr gap-4">

          {/* Card de Saldo em Conta (Customizado pois contém um Switch) */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900">Saldo em conta</span>
                <span className="text-sm text-gray-500">R$ 240,00</span>
              </div>
            </div>
            <Switch
              checked={useBalance}
              onCheckedChange={toggleBalance}
            />
          </div>

          {/* Opções de Pagamento usando o OptionCard */}
          <OptionCard
            icon={QrCode}
            title="PIX"
            subtitle="Aprovação imediata"
            onClick={() => handleSelectMethod('pix')}
          />

          <OptionCard
            icon={CreditCard}
            title="Cartão de Crédito"
            subtitle="Em até 12x"
            onClick={() => handleSelectMethod('credit_card')}
          />

          <OptionCard
            icon={CreditCard}
            title="Cartão de Débito"
            subtitle="Transferência instantânea"
            onClick={() => handleSelectMethod('debit_card')}
          />

          <OptionCard
            icon={Barcode}
            title="Boleto"
            subtitle="Vencimento em 3 dias úteis"
            onClick={() => handleSelectMethod('boleto')}
          />
        </div>
      </div>
    </div>
  )
}