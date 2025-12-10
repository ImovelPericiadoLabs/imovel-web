'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useRef, ReactNode } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, CircleQuestionMark } from 'lucide-react'
import ProgressBar from '@/components/progress-bar'
import {
  AddressStep,
  DocumentConfirmationStep,
  DocumentTypeStep,
  SendDocumentStep,
  SummaryStep,
  AddressComplementStep
} from '@/sections/consult-property/steps'
import { PaymentConfirmationStep } from '@/sections/consult-property/steps/payment-step/payment-confirmation-step/payment-confirmation-step'
import { SavedCardsPage } from '@/sections/consult-property/steps/payment-step/card/select'
import { CreditCardPage } from '@/sections/consult-property/steps/payment-step/card/register'
import TrafficLightModal from '@/components/traffic-light-modal'
import { validations, FormTypes } from '@/sections/consult-property/validations'

type FlowState =
  | 'address'
  | 'address-complement' 
  | 'doc-confirmation'
  | 'doc-type'
  | 'send-doc'
  | 'summary'
  | 'payment-cards'
  | 'payment-card-new'
  | 'payment-confirm'
  | 'finished'

function Activity({ isActive, children }: { isActive: boolean; children: ReactNode }) {
  return (
    <div aria-hidden={!isActive} style={{ display: isActive ? 'block' : 'none' }}>
      {children}
    </div>
  )
}

export default function ConsultProperty() {
  const router = useRouter()
  const [flow, setFlow] = useState<FlowState>('address')
  const stack = useRef<FlowState[]>([])

  const methods = useForm<FormTypes>({
    resolver: zodResolver(validations),
    defaultValues: { paymentMethod: 'pix' },
    shouldUnregister: false,
    mode: 'onChange',
  })

  function go(next: FlowState) {
    stack.current.push(flow)
    setFlow(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function back() {
    const previous = stack.current.pop()

    if (!previous && flow === 'address') {
      router.push('/')
      return
    }

    if (previous) {
      setFlow(previous)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const progressSteps: Record<FlowState, number> = {
    address: 1,
    'address-complement': 1,
    'doc-confirmation': 2,
    'doc-type': 3,
    'send-doc': 4,
    summary: 5,
    'payment-confirm': 6,
    'payment-cards': 6,
    'payment-card-new': 6,
    finished: 6,
  }

  const currentProgress = (progressSteps[flow] / 6) * 100

  const showProgressBar = ![
    'payment-cards',
    'payment-card-new',
    'payment-confirm',
    'finished',
  ].includes(flow)

  return (
    <section className="min-h-screen bg-background">
      <header className="flex flex-col pt-4 px-4 bg-primary relative z-40">
        <div className="flex items-center justify-between py-4.5 mb-6">
          <ChevronLeft
            onClick={back}
            className={`size-7 text-white transition-opacity ${
              flow === 'address' ? 'opacity-0 pointer-events-none' : 'cursor-pointer'
            }`}
            role="button"
          />

          <div className="relative">
            <Image src="/images/logo.png" alt="Logo" width={200} height={50} />
          </div>

          <TrafficLightModal>
            <CircleQuestionMark className="cursor-pointer size-7 text-white" />
          </TrafficLightModal>
        </div>

        {showProgressBar && <ProgressBar value={currentProgress} className="mb-3" />}
      </header>

      <div className="relative bg-primary h-30 -mt-1"></div>

      <FormProvider {...methods}>
        <main className="w-full mx-auto lg:max-w-lg pt-5 px-0 -mt-24">
          <Activity isActive={flow === 'address'}>
            {/* 3. Redireciona para address-complement */}
            <AddressStep onNext={() => go('address-complement')} />
          </Activity>

          {/* 4. Nova Activity inserida */}
          <Activity isActive={flow === 'address-complement'}>
            <AddressComplementStep onNext={() => go('doc-confirmation')} />
          </Activity>

          <Activity isActive={flow === 'doc-confirmation'}>
            <DocumentConfirmationStep onNext={() => go('doc-type')} onSkip={() => go('summary')} />
          </Activity>

          <Activity isActive={flow === 'doc-type'}>
            <DocumentTypeStep onNext={() => go('send-doc')} />
          </Activity>

          <Activity isActive={flow === 'send-doc'}>
            <SendDocumentStep onNext={() => go('summary')} />
          </Activity>

          <Activity isActive={flow === 'summary'}>
            <SummaryStep onNext={() => go('payment-confirm')} />
          </Activity>

          <Activity isActive={flow === 'payment-cards'}>
            <SavedCardsPage
              onAddNewCard={() => go('payment-card-new')}
              onConfirmCard={() => go('payment-confirm')}
            />
          </Activity>

          <Activity isActive={flow === 'payment-card-new'}>
            <CreditCardPage onSave={() => go('payment-cards')} />
          </Activity>

          <Activity isActive={flow === 'payment-confirm'}>
            <PaymentConfirmationStep
              onFinish={() => router.push('/activity')}
              onBackToMethods={back}
              onAddNewCard={() => go('payment-card-new')}
              onSelectCard={() => go('finished')}
            />
          </Activity>

          <Activity isActive={flow === 'finished'}>
            <div className="p-6 text-center">
              <h2 className="text-xl font-bold">Processando seu pedido...</h2>
            </div>
          </Activity>
        </main>
      </FormProvider>
    </section>
  )
}