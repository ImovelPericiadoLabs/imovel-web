'use client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, Activity } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, Menu, CircleQuestionMark } from 'lucide-react'
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
import TrafficLightModal from '@/sections/consult-property/components/traffic-light-modal'
import { validations, FormTypes } from '@/sections/consult-property/validations'

export default function ConsultProperty() {
  const [step, setStep] = useState<number>(1)
  const [hasDocument, setHasDocument] = useState(false)
  const [isPaymentSelected, setIsPaymentSelected] = useState(true)

  const totalSteps = 6
  const { push } = useRouter()

  const methods = useForm<FormTypes>({
    resolver: zodResolver(validations),
    defaultValues: {
      paymentMethod: 'pix',
    },
    shouldUnregister: false,
  })

  const isPaymentConfirming = step === 6 && isPaymentSelected

  function handlePreviousStep() {
    setStep((prev) => prev - 1)
  }

  function handleNextStep() {
    window.scrollTo({ top: 0, behavior: 'smooth' })

    if (step === 6 && !isPaymentSelected) {
      setIsPaymentSelected(true)
      return
    }

    if (step < totalSteps) {
      setStep((prev) => prev + 1)
    }
  }

  function handleGoBack() {
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // if (isPaymentConfirming) {
    //   setIsPaymentSelected(false)
    //   return
    // }
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
    <section className="min-h-screen bg-background">
      <header className="flex flex-col pt-4 px-4 bg-primary relative z-40">
        <div className="flex items-center justify-between py-4.5 mb-6">
          <ChevronLeft
            onClick={handleGoBack}
            className={`${step === 1 ? 'opacity-0' : 'size-7 text-white cursor-pointer'}`}
            role="button"
          />

          <div className="relative">
            <Image src="/images/logo.png" alt="Logo" width={200} height={50} />
          </div>

          <TrafficLightModal>
            <CircleQuestionMark className="size-7 text-white" />
          </TrafficLightModal>
        </div>

        <ProgressBar
          className={`${isPaymentConfirming ? 'invisible' : 'block'} mb-3`}
          value={(step / totalSteps) * 100}
        />
      </header>

      <div className="relative bg-primary h-30 -mt-1"></div>

      <FormProvider {...formContextValue}>
        <main className="w-full mx-auto lg:max-w-lg pt-5 px-0 -mt-24">
          <Activity mode={step === 1 ? 'visible' : 'hidden'}>
            <AddressStep />
          </Activity>

          <Activity mode={step === 2 ? 'visible' : 'hidden'}>
            <DocumentConfirmationStep />
          </Activity>

          <Activity mode={step === 3 ? 'visible' : 'hidden'}>
            <DocumentTypeStep />
          </Activity>

          <Activity mode={step === 4 ? 'visible' : 'hidden'}>
            <SendDocumentStep />
          </Activity>

          <Activity mode={step === 5 ? 'visible' : 'hidden'}>
            <SummaryStep />
          </Activity>

          <Activity mode={step === 6 ? 'visible' : 'hidden'}>
            {isPaymentSelected ? (
              <PaymentConfirmationStep />
            ) : (
              <PaymentStep onNextStep={handleNextStep} />
            )}
          </Activity>
        </main>
      </FormProvider>
    </section>
  )
}
