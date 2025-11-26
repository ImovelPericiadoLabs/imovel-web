'use client'

import { useFormContext } from 'react-hook-form'
// Certifique-se de que o caminho de importação está correto para o seu projeto
import { PixPaymentPage } from '@/sections/consult-property/steps/payment-step/pix'
import { SavedCardsPage } from '@/sections/consult-property/steps/payment-step/card/select'

interface PaymentConfirmationStepProps {
    onCancelSelection: () => void
}

export function PaymentConfirmationStep({ onCancelSelection }: PaymentConfirmationStepProps) {
    const { watch } = useFormContext()
    const paymentMethod = watch('paymentMethod')

    switch (paymentMethod) {
        case 'pix':
            // Passe a função para o Pix
            return <PixPaymentPage onCancel={onCancelSelection} />

        case 'credit_card':
            // Se quiser que o cartão faça o mesmo, passe aqui também
            return <SavedCardsPage />

        default:
            return null
    }
}