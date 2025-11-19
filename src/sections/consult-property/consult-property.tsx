'use client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, Activity } from 'react'
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
import { validations, FormTypes } from '@/sections/consult-property/validations'

export default function ConsultProperty() {
  const [step, setStep] = useState<number>(1)
  const [hasDocument, setHasDocument] = useState(false)
  const totalSteps = 6

  const { push } = useRouter()

  const methods = useForm<FormTypes>({
    resolver: zodResolver(validations),
    defaultValues: {},
  })

  function handlePreviousStep() {
    setStep((step) => step - 1)
  }

  function handleNextStep() {
    if (step < totalSteps) {
      setStep((step) => step + 1)
    }
  }

  function handleGoBack() {
    if (step === 1) {
      push('/')

      return
    }

    if (step === 5) {
      if (!hasDocument) {
        setStep(2)

        return
      }
    }

    handlePreviousStep()
  }

  const formContextValue = {
    ...methods,
    handleNextStep,
    setStep,
    setHasDocument,
  }

  return (
    <section className="min-h-screen">
      <header className="flex flex-col pt-4 px-4 bg-primary">
        <div className="flex items-center justify-between py-4.5 mb-6">
          <ChevronLeft onClick={handleGoBack} className="size-7 text-white cursor-pointer" />

          <Image src="/images/logo.png" alt="Imagem de logo" width={200} height={50} />

          <Menu className="size-7 text-white cursor-pointer" />
        </div>

        <div>
          <div className="flex justify-end gap-1 font-normal text-base leading-6 text-white">
            <p>{step}</p> de <p>{totalSteps}</p>
          </div>
          <ProgressBar value={(step / totalSteps) * 100} />
        </div>
      </header>

      <div className="relative bg-primary h-20"></div>

      <FormProvider {...formContextValue}>
        <main className="pt-5 w-full mx-auto lg:max-w-lg -mt-22">
          <Activity mode={step === 1 ? 'visible' : 'hidden'}>
            <AddressStep />
          </Activity>

          <Activity mode={step === 2 ? 'visible' : 'hidden'}>
            <DocumentConfirmationStep />
          </Activity>

          <Activity mode={step === 3 ? 'visible' : 'hidden'}>
            <Activity mode={step === 3 ? 'visible' : 'hidden'}>
              <DocumentTypeStep />
            </Activity>
          </Activity>

          <Activity mode={step === 4 ? 'visible' : 'hidden'}>
            <SendDocumentStep />
          </Activity>

          <Activity mode={step === 5 ? 'visible' : 'hidden'}>
            <SummaryStep />
          </Activity>

          <Activity mode={step === 6 ? 'visible' : 'hidden'}>
            <PaymentStep />
          </Activity>
        </main>
      </FormProvider>
    </section>
  )
}
