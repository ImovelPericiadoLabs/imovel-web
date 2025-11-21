'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, Menu } from 'lucide-react'
import ProgressBar from '@/components/progress-bar'

import {
  AddressStep,
  DocumentConfirmationStep,
  DocumentTypeStep,
  SendDocumentStep,
  SummaryStep,
  PaymentStep,
} from '@/sections/consult-property/steps'
import { PaymentConfirmationStep } from '@/sections/consult-property/steps/payment-step/payment-confirmation-step/payment-confirmation-step'
import { validations, FormTypes } from '@/sections/consult-property/validations'

function StepContainer({ isActive, children }: { isActive: boolean; children: React.ReactNode }) {
  if (!isActive) return null
  return <div>{children}</div>
}

export default function ConsultProperty() {
  const [step, setStep] = useState<number>(1)
  const [hasDocument, setHasDocument] = useState(false)
  const [isPaymentSelected, setIsPaymentSelected] = useState(false)

  const totalSteps = 6
  const { push } = useRouter()

  const methods = useForm<FormTypes>({
    resolver: zodResolver(validations),
    defaultValues: {},
    shouldUnregister: false,
  })

  const isPaymentConfirming = step === 6 && isPaymentSelected

  function handlePreviousStep() {
    setStep((prev) => prev - 1)
  }

  function handleNextStep() {
    if (step === 6 && !isPaymentSelected) {
      setIsPaymentSelected(true)
      return
    }
    if (step < totalSteps) {
      setStep((prev) => prev + 1)
    }
  }

  function handleGoBack() {
    if (isPaymentConfirming) {
      setIsPaymentSelected(false)
      return
    }
    if (step === 1) {
      push('/')
      return
    }
    if (step === 5 && !hasDocument) {
      setStep(2)
      return
    }
    handlePreviousStep()
  }

  const formContextValue = { ...methods, handleNextStep, setStep, setHasDocument }

  return (
    <section className="min-h-screen bg-[var(--color-background)]">
      <header className="flex flex-col pt-4 px-4 bg-[var(--color-primary)]">
        <div className="flex items-center justify-between py-4.5 mb-2">
          <ChevronLeft
            onClick={handleGoBack}
            className="size-7 text-white cursor-pointer"
            role="button"
          />

          <div className="relative">
            <Image src="/images/logo.png" alt="Logo" width={200} height={50} />
          </div>

          <Menu className="size-7 text-white cursor-pointer" />
        </div>

        <div className={`mb-6 ${isPaymentConfirming ? 'invisible' : 'block'}`}>
          <div className="flex justify-end gap-1 font-normal text-base leading-6 text-white">
            <p>{step}</p> de <p>{totalSteps}</p>
          </div>
          <ProgressBar value={(step / totalSteps) * 100} />
        </div>
      </header>

      <div className="relative bg-[var(--color-primary)] -mt-[1px] h-28" />

      <FormProvider {...formContextValue}>
        <main className="w-full mx-auto lg:max-w-lg pt-5 px-0 -mt-24">
          <StepContainer isActive={step === 1}><AddressStep /></StepContainer>
          <StepContainer isActive={step === 2}><DocumentConfirmationStep /></StepContainer>
          <StepContainer isActive={step === 3}><DocumentTypeStep /></StepContainer>
          <StepContainer isActive={step === 4}><SendDocumentStep /></StepContainer>
          <StepContainer isActive={step === 5}><SummaryStep /></StepContainer>

          <StepContainer isActive={step === 6}>
            {isPaymentSelected ? <PaymentConfirmationStep /> : <PaymentStep onNextStep={handleNextStep} />}
          </StepContainer>
        </main>
      </FormProvider>
    </section>
  )
}