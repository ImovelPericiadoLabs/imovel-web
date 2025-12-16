'use client'

import { useFormContext } from 'react-hook-form'
import { PixPaymentPage } from '@/sections/consult-property/steps/payment-step/pix'
import { SavedCardsPage } from '@/sections/consult-property/steps/payment-step/card/select'
import { FormTypes } from '@/sections/consult-property/validations' 

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
    const { watch } = useFormContext<FormTypes>()
    
    const paymentMethod = watch('paymentMethod')
    const placeId = watch('placeId') 

    if (paymentMethod === 'pix') {
        return (
            <PixPaymentPage 
                placeId={placeId} 
                onCancel={onBackToMethods} 
                onFinish={onFinish} 
            />
        )
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