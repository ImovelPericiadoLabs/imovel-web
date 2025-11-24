'use client'

import { useFormContext } from 'react-hook-form'
import { PixPaymentPage } from '@/sections/consult-property/steps/payment-step/pix'
import { CreditCardPage } from '@/sections/consult-property/steps/payment-step/credit_card'

export function PaymentConfirmationStep() {
    const { watch } = useFormContext()

    const paymentMethod = watch('paymentMethod')

    const mockTransactionData = {
        pixCode: "00020126580014BR.GOV.BCB.PIX0114+551199999999520400005303986540610.005802BR5925MOCK PAY5925SAO PAULO62070503***6304B60E",
        amount: "67,56",
        expirationTime: "10:45"
    }

    switch (paymentMethod) {
        case 'pix':
            return (
                <PixPaymentPage
                    pixCode={mockTransactionData.pixCode}
                    amount={mockTransactionData.amount}
                    expirationTime={mockTransactionData.expirationTime}
                />
            )

        case 'credit_card':
            return (
                <CreditCardPage
                    amount={mockTransactionData.amount}
                />
            )
        default:
            return null
    }
}