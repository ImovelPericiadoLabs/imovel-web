'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { memo, useState, useRef, ReactNode, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ordersListQueryKey } from '@/services/orders'
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
  PaymentStep,
  AddressComplementStep,
  SuccessStep,
} from '@/sections/consult-property/steps'
import { PaymentConfirmationStep } from '@/sections/consult-property/steps/payment-step/payment-confirmation-step/payment-confirmation-step'
import { SavedCardsPage } from '@/sections/consult-property/steps/payment-step/card/select'
import { CreditCardPage } from '@/sections/consult-property/steps/payment-step/card/register'
import TrafficLightModal from '@/components/traffic-light-modal'
import { BrandLogoLink } from '@/components/brand-logo-link'
import LoadingOverlay from '@/components/loading-overlay'
import { CONSULT_FLUXO_INICIO_QUERY, CONSULTAR_IMOVEL_INICIO_HREF } from '@/constants/consult-flow'
import {
  consultFlowShellBandClass,
  consultFlowShellClass,
  consultFlowShellGradientClass,
  consultFlowShellGradientFinishedClass,
} from '@/constants/consult-flow-hero-text'
import { FLOW_MAIN_MARKER, flowHeroShell, flowMainOverlap } from '@/styles/layout'
import { useFlowHeroSpace } from '@/hooks/use-flow-hero-space'
import { cn } from '@/utils/tailwind'
import { validations, FormTypes } from '@/sections/consult-property/validations'
import {
  clearJetimobConsultPrefill,
  readJetimobConsultPrefill,
} from '@/lib/jetimob-consult-prefill'
import { trackGtmEvent } from '@/utils/analytics/gtm'
import { scrollConsultFlowToTop, unlockPageScroll } from '@/utils/consult-flow-scroll'

const CONSULT_PROPERTY_FORM_DEFAULTS: FormTypes = {
  paymentMethod: 'pix',
  useBalance: false,
  allotment: '',
  noAllotment: undefined,
  block: '',
  noBlock: undefined,
  lot: '',
  noLot: undefined,
  complement: '',
  addressNumber: '',
  noAddressNumber: undefined,
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
  notaryState: '',
  notaryCity: '',
  entryPath: undefined,
  includeCertificates: false,
  jetimobPropertyCode: '',
  jetimobSystemId: '',
  jetimobWriteback: false,
  jetimobPropertyId: '',
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
  | 'payment'
  | 'payment-cards'
  | 'payment-card-new'
  | 'payment-confirm'
  | 'finished'

function releaseFocusWithin(node: HTMLElement | null) {
  const active = document.activeElement
  if (active instanceof HTMLElement && node?.contains(active)) {
    active.blur()
  }
}

const Activity = memo(function Activity({ isActive, children }: { isActive: boolean; children: ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isActive) return
    releaseFocusWithin(panelRef.current)
  }, [isActive])

  return (
    <div ref={panelRef} hidden={!isActive} inert={!isActive || undefined}>
      {children}
    </div>
  )
})

export type ConsultPropertyHandle = {
  focusAddress: () => boolean
}

type ConsultPropertyProps = {
  isActive?: boolean
  /** VSL e links diretos: abre em "Como quer começar?" sem pular para endereço */
  startAtEntry?: boolean
  /** Fluxo embutido (ex.: painel Jetimob): voltar da primeira etapa sai do fluxo em vez de ir para "/" */
  onExit?: () => void
}

const ConsultProperty = forwardRef<ConsultPropertyHandle, ConsultPropertyProps>(function ConsultProperty(
  { isActive = true, startAtEntry = false, onExit },
  ref,
) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const [flow, setFlow] = useState<FlowState>('entry')
  const [navStackDepth, setNavStackDepth] = useState(0)
  const stack = useRef<FlowState[]>([])
  const hasTrackedFlowStart = useRef(false)
  const [isInitialLoading, setIsInitialLoading] = useState(() => {
    if (typeof window === 'undefined') return true
    return sessionStorage.getItem('consultPropertyAssetsReady') !== 'true'
  })

  // Faixa escura do hero: dimensionada pela altura real do passo visível.
  const heroScopeRef = useFlowHeroSpace<HTMLElement>()

  const methods = useForm<FormTypes>({
    resolver: zodResolver(validations) as Resolver<FormTypes>,
    defaultValues: CONSULT_PROPERTY_FORM_DEFAULTS,
    shouldUnregister: false,
    mode: 'onChange',
  })
  const { reset: resetConsultForm, watch } = methods
  const entryPath = watch('entryPath')

  const [addressInitialQuery, setAddressInitialQuery] = useState('')
  const addressStepRef = useRef<{ focus: () => boolean }>(null)
  const addressComplementRef = useRef<{ handleBack: () => void }>(null)

  useImperativeHandle(ref, () => ({
    focusAddress: () => {
      return addressStepRef.current?.focus() ?? false
    },
  }))

  useEffect(() => {
    unlockPageScroll()
  }, [])

  useEffect(() => {
    scrollConsultFlowToTop()
  }, [flow])

  useEffect(() => {
    if (flow === 'summary') {
      unlockPageScroll()
    }
  }, [flow])

  useEffect(() => {
    if (searchParams.get(CONSULT_FLUXO_INICIO_QUERY) !== '1') return

    stack.current = []
    setNavStackDepth(0)
    hasTrackedFlowStart.current = false
    setFlow('entry')
    resetConsultForm(CONSULT_PROPERTY_FORM_DEFAULTS)
    sessionStorage.removeItem('autoFocusAddress')
    setAddressInitialQuery('')

    const params = new URLSearchParams(searchParams.toString())
    params.delete(CONSULT_FLUXO_INICIO_QUERY)
    const qs = params.toString()
    router.replace(qs ? `/consultar-imovel?${qs}` : '/consultar-imovel', { scroll: false })
    scrollConsultFlowToTop()
  }, [searchParams, resetConsultForm, router])

  useEffect(() => {
    if (!startAtEntry) return

    stack.current = []
    setNavStackDepth(0)
    hasTrackedFlowStart.current = false
    setFlow('entry')
    resetConsultForm(CONSULT_PROPERTY_FORM_DEFAULTS)
    sessionStorage.removeItem('autoFocusAddress')
    clearJetimobConsultPrefill()
    setAddressInitialQuery('')
    scrollConsultFlowToTop()
  }, [startAtEntry, resetConsultForm])

  useEffect(() => {
    if (typeof window === 'undefined' || startAtEntry) return

    const prefill = readJetimobConsultPrefill()
    if (!prefill) return

    clearJetimobConsultPrefill()

    stack.current = []
    setNavStackDepth(0)
    hasTrackedFlowStart.current = false

    resetConsultForm({
      ...CONSULT_PROPERTY_FORM_DEFAULTS,
      ...(prefill.form as Partial<FormTypes>),
      jetimobPropertyCode: prefill.propertyCode,
      jetimobSystemId: prefill.systemId || '',
      jetimobWriteback: prefill.writeback ?? false,
      jetimobPropertyId: prefill.propertyId != null ? String(prefill.propertyId) : '',
    })

    // Endereço externo precisa de confirmação: vira busca pré-preenchida no
    // Google Places e o usuário seleciona a opção correta.
    if (prefill.initialFlow === 'address') {
      const hint = String((prefill.form as Record<string, unknown>).addressHint || '')
      setAddressInitialQuery(
        hint.replace(/\n/g, ', ').replace(/ — /g, ', ').replace(/CEP /g, '').trim(),
      )
    }

    const nextFlow = prefill.initialFlow as FlowState
    setFlow(nextFlow)
    scrollConsultFlowToTop()
  }, [startAtEntry, resetConsultForm])

  useEffect(() => {
    if (typeof window === 'undefined' || startAtEntry) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('autoFocus') === 'true' || sessionStorage.getItem('autoFocusAddress')) {
      setFlow((f) => (f === 'entry' ? 'address' : f))
    }
  }, [startAtEntry])

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
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    stack.current.push(flow)
    setNavStackDepth(stack.current.length)
    setFlow(next)
    scrollConsultFlowToTop()
  }, [flow])

  const back = useCallback(() => {
    if (flow === 'finished') {
      window.location.href = CONSULTAR_IMOVEL_INICIO_HREF
      return
    }

    if (flow === 'entry') {
      if (onExit) {
        onExit()
      } else {
        router.push('/')
      }
      return
    }

    if (flow === 'address-complement' && addressComplementRef.current) {
      addressComplementRef.current.handleBack()
      return
    }

    const previous = stack.current.pop()

    if (!previous) {
      if (onExit) {
        onExit()
        return
      }
      if (flow === 'address' || flow === 'address-hint') {
        router.push('/')
        return
      }
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
      setNavStackDepth(stack.current.length)
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
      scrollConsultFlowToTop()
    }
  }, [flow, router, methods, onExit])

  const progressSteps: Record<FlowState, number> = useMemo(() => ({
    entry: 0,
    'registry-manual': 1,
    'address-hint': 1,
    address: 1,
    'address-complement': 1,
    'doc-confirmation': 2,
    'doc-type': 3,
    summary: 4,
    payment: 5,
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
      <section className="flex min-h-dvh w-full flex-col overflow-x-hidden bg-background">
        <LoadingOverlay isLoading message="Carregando recursos..." />
      </section>
    )
  }

  return (
    <section
      ref={heroScopeRef}
      className={cn(
        'flex min-h-dvh w-full flex-col overflow-x-hidden bg-background',
        flowHeroShell.scope,
      )}
    >
      <div
        className={cn(
          consultFlowShellClass,
          isFinished ? consultFlowShellGradientFinishedClass : consultFlowShellGradientClass,
        )}
      >
        <header className="relative z-40 flex w-full flex-col bg-transparent pt-3">
          <div className="mx-auto flex min-h-[3.25rem] w-full max-w-lg items-center justify-between px-4 py-3.5 sm:min-h-[3.5rem] sm:py-4 md:max-w-2xl md:px-6 xl:max-w-3xl xl:px-8 2xl:max-w-[52rem] 2xl:px-10">
            <ChevronLeft
              onClick={back}
              className={`size-7 transition-opacity text-white ${
                flow === 'address' && navStackDepth === 0 && !onExit
                  ? 'opacity-0 pointer-events-none'
                  : 'cursor-pointer'
              }`}
              role="button"
            />

            <div className="relative flex justify-center">
              <BrandLogoLink
                tone="on-primary"
                href={flow === 'entry' ? '/consultas' : CONSULTAR_IMOVEL_INICIO_HREF}
              />
            </div>

            <TrafficLightModal>
              <CircleQuestionMark className="size-7 cursor-pointer text-white" />
            </TrafficLightModal>
          </div>
        </header>

        <div className={consultFlowShellBandClass} aria-hidden />
      </div>

      <FormProvider {...methods}>
        <div role="main" className={cn('relative z-10 w-full flex-1', FLOW_MAIN_MARKER, flowMainOverlap)}>
          <div className="mx-auto w-full max-w-lg px-0 pt-0 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:max-w-2xl md:pb-10 xl:max-w-3xl xl:pb-12 2xl:max-w-[52rem]">
          <Activity isActive={flow === 'entry'}>
            <ConsultEntryStep
              onChoose={(choice) => {
                if (choice === 'address') {
                  methods.setValue('entryPath', 'address', { shouldValidate: false })
                  methods.setValue('includeCertificates', false, { shouldValidate: false })
                  go('address')
                } else if (choice === 'document') {
                  methods.setValue('entryPath', 'document', { shouldValidate: false })
                  methods.setValue('includeCertificates', true, { shouldValidate: false })
                  methods.setValue('hasDocument', true, { shouldValidate: true })
                  methods.setValue('address', '', { shouldValidate: false })
                  methods.setValue('addressHint', '', { shouldValidate: false })
                  methods.setValue('placeId', '', { shouldValidate: false })
                  methods.setValue('registry', null, { shouldValidate: false })
                  go('doc-type')
                } else {
                  methods.setValue('entryPath', 'registry', { shouldValidate: false })
                  methods.setValue('includeCertificates', true, { shouldValidate: false })
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
              afterDocument={entryPath === 'document'}
              onBack={back}
              onNext={() => {
                const hint = String(methods.getValues('addressHint') || '').trim()
                const placeId = String(methods.getValues('placeId') || '').trim()

                // Hint suficiente (ex.: prefill Jetimob) dispensa a busca no mapa.
                if (entryPath === 'document' || (hint.length >= 10 && !placeId)) {
                  go('address-complement')
                } else {
                  go('address')
                }
              }}
            />
          </Activity>

          <Activity isActive={flow === 'address'}>
            <AddressStep
              ref={addressStepRef}
              initialQuery={addressInitialQuery || undefined}
              onNext={() => go('address-complement')}
            />
          </Activity>

          <Activity isActive={flow === 'address-complement'}>
            <AddressComplementStep 
              ref={addressComplementRef}
              onNext={() => {
                if (entryPath === 'document') {
                  go('summary')
                } else {
                  go('doc-confirmation')
                }
              }} 
              onBack={() => {
                const previous = stack.current.pop()
                if (previous) {
                  setFlow(previous)
                  scrollConsultFlowToTop()
                }
              }} 
            />
          </Activity>

          <Activity isActive={flow === 'doc-confirmation'}>
            <DocumentConfirmationStep onNext={() => go('doc-type')} onSkip={() => go('summary')} />
          </Activity>

          <Activity isActive={flow === 'doc-type'}>
            <DocumentTypeStep
              showAddressCard={entryPath !== 'document'}
              onNext={() => {
                if (entryPath === 'document') {
                  go('address-hint')
                } else {
                  go('summary')
                }
              }}
            />
          </Activity>

          <Activity isActive={flow === 'summary'}>
            <SummaryStep onNext={() => go('payment')} />
          </Activity>

          <Activity isActive={flow === 'payment'}>
            <PaymentStep
              onPix={() => go('payment-confirm')}
              onCredit={() => go('payment-confirm')}
              onBoleto={() => go('payment-confirm')}
              onCredits={() => go('payment-confirm')}
            />
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
              onFinish={() => {
                // Nova consulta acabou de ser paga: invalida a lista para que apareça
                // imediatamente em "Acompanhar consultas" (sem refresh manual).
                void queryClient.invalidateQueries({ queryKey: ordersListQueryKey })
                go('finished')
              }}
              onBackToMethods={back}
              onAddNewCard={() => go('payment-card-new')}
            />
          </Activity>

          <Activity isActive={flow === 'finished'}>
            <SuccessStep onNavigateToOrders={() => router.push('/consultas')} />
          </Activity>
          </div>
        </div>
      </FormProvider>
    </section>
  )
})
ConsultProperty.displayName = 'ConsultProperty'
export default ConsultProperty