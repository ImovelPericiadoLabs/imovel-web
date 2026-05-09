'use client'

import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { memo, useState, useRef, ReactNode, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react'
import { FormProvider, useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, CircleQuestionMark } from 'lucide-react'
import {
  AddressStep,
  AddressHintStep,
  RegistrationManualStep,
  ConsultEntryStep,
  DocumentConfirmationStep,
  DocumentTypeStep,
  SummaryStep,
  AddressComplementStep,
  SuccessStep,
  type ConsultEntryChoice,
} from '@/sections/consult-property/steps'
import { PaymentConfirmationStep } from '@/sections/consult-property/steps/payment-step/payment-confirmation-step/payment-confirmation-step'
import { SavedCardsPage } from '@/sections/consult-property/steps/payment-step/card/select'
import { CreditCardPage } from '@/sections/consult-property/steps/payment-step/card/register'
import TrafficLightModal from '@/components/traffic-light-modal'
import LoadingOverlay from '@/components/loading-overlay'
import { CONSULT_FLUXO_INICIO_QUERY, CONSULTAR_IMOVEL_INICIO_HREF } from '@/constants/consult-flow'
import { validations, FormTypes } from '@/sections/consult-property/validations'
import { trackGtmEvent } from '@/utils/analytics/gtm'

const CONSULT_PROPERTY_FORM_DEFAULTS: FormTypes = {
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
  documentType: undefined,
  document: undefined,
  documentPreview: undefined,
  registry: null,
  placeId: '',
  address: '',
  addressHint: '',
  notaryName: '',
}

type FlowState =
  | 'entry'
  | 'registry-manual'
  | 'address-hint'
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

type ConsultPropertyProps = {
  isActive?: boolean
}

const ConsultProperty = forwardRef<ConsultPropertyHandle, ConsultPropertyProps>(function ConsultProperty(
  { isActive = true },
  ref,
) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [flow, setFlow] = useState<FlowState>('entry')
  const stack = useRef<FlowState[]>([])
  const entryPathRef = useRef<ConsultEntryChoice | null>(null)
  const hasTrackedFlowStart = useRef(false)
  const [isInitialLoading, setIsInitialLoading] = useState(() => {
    if (typeof window === 'undefined') return true
    return sessionStorage.getItem('consultPropertyAssetsReady') !== 'true'
  })

  const methods = useForm<FormTypes>({
    resolver: zodResolver(validations) as Resolver<FormTypes>,
    defaultValues: CONSULT_PROPERTY_FORM_DEFAULTS,
    shouldUnregister: false,
    mode: 'onChange',
  })
  const { reset: resetConsultForm } = methods

  const addressStepRef = useRef<{ focus: () => boolean }>(null)
  const addressComplementRef = useRef<{ handleBack: () => void }>(null)

  useImperativeHandle(ref, () => ({
    focusAddress: () => {
      return addressStepRef.current?.focus() ?? false
    },
  }))

  useEffect(() => {
    if (searchParams.get(CONSULT_FLUXO_INICIO_QUERY) !== '1') return

    stack.current = []
    entryPathRef.current = null
    hasTrackedFlowStart.current = false
    setFlow('entry')
    resetConsultForm(CONSULT_PROPERTY_FORM_DEFAULTS)
    sessionStorage.removeItem('autoFocusAddress')

    const params = new URLSearchParams(searchParams.toString())
    params.delete(CONSULT_FLUXO_INICIO_QUERY)
    const qs = params.toString()
    router.replace(qs ? `/consultar-imovel?${qs}` : '/consultar-imovel', { scroll: false })
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [searchParams, resetConsultForm, router])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('autoFocus') === 'true' || sessionStorage.getItem('autoFocusAddress')) {
      setFlow((f) => (f === 'entry' ? 'address' : f))
    }
  }, [])

  useEffect(() => {
    if (!isActive) return
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
  }, [flow, isActive])

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
      window.location.href = CONSULTAR_IMOVEL_INICIO_HREF
      return
    }

    if (flow === 'entry') {
      router.push('/')
      return
    }

    if (flow === 'address-complement' && addressComplementRef.current) {
      addressComplementRef.current.handleBack()
      return
    }

    const previous = stack.current.pop()

    if (!previous && (flow === 'address' || flow === 'address-hint')) {
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
    entry: 0,
    'registry-manual': 1,
    'address-hint': 1,
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

  const currentStepIndex = progressSteps[flow]

  const isFinished = flow === 'finished'

  useEffect(() => {
    if (!isActive || isInitialLoading) return

    if (typeof window !== 'undefined') {
      window.currentFlowStep = flow
    }

    trackGtmEvent('consult_flow_step_view', {
      event_category: 'consult_flow',
      event_label: flow,
      event_description: `Visualizou a etapa "${flow}" do fluxo de consulta do imóvel.`,
      flow_step: flow,
      step_index: currentStepIndex,
      is_finished: isFinished,
    })

    if (!hasTrackedFlowStart.current) {
      hasTrackedFlowStart.current = true
      const startedFromVsl =
        typeof window !== 'undefined' &&
        sessionStorage.getItem('consultFlowStartedFromVsl') === 'true'
      if (startedFromVsl) {
        sessionStorage.removeItem('consultFlowStartedFromVsl')
        return
      }

      trackGtmEvent('consult_flow_started', {
        event_category: 'consult_flow',
        event_label: 'start',
        event_description: 'Iniciou o fluxo de consulta do imóvel.',
        flow_step: flow,
        step_index: currentStepIndex,
      })
    }
  }, [flow, isInitialLoading, currentStepIndex, isFinished, isActive])

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
        className={`relative z-40 flex w-full flex-col pt-4 transition-colors duration-500 ${
          isFinished ? 'bg-emerald-600' : 'bg-primary'
        }`}
      >
        <div className="mx-auto mb-2 flex w-full max-w-lg items-center justify-between px-4 py-4.5 md:max-w-2xl md:px-6 xl:max-w-3xl xl:px-8 2xl:max-w-[52rem] 2xl:px-10">
          <ChevronLeft
            onClick={back}
            className={`size-7 transition-opacity text-white ${
              flow === 'address' && stack.current.length === 0 ? 'opacity-0 pointer-events-none' : 'cursor-pointer'
            }`}
            role="button"
          />

          <div className="relative">
            <Image
              src="/images/logo.svg"
              alt="Logo"
              width={72}
              height={70}
              className="object-contain -my-2.5"
            />
          </div>

          <TrafficLightModal>
            <CircleQuestionMark className="size-7 cursor-pointer text-white" />
          </TrafficLightModal>
        </div>
      </header>

      {/* Faixa clara: altura um pouco maior em desktop para respiro com o overlap do main */}
      <div
        className="relative h-36 shrink-0 bg-sky-200 transition-colors duration-500 sm:h-32 md:h-36 lg:h-40"
        aria-hidden
      />

      <FormProvider {...methods}>
        <main className="relative z-10 mx-auto w-full max-w-lg -mt-28 px-0 pt-2 pb-8 sm:-mt-24 md:max-w-2xl md:pb-10 xl:max-w-3xl xl:pb-12 2xl:max-w-[52rem]">
          <Activity isActive={flow === 'entry'}>
            <ConsultEntryStep
              onChoose={(choice) => {
                entryPathRef.current = choice
                if (choice === 'address') {
                  go('address')
                } else if (choice === 'document') {
                  methods.setValue('hasDocument', true, { shouldValidate: true })
                  go('doc-type')
                } else {
                  methods.setValue('registrationNumber', '', { shouldValidate: false })
                  methods.setValue('notaryName', '', { shouldValidate: false })
                  methods.setValue('unknownRegistration', undefined, { shouldValidate: false })
                  go('registry-manual')
                }
              }}
            />
          </Activity>

          <Activity isActive={flow === 'registry-manual'}>
            <RegistrationManualStep onBack={back} onNext={() => go('doc-confirmation')} />
          </Activity>

          <Activity isActive={flow === 'address-hint'}>
            <AddressHintStep
              afterDocument={entryPathRef.current === 'document'}
              onBack={back}
              onNext={() => {
                const ep = entryPathRef.current
                if (ep === 'document') {
                  go('address-complement')
                } else {
                  go('address')
                }
              }}
            />
          </Activity>

          <Activity isActive={flow === 'address'}>
            <AddressStep ref={addressStepRef} onNext={() => go('address-complement')} />
          </Activity>

          <Activity isActive={flow === 'address-complement'}>
            <AddressComplementStep 
              ref={addressComplementRef}
              onNext={() => {
                if (entryPathRef.current === 'document') {
                  go('summary')
                } else {
                  go('doc-confirmation')
                }
              }} 
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
            <DocumentTypeStep
              onNext={() => {
                if (entryPathRef.current === 'document') {
                  go('address-hint')
                } else {
                  go('summary')
                }
              }}
            />
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