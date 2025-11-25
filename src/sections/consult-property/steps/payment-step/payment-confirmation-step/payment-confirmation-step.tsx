'use client'

import { useFormContext } from 'react-hook-form'
import { PixPaymentPage } from '@/sections/consult-property/steps/payment-step/pix'

export function PaymentConfirmationStep() {
  const { watch } = useFormContext()

  const paymentMethod = watch('paymentMethod')

  switch (paymentMethod) {
    case 'pix':
      return <PixPaymentPage />

    default:
      return null
  }
}
