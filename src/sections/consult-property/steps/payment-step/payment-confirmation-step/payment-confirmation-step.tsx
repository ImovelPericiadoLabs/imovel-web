'use client'

import { useFormContext } from 'react-hook-form'
import { PixPaymentPage } from '@/sections/consult-property/steps/payment-step/pix'
import { FormTypes } from '@/sections/consult-property/validations'

export function PaymentConfirmationStep({
    onFinish,
    onBackToMethods,
}: {
    onFinish: () => void
    onBackToMethods: () => void
    onAddNewCard: () => void
}) {
    const { watch } = useFormContext<FormTypes>()

    const paymentMethod = watch('paymentMethod')
    const placeId = watch('placeId')

    if (!paymentMethod) {
        return null
    }

    return (
        <PixPaymentPage
            placeId={placeId}
            onCancel={onBackToMethods}
            onFinish={onFinish}
        />
    )
}
