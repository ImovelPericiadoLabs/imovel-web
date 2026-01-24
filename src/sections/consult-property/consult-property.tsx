'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { memo, useState, useRef, ReactNode, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, CircleQuestionMark } from 'lucide-react'
import ProgressBar from '@/components/progress-bar'
import {
  AddressStep,
  DocumentConfirmationStep,
  DocumentTypeStep,
  SummaryStep,
  AddressComplementStep,
  SuccessStep
} from '@/sections/consult-property/steps'
import { PaymentConfirmationStep } from '@/sections/consult-property/steps/payment-step/payment-confirmation-step/payment-confirmation-step'
import { SavedCardsPage } from '@/sections/consult-property/steps/payment-step/card/select'
import { CreditCardPage } from '@/sections/consult-property/steps/payment-step/card/register'
import TrafficLightModal from '@/components/traffic-light-modal'
import LoadingOverlay from '@/components/loading-overlay'
import { validations, FormTypes } from '@/sections/consult-property/validations'
import { trackGtmEvent } from '@/utils/analytics/gtm'

type FlowState =
  | 'address'
  | 'address-complement'
  | 'doc-confirmation'
  | 'doc-type'
  | 'summary'
  | 'payment-cards'
  | 'payment-card-new'
  | 'payment-confirm'
  | 'finished'

const Activity = memo(function Activity({ isActive, children }: { isActive: boolean; children: ReactNode }) {
  return (
    <div aria-hidden={!isActive} style={{ display: isActive ? 'block' : 'none' }}>
      {children}
    </div>
  )
})

export type ConsultPropertyHandle = {
  focusAddress: () => boolean
}

const ConsultProperty = forwardRef<ConsultPropertyHandle>(function ConsultProperty(_props, ref) {
  const router = useRouter()
  const [flow, setFlow] = useState<FlowState>('address')
  const stack = useRef<FlowState[]>([])
  const hasTrackedFlowStart = useRef(false)
  const [isInitialLoading, setIsInitialLoading] = useState(() => {
    if (typeof window === 'undefined') return true
    return sessionStorage.getItem('consultPropertyAssetsReady') !== 'true'
  })

  const methods = useForm<FormTypes>({
    resolver: zodResolver(validations),
    defaultValues: {
      paymentMethod: 'pix',
      allotment: '',
      noAllotment: undefined,
      block: '',
      noBlock: undefined,
      lot: '',
      noLot: undefined,
      complement: '',
      registrationNumber: '',
      unknownRegistration: undefined,
      hasDocument: undefined,
      registry: null,
    },
    shouldUnregister: false,
    mode: 'onChange',
  })

  const addressStepRef = useRef<{ focus: () => boolean }>(null)
  const addressComplementRef = useRef<{ handleBack: () => void }>(null)

  useImperativeHandle(ref, () => ({
    focusAddress: () => {
      return addressStepRef.current?.focus() ?? false
    },
  }))

  useEffect(() => {
    if (flow === 'address') {
      const handleFocus = () => {
        // Garantir que o input já está renderizado antes do foco (iOS)
        requestAnimationFrame(() => {
          addressStepRef.current?.focus()
        })
        setTimeout(() => {
          addressStepRef.current?.focus()
        }, 120)
      }

      const params = new URLSearchParams(window.location.search)
      const hasAutoFocusParam = params.get('autoFocus') === 'true'
      const hasAutoFocusFlag = !!sessionStorage.getItem('autoFocusAddress')

      if (hasAutoFocusParam || hasAutoFocusFlag) {
        handleFocus()

        // Limpar marcações para não focar novamente
        sessionStorage.removeItem('autoFocusAddress')

        // Atualiza a URL sem recarregar a página
        if (hasAutoFocusParam) {
          const newUrl = window.location.pathname
          window.history.replaceState({}, '', newUrl)
        }
      }
    }
  }, [flow])

  useEffect(() => {
    if (!isInitialLoading) return

    let isCancelled = false

    const waitForLoad = new Promise<void>((resolve) => {
      if (document.readyState === 'complete') {
        resolve()
        return
      }
      window.addEventListener('load', () => resolve(), { once: true })
    })

    const waitForFonts = document.fonts?.ready ?? Promise.resolve()

    Promise.all([waitForLoad, waitForFonts]).then(() => {
      if (isCancelled) return
      sessionStorage.setItem('consultPropertyAssetsReady', 'true')
      requestAnimationFrame(() => {
        if (!isCancelled) {
          setIsInitialLoading(false)
        }
      })
    })

    return () => {
      isCancelled = true
    }
  }, [isInitialLoading])

  const go = useCallback((next: FlowState) => {
    stack.current.push(flow)
    setFlow(next)
    // Usar scroll imediato em vez de smooth para evitar atrasos na percepção de troca de página
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [flow])

  const back = useCallback(() => {
    if (flow === 'finished') {
      window.location.href = '/consultar-imovel'
      return
    }

    if (flow === 'address-complement' && addressComplementRef.current) {
      addressComplementRef.current.handleBack()
      return
    }

    const previous = stack.current.pop()

    if (!previous && flow === 'address') {
      router.push('/')
      return
    }

    if (previous) {
      // Resetar estados ao voltar para passos anteriores que possuem Sim/Não
      if (previous === 'doc-confirmation') {
        methods.setValue('hasDocument', undefined)
      }
      
      if (previous === 'doc-type') {
        methods.setValue('documentType', undefined)
        methods.setValue('document', undefined)
        methods.setValue('documentPreview', undefined)
      }
      
      if (previous === 'address-complement') {
        // Se voltarmos do documento para o complemento, resetamos o último sub-passo
        methods.setValue('complement', '')
      }

      setFlow(previous)
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }, [flow, router, methods])

  const progressSteps: Record<FlowState, number> = useMemo(() => ({
    address: 1,
    'address-complement': 1,
    'doc-confirmation': 2,
    'doc-type': 3,
    summary: 4,
    'payment-confirm': 5,
    'payment-cards': 5,
    'payment-card-new': 5,
    finished: 5,
  }), [])

  const currentProgress = useMemo(() => (progressSteps[flow] / 5) * 100, [flow, progressSteps])
  const currentStepIndex = progressSteps[flow]

  const isFinished = flow === 'finished'

  const showProgressBar = useMemo(() => ![
    'payment-cards',
    'payment-card-new',
    'payment-confirm',
    'finished',
  ].includes(flow), [flow])

  useEffect(() => {
    if (isInitialLoading) return

    if (typeof window !== 'undefined') {
      window.currentFlowStep = flow
    }

    trackGtmEvent('consult_flow_step_view', {
      event_category: 'consult_flow',
      event_label: flow,
      event_description: `Visualizou a etapa "${flow}" do fluxo de consulta do imóvel.`,
      flow_step: flow,
      step_index: currentStepIndex,
      progress_percent: currentProgress,
      is_finished: isFinished,
    })

    if (!hasTrackedFlowStart.current) {
      hasTrackedFlowStart.current = true
      trackGtmEvent('consult_flow_started', {
        event_category: 'consult_flow',
        event_label: 'start',
        event_description: 'Iniciou o fluxo de consulta do imóvel.',
        flow_step: flow,
        step_index: currentStepIndex,
      })
    }
  }, [flow, isInitialLoading, currentProgress, currentStepIndex, isFinished])

  if (isInitialLoading) {
    return (
      <section className="min-h-screen bg-background">
        <LoadingOverlay isLoading message="Carregando recursos..." />
      </section>
    )
  }

  return (
    <section className="min-h-screen bg-background">
      <header
        className={`flex flex-col pt-4 px-4 relative z-40 transition-colors duration-500 ${isFinished ? 'bg-emerald-600' : 'bg-primary'
          }`}
      >
        <div className="flex items-center justify-between py-4.5 mb-2">
          <ChevronLeft
            onClick={back}
            className={`size-7 transition-opacity text-white ${flow === 'address' ? 'opacity-0 pointer-events-none' : 'cursor-pointer'
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

        {showProgressBar && <ProgressBar value={currentProgress} className="mb-4" />}
      </header>

      <div
        className={`relative h-24 -mt-1 transition-colors duration-500 ${isFinished ? 'bg-emerald-600' : 'bg-primary'
          }`}
      ></div>

      <FormProvider {...methods}>
        <main className="w-full mx-auto lg:max-w-lg pt-2 px-0 -mt-20">
          <Activity isActive={flow === 'address'}>
            <AddressStep ref={addressStepRef} onNext={() => go('address-complement')} />
          </Activity>

          <Activity isActive={flow === 'address-complement'}>
            <AddressComplementStep 
              ref={addressComplementRef}
              onNext={() => go('doc-confirmation')} 
              onBack={() => {
                const previous = stack.current.pop()
                if (previous) {
                  setFlow(previous)
                  window.scrollTo({ top: 0, behavior: 'auto' })
                }
              }} 
            />
          </Activity>

          <Activity isActive={flow === 'doc-confirmation'}>
            <DocumentConfirmationStep onNext={() => go('doc-type')} onSkip={() => go('summary')} />
          </Activity>

          <Activity isActive={flow === 'doc-type'}>
            <DocumentTypeStep onNext={() => go('summary')} />
          </Activity>

          <Activity isActive={flow === 'summary'}>
            <SummaryStep onNext={() => go('payment-confirm')} />
          </Activity>

          <Activity isActive={flow === 'payment-cards'}>
            <SavedCardsPage
              onAddNewCard={() => go('payment-card-new')}
            />
          </Activity>

          <Activity isActive={flow === 'payment-card-new'}>
            <CreditCardPage onSave={() => go('payment-cards')} />
          </Activity>

          <Activity isActive={flow === 'payment-confirm'}>
            <PaymentConfirmationStep
              onFinish={() => go('finished')}
              onBackToMethods={back}
              onAddNewCard={() => go('payment-card-new')}
            />
          </Activity>

          <Activity isActive={flow === 'finished'}>
            <SuccessStep onNavigateToOrders={() => router.push('/consultas')} />
          </Activity>
        </main>
      </FormProvider>
    </section>
  )
})
ConsultProperty.displayName = 'ConsultProperty'
export default ConsultProperty