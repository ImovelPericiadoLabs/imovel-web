'use client'

import { useFormContext } from 'react-hook-form'
import { PixPaymentPage } from '@/sections/consult-property/steps/payment-step/pix'
import { SavedCardsPage } from '@/sections/consult-property/steps/payment-step/card/select'

export function PaymentConfirmationStep({
    onFinish,
    onBackToMethods,
    onAddNewCard,
    onSelectCard,
}: {
    onFinish: () => void
    onBackToMethods: () => void
    onAddNewCard: () => void
    onSelectCard: () => void
}) {
    const { watch } = useFormContext()
    const paymentMethod = watch('paymentMethod')

    if (paymentMethod === 'pix') {
        return <PixPaymentPage onCancel={onBackToMethods} onConfirm={onFinish} />
    }

    if (paymentMethod === 'credit_card') {
        return (
            <SavedCardsPage
                onAddNewCard={onAddNewCard}
                onConfirmCard={onSelectCard}
            />
        )
    }

    return null
}
