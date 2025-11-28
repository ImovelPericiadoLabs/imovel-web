'use client'

import Image from 'next/image'
import { useState, useRef } from 'react'
import { ChevronLeft, CircleQuestionMark } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  AddressStep,
  DocumentConfirmationStep,
  DocumentTypeStep,
  SendDocumentStep,
  SummaryStep,
  PaymentStep,
} from '@/sections/consult-property/steps'

import { PaymentConfirmationStep } from '@/sections/consult-property/steps/payment-step/payment-confirmation-step/payment-confirmation-step'
import { SavedCardsPage } from '@/sections/consult-property/steps/payment-step/card/select'
import { CreditCardPage } from '@/sections/consult-property/steps/payment-step/card/register'

import ProgressBar from '@/components/progress-bar'
import TrafficLightModal from '@/sections/consult-property/components/traffic-light-modal'

import { validations, FormTypes } from '@/sections/consult-property/validations'

type FlowState =
  | 'address'
  | 'doc-confirmation'
  | 'doc-type'
  | 'send-doc'
  | 'summary'
  | 'payment-method'
  | 'payment-cards'
  | 'payment-card-new'
  | 'payment-confirm'
  | 'finished'

export default function ConsultProperty() {
  const [flow, setFlow] = useState<FlowState>('address')
  const stack = useRef<FlowState[]>([])

  function go(next: FlowState) {
    stack.current.push(flow)
    setFlow(next)
  }

  function back() {
    const previous = stack.current.pop()
    if (previous) setFlow(previous)
  }

  const methods = useForm<FormTypes>({
    resolver: zodResolver(validations),
    defaultValues: {
      paymentMethod: 'pix',
    },
  })

  const progressMapping: Record<FlowState, number> = {
    address: 1,
    'doc-confirmation': 2,
    'doc-type': 3,
    'send-doc': 4,
    summary: 5,
    'payment-method': 6,
    'payment-cards': 6,
    'payment-card-new': 6,
    'payment-confirm': 6,
    finished: 6,
  }

  const progress = (progressMapping[flow] / 6) * 100

  const showProgress = ![
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
            className={`size-7 text-white transition-opacity ${flow === 'address' ? 'opacity-0 pointer-events-none' : 'cursor-pointer'
              }`}
            role="button"
            aria-hidden={flow === 'address'}
          />

          <div className="relative">
            <Image src="/images/logo.png" alt="Logo" width={200} height={50} />
          </div>

          <TrafficLightModal>
            <CircleQuestionMark className="cursor-pointer size-7 text-white" />
          </TrafficLightModal>
        </div>

        {showProgress && <ProgressBar value={progress} className="mb-3" />}
      </header>

      <div className="relative bg-primary h-30 -mt-1"></div>

      <FormProvider {...methods}>
        <main className="w-full mx-auto lg:max-w-lg pt-5 px-0 -mt-24">
          {flow === 'address' && (
            <AddressStep onNext={() => go('doc-confirmation')} />
          )}

          {flow === 'doc-confirmation' && (
            <DocumentConfirmationStep
              onNext={() => go('doc-type')}
              onSkip={() => go('summary')}
            />
          )}

          {flow === 'doc-type' && (
            <DocumentTypeStep onNext={() => go('send-doc')} />
          )}

          {flow === 'send-doc' && (
            <SendDocumentStep onNext={() => go('summary')} />
          )}

          {flow === 'summary' && (
            <SummaryStep onNext={() => go('payment-method')} />
          )}

          {flow === 'payment-method' && (
            <PaymentStep
              onPix={() => go('payment-confirm')}
              onCredit={() => go('payment-cards')}
              onDebit={() => go('payment-confirm')}
              onBoleto={() => go('payment-confirm')}
            />
          )}

          {flow === 'payment-cards' && (
            <SavedCardsPage
              onAddNewCard={() => go('payment-card-new')}
              onConfirmCard={() => go('payment-confirm')}
            />
          )}

          {flow === 'payment-card-new' && (
            <CreditCardPage onSave={() => go('payment-cards')} />
          )}

          {flow === 'payment-confirm' && (
            <PaymentConfirmationStep
              onFinish={() => go('finished')}
              onBackToMethods={() => go('payment-method')}
              onAddNewCard={() => go('payment-card-new')}
              onSelectCard={() => go('finished')}
            />
          )}

          {flow === 'finished' && (
            <div className="p-6">
              <h1 className="text-center text-xl font-semibold">
                Pedido concluído com sucesso
              </h1>
            </div>
          )}
        </main>
      </FormProvider>
    </section>
  )
}