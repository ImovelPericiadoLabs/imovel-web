'use client'

import { ChoiceCards } from '@/components/choice-cards'
import { Check, Building, Box, Layout, Hash, Info, ChevronRight, Pencil, Building2, Home } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { useState, useRef, useImperativeHandle, forwardRef, useCallback, useMemo } from 'react'
import { flushSync } from 'react-dom'
import { HeroTitle } from '@/components/ui/typography'
import TextSubtitle from '@/components/text-subtitle'
import Button from '@/components/button'
import BottomSheet from '@/components/bottom-sheet'
import { scrollConsultFlowToTop } from '@/utils/consult-flow-scroll'
import SelectedAddressCard from '@/components/selected-address-card'
import InfoCard from '@/components/info-card'
import { trackGtmEvent } from '@/utils/analytics/gtm'

export const AddressComplementStep = forwardRef(({ onNext, onBack }: { onNext: () => void, onBack?: () => void }, ref) => {
  const [currentSubStep, setCurrentSubStep] = useState(0)
  const subSteps = useMemo(() => ['addressNumber', 'registration', 'allotment', 'block', 'lot', 'complement'] as const, [])
  type StepKey = (typeof subSteps)[number]
  type StepMeta = {
    label: string
    icon: LucideIcon
    tone: StepKey
    cardClassName: string
    iconClassName: string
    badgeClassName: string
  }
  const stepMeta = useMemo<Record<StepKey, StepMeta>>(() => ({
    addressNumber: {
      label: 'Número',
      icon: Home,
      tone: 'registration' as const,
      cardClassName: 'bg-primary/5 border-primary/10',
      iconClassName: 'bg-primary/15 text-primary',
      badgeClassName: 'text-primary bg-primary/10 border-primary/20',
    },
    registration: {
      label: 'Matrícula',
      icon: Building,
      tone: 'registration' as const,
      cardClassName: 'bg-primary/5 border-primary/10',
      iconClassName: 'bg-primary/15 text-primary',
      badgeClassName: 'text-primary bg-primary/10 border-primary/20',
    },
    allotment: {
      label: 'Loteamento',
      icon: Box,
      tone: 'allotment' as const,
      cardClassName: 'bg-emerald-50/70 border-emerald-100',
      iconClassName: 'bg-emerald-100 text-emerald-700',
      badgeClassName: 'text-emerald-700 bg-emerald-100/80 border-emerald-200',
    },
    block: {
      label: 'Quadra',
      icon: Layout,
      tone: 'block' as const,
      cardClassName: 'bg-amber-50/70 border-amber-100',
      iconClassName: 'bg-amber-100 text-amber-700',
      badgeClassName: 'text-amber-700 bg-amber-100/80 border-amber-200',
    },
    lot: {
      label: 'Lote',
      icon: Hash,
      tone: 'lot' as const,
      cardClassName: 'bg-violet-50/70 border-violet-100',
      iconClassName: 'bg-violet-100 text-violet-700',
      badgeClassName: 'text-violet-700 bg-violet-100/80 border-violet-200',
    },
    complement: {
      label: 'Complemento',
      icon: Building2,
      tone: 'complement' as const,
      cardClassName: 'bg-gray-50/80 border-gray-100',
      iconClassName: 'bg-gray-100 text-gray-700',
      badgeClassName: 'text-gray-700 bg-gray-100/80 border-gray-200',
    },
  }), [])
  const validationStyles = useMemo(() => ({
    addressNumber: {
      sheet: 'border-t-4 border-primary/60',
      iconWrap: 'bg-primary/10',
      icon: 'text-primary',
      title: 'text-primary',
      button: 'bg-primary hover:bg-primary-hover text-white',
    },
    registration: {
      sheet: 'border-t-4 border-primary/60',
      iconWrap: 'bg-primary/10',
      icon: 'text-primary',
      title: 'text-primary',
      button: 'bg-primary hover:bg-primary-hover text-white',
    },
    allotment: {
      sheet: 'border-t-4 border-emerald-400',
      iconWrap: 'bg-emerald-100',
      icon: 'text-emerald-700',
      title: 'text-emerald-700',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    block: {
      sheet: 'border-t-4 border-amber-400',
      iconWrap: 'bg-amber-100',
      icon: 'text-amber-700',
      title: 'text-amber-700',
      button: 'bg-amber-500 hover:bg-amber-600 text-white',
    },
    lot: {
      sheet: 'border-t-4 border-violet-400',
      iconWrap: 'bg-violet-100',
      icon: 'text-violet-700',
      title: 'text-violet-700',
      button: 'bg-violet-600 hover:bg-violet-700 text-white',
    },
    complement: {
      sheet: 'border-t-4 border-gray-300',
      iconWrap: 'bg-gray-100',
      icon: 'text-gray-700',
      title: 'text-gray-700',
      button: 'bg-gray-700 hover:bg-gray-800 text-white',
    },
  }), [])

  const { register, getValues, trigger, watch, setValue, formState: { errors } } = useFormContext()
  const [isValidationBottomSheetOpen, setIsValidationBottomSheetOpen] = useState(false)
  const [missingFieldLabel, setMissingFieldLabel] = useState('')

  const trackComplementStep = useCallback((action: 'complete' | 'skip', payload: Record<string, unknown>) => {
    trackGtmEvent('address_complement_step', {
      event_category: 'address_complement',
      event_label: action,
      event_description: action === 'skip'
        ? 'Etapa de complemento avançada sem informação.'
        : 'Etapa de complemento preenchida e concluída.',
      action,
      ...payload,
    })
  }, [])
  
  const handleBack = useCallback(() => {
    if (currentSubStep > 0) {
      const prevStep = subSteps[currentSubStep - 1]
      
      // Limpa a seleção e o campo do passo anterior ao voltar para ele
      if (prevStep === 'addressNumber') {
        setValue('noAddressNumber', undefined)
        setValue('addressNumber', '')
      }
      if (prevStep === 'registration') {
        setValue('unknownRegistration', undefined)
        setValue('registrationNumber', '')
      }
      if (prevStep === 'allotment') {
        setValue('noAllotment', undefined)
        setValue('allotment', '')
      }
      if (prevStep === 'block') {
        setValue('noBlock', undefined)
        setValue('block', '')
      }
      if (prevStep === 'lot') {
        setValue('noLot', undefined)
        setValue('lot', '')
      }

      setCurrentSubStep(prev => prev - 1)
      scrollConsultFlowToTop()
    } else if (onBack) {
      setValue('noAddressNumber', undefined)
      setValue('addressNumber', '')
      onBack()
    }
  }, [currentSubStep, subSteps, setValue, onBack])

  const handleContinue = useCallback(async (forceAdvance?: boolean) => {
    let fieldsToValidate: string[] = []
    let fieldLabel = ''
    
    const subStep = subSteps[currentSubStep]
    if (subStep === 'addressNumber') {
      fieldsToValidate = ['noAddressNumber', 'addressNumber']
      fieldLabel = 'o número do endereço'
    }
    if (subStep === 'registration') {
      fieldsToValidate = ['unknownRegistration', 'registrationNumber']
      fieldLabel = 'o número da matrícula'
    }
    if (subStep === 'allotment') {
      fieldsToValidate = ['noAllotment', 'allotment']
      fieldLabel = 'o loteamento'
    }
    if (subStep === 'block') {
      fieldsToValidate = ['noBlock', 'block']
      fieldLabel = 'a quadra'
    }
    if (subStep === 'lot') {
      fieldsToValidate = ['noLot', 'lot']
      fieldLabel = 'o lote'
    }
    if (subStep === 'complement') {
      const complementValue = String(getValues('complement') || '').trim()
      if (currentSubStep < subSteps.length - 1) {
        trackComplementStep('complete', {
          step_key: subStep,
          step_index: currentSubStep + 1,
          has_info: Boolean(complementValue),
        })
        setCurrentSubStep(prev => prev + 1)
        scrollConsultFlowToTop()
      } else {
        trackComplementStep('complete', {
          step_key: subStep,
          step_index: currentSubStep + 1,
          has_info: Boolean(complementValue),
        })
        onNext()
      }
      return
    }

    // Obter os valores atuais
    const choiceValue = getValues(fieldsToValidate[0])
    const fieldValue = getValues(fieldsToValidate[1])

    // Se for um avanço forçado (clique no "Não Tenho"), pula validações e avança para o próximo
    if (forceAdvance) {
      trackComplementStep('skip', {
        step_key: subStep,
        step_index: currentSubStep + 1,
        has_info: false,
      })
      if (currentSubStep < subSteps.length - 1) {
        setCurrentSubStep(prev => prev + 1)
        scrollConsultFlowToTop()
      } else {
        onNext()
      }
      return
    }

    // Caso 1: Usuário ainda não fez a escolha Sim/Não
    if (choiceValue === undefined) {
      setMissingFieldLabel('se possui ' + fieldLabel)
      setIsValidationBottomSheetOpen(true)
      return
    }

    // Caso 2: Usuário escolheu "Sim" (false nos campos 'unknown'/'no') mas deixou o campo de texto vazio
    if (choiceValue === false && (!fieldValue || String(fieldValue).trim() === '')) {
      setMissingFieldLabel(fieldLabel)
      setIsValidationBottomSheetOpen(true)
      return
    }

    // Forçar trigger de validação nos campos atuais (Zod)
    const isValid = await trigger(fieldsToValidate)
    
    if (isValid) {
      const hasInfo = choiceValue === false
      trackComplementStep('complete', {
        step_key: subStep,
        step_index: currentSubStep + 1,
        has_info: hasInfo,
      })
      if (currentSubStep < subSteps.length - 1) {
        setCurrentSubStep(prev => prev + 1)
        scrollConsultFlowToTop()
      } else {
        onNext()
      }
    }
  }, [currentSubStep, subSteps, getValues, trigger, trackComplementStep, onNext])

  useImperativeHandle(ref, () => ({
    handleBack: () => {
      handleBack()
    }
  }), [handleBack])

  const addrLine = String(watch('address') || '').trim()
  const hintLine = String(watch('addressHint') || '').trim()
  const currentAddress = addrLine || hintLine

  const unknownRegistration = watch('unknownRegistration')
  const noAllotment = watch('noAllotment')
  const noBlock = watch('noBlock')
  const noLot = watch('noLot')
  const noAddressNumber = watch('noAddressNumber')

  const addressNumberRef = useRef<HTMLInputElement>(null)
  const registrationRef = useRef<HTMLInputElement>(null)
  const allotmentRef = useRef<HTMLInputElement>(null)
  const blockRef = useRef<HTMLInputElement>(null)
  const lotRef = useRef<HTMLInputElement>(null)
  const complementRef = useRef<HTMLInputElement>(null)

  const focusCurrentField = useCallback(() => {
    const step = subSteps[currentSubStep]
    if (step === 'addressNumber') {
      addressNumberRef.current?.focus()
      addressNumberRef.current?.click()
      return
    }
    if (step === 'registration') {
      registrationRef.current?.focus()
      registrationRef.current?.click()
      return
    }
    if (step === 'allotment') {
      allotmentRef.current?.focus()
      allotmentRef.current?.click()
      return
    }
    if (step === 'block') {
      blockRef.current?.focus()
      blockRef.current?.click()
      return
    }
    if (step === 'lot') {
      lotRef.current?.focus()
      lotRef.current?.click()
      return
    }
    if (step === 'complement') {
      complementRef.current?.focus()
      complementRef.current?.click()
    }
  }, [currentSubStep, subSteps])

  const showNextButton = useMemo(() => {
    const currentStepName = subSteps[currentSubStep]
    if (currentStepName === 'addressNumber') {
      return noAddressNumber === false
    }
    if (currentStepName === 'registration') {
      return unknownRegistration === false
    }
    if (currentStepName === 'allotment') {
      return noAllotment === false
    }
    if (currentStepName === 'block') {
      return noBlock === false
    }
    if (currentStepName === 'lot') {
      return noLot === false
    }
    if (currentStepName === 'complement') {
      return true
    }
    return true
  }, [currentSubStep, subSteps, noAddressNumber, unknownRegistration, noAllotment, noBlock, noLot])

  const currentStepKey = subSteps[currentSubStep]
  const currentStepMeta = stepMeta[currentStepKey]
  const StepIcon = currentStepMeta?.icon ?? Building
  const validationStyle = validationStyles[currentStepKey]
  const nextButtonLabel = currentSubStep < subSteps.length - 1 ? 'Próximo' : 'Continuar'

  const renderInlineNextButton = () => (
    <div className="pt-2">
      <Button
        className="w-full h-12 text-base rounded-xl"
        onClick={() => handleContinue()}
        icon={<ChevronRight className="size-5" />}
      >
        {nextButtonLabel}
      </Button>
    </div>
  )

  return (
    <div className="flex flex-col gap-4 min-h-[calc(100vh-7.5rem)] relative px-4 pb-8">
      <div className="flex-1 flex flex-col gap-4">
        <SelectedAddressCard address={currentAddress} variant={addrLine ? 'selected' : 'hint'} />

        <div
          key={currentStepKey}
          className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${currentStepMeta?.iconClassName ?? 'bg-primary/10 text-primary'}`}>
                <StepIcon className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Etapa {currentSubStep + 1} de {subSteps.length}
                </span>
                <span className="text-sm font-semibold text-gray-900">{currentStepMeta?.label}</span>
              </div>
            </div>
            <span className={`text-[10px] font-bold border rounded-full px-2.5 py-1 ${currentStepMeta?.badgeClassName ?? 'text-primary bg-primary/5 border-primary/10'}`}>
              Responda para continuar
            </span>
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <HeroTitle variant="primary" surface="light" className="w-full text-center">
              {subSteps[currentSubStep] === 'addressNumber' && 'Você tem o número do endereço?'}
              {subSteps[currentSubStep] === 'registration' && 'Você tem o número da matrícula?'}
              {subSteps[currentSubStep] === 'allotment' && 'Você tem o nome do loteamento?'}
              {subSteps[currentSubStep] === 'block' && 'Você tem o número da quadra?'}
              {subSteps[currentSubStep] === 'lot' && 'Você tem o número do lote?'}
              {subSteps[currentSubStep] === 'complement' && 'Informe o complemento do endereço'}
            </HeroTitle>
            <TextSubtitle className="mx-auto w-[80%] max-w-2xl text-center text-gray-600">
              Dado opcional para identificação do imóvel no pedido.
            </TextSubtitle>
          </div>

          {subSteps[currentSubStep] === 'addressNumber' && (
            <div className="flex flex-col gap-3 mt-0">
            {noAddressNumber === undefined ? (
              <ChoiceCards
                className="mt-0"
                value={undefined}
                tone="registration"
                yesLabel="Tenho o número do endereço"
                noLabel="Não tenho o número do endereço"
                onChange={(hasInfo) => {
                  const isNoInfo = !hasInfo
                  if (isNoInfo) {
                    setValue('noAddressNumber', isNoInfo)
                    setValue('addressNumber', '')
                    handleContinue(true)
                  } else {
                    flushSync(() => {
                      setValue('noAddressNumber', isNoInfo)
                    })
                    addressNumberRef.current?.focus()
                    addressNumberRef.current?.click()
                  }
                }}
              />
            ) : (
              <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center pr-1">
                  <label
                    htmlFor="addressNumber"
                    className="text-sm font-semibold text-gray-700 ml-1"
                  >
                    {noAddressNumber ? 'Você marcou que não possui número' : 'Digite o número do endereço'}
                  </label>
                  <button
                    onClick={() => {
                      setValue('noAddressNumber', undefined)
                      setValue('addressNumber', '')
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-primary font-bold bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors border border-primary/10"
                  >
                    <Pencil className="size-3" />
                    Alterar
                  </button>
                </div>

                {!noAddressNumber && (
                  <>
                    <div className="relative group">
                      <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none">
                        <Home className="size-5" />
                      </div>

                      <input
                        id="addressNumber"
                        type="text"
                        inputMode="numeric"
                        placeholder="Ex: 123"
                        {...register('addressNumber')}
                        ref={(e) => {
                          register('addressNumber').ref(e)
                          addressNumberRef.current = e
                        }}
                        className={`
                          w-full 
                          pl-12 pr-4 py-4
                          bg-white 
                          border ${errors.addressNumber ? 'border-red-500' : 'border-gray-200'}
                          rounded-xl
                          text-sm text-gray-900 
                          placeholder:text-gray-400 
                          outline-none 
                          transition-all duration-200
                          focus:border-primary 
                          focus:ring-4 focus:ring-primary/10
                        `}
                      />
                    </div>
                    <InfoCard className="mt-2">
                      O número é essencial para localizar o imóvel. Caso não lembre, você pode marcar a opção &quot;Não tenho&quot;.
                    </InfoCard>
                    {showNextButton && renderInlineNextButton()}
                  </>
                )}

                {errors.addressNumber && !noAddressNumber && (
                  <p className="text-xs text-red-500 ml-1">
                    {errors.addressNumber.message as string}
                  </p>
                )}
              </div>
            )}
          </div>
          )}

          {subSteps[currentSubStep] === 'registration' && (
            <div className="flex flex-col gap-3 mt-0">
            {unknownRegistration === undefined ? (
              <ChoiceCards
                className="mt-0"
                value={undefined}
                tone="registration"
                yesLabel="Tenho o número da matrícula"
                noLabel="Não tenho o número da matrícula"
                onChange={(hasInfo) => {
                  const isUnknown = !hasInfo
                  if (isUnknown) {
                    setValue('unknownRegistration', isUnknown)
                    setValue('registrationNumber', '')
                    handleContinue(true)
                  } else {
                    flushSync(() => {
                      setValue('unknownRegistration', isUnknown)
                    })
                    // No iOS, o focus() precisa ser imediato na cadeia de evento de touch/click
                    registrationRef.current?.focus()
                    registrationRef.current?.click()
                  }
                }}
              />
            ) : (
              <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center pr-1">
                  <label
                    htmlFor="registrationNumber"
                    className="text-sm font-semibold text-gray-700 ml-1"
                  >
                    {unknownRegistration ? 'Você marcou que não possui matrícula' : 'Digite o número da matrícula'}
                  </label>
                  <button
                    onClick={() => {
                      setValue('unknownRegistration', undefined)
                      setValue('registrationNumber', '')
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-primary font-bold bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors border border-primary/10"
                  >
                    <Pencil className="size-3" />
                    Alterar
                  </button>
                </div>

                {!unknownRegistration && (
                  <>
                    <div className="relative group">
                      <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none">
                        <Building className="size-5" />
                      </div>

                      <input
                        id="registrationNumber"
                        type="text"
                        inputMode="numeric"
                        placeholder="Ex: 123456 ou 123.456"
                        maxLength={7}
                        {...register('registrationNumber', {
                          pattern: {
                            value: /^[0-9.\-/]+$/,
                            message: 'Informe apenas números ou separadores válidos'
                          }
                        })}
                        ref={(e) => {
                          register('registrationNumber').ref(e)
                          registrationRef.current = e
                        }}
                        className={`
                          w-full 
                          pl-12 pr-4 py-4
                          bg-white 
                          border ${errors.registrationNumber ? 'border-red-500' : 'border-gray-200'}
                          rounded-xl
                          text-sm text-gray-900 
                          placeholder:text-gray-400 
                          outline-none 
                          transition-all duration-200
                          focus:border-primary 
                          focus:ring-4 focus:ring-primary/10
                        `}
                      />
                    </div>
                    <InfoCard className="mt-2">
                      O número da matrícula identifica o imóvel no Cartório de Registro de Imóveis. Você pode encontrá-lo na primeira página da escritura ou contrato de compra e venda.
                    </InfoCard>
                    {showNextButton && renderInlineNextButton()}
                  </>
                )}

                {errors.registrationNumber && !unknownRegistration && (
                  <p className="text-xs text-red-500 ml-1">
                    {errors.registrationNumber.message as string}
                  </p>
                )}
              </div>
            )}
          </div>
          )}

          {subSteps[currentSubStep] === 'allotment' && (
            <div className="flex flex-col gap-3 mt-0">
            {noAllotment === undefined ? (
              <ChoiceCards
                className="mt-0"
                value={undefined}
                tone="allotment"
                yesLabel="Tenho o nome do loteamento"
                noLabel="Não tenho o nome do loteamento"
                onChange={(hasInfo) => {
                  const isNoInfo = !hasInfo
                  if (isNoInfo) {
                    setValue('noAllotment', isNoInfo)
                    setValue('allotment', '')
                    handleContinue(true)
                  } else {
                    flushSync(() => {
                      setValue('noAllotment', isNoInfo)
                    })
                    allotmentRef.current?.focus()
                    allotmentRef.current?.click()
                  }
                }}
              />
            ) : (
              <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center pr-1">
                  <label
                    htmlFor="allotment"
                    className="text-sm font-semibold text-gray-700 ml-1"
                  >
                    {noAllotment ? 'Você marcou que não possui loteamento' : 'Digite o nome do loteamento'}
                  </label>
                  <button
                    onClick={() => {
                      setValue('noAllotment', undefined)
                      setValue('allotment', '')
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-primary font-bold bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors border border-primary/10"
                  >
                    <Pencil className="size-3" />
                    Alterar
                  </button>
                </div>

                {!noAllotment && (
                  <>
                    <div className="relative group">
                      <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none">
                        <Box className="size-5" />
                      </div>

                      <input
                        id="allotment"
                        type="text"
                        placeholder="Ex: Jardim das Oliveiras"
                        {...register('allotment')}
                        ref={(e) => {
                          register('allotment').ref(e)
                          allotmentRef.current = e
                        }}
                        className={`
                          w-full 
                          pl-12 pr-4 py-4
                          bg-white 
                          border ${errors.allotment ? 'border-red-500' : 'border-gray-200'}
                          rounded-xl
                          text-sm text-gray-900 
                          placeholder:text-gray-400 
                          outline-none 
                          transition-all duration-200
                          focus:border-primary 
                          focus:ring-4 focus:ring-primary/10
                        `}
                      />
                    </div>
                    <InfoCard className="mt-2">
                      O nome do loteamento é a denominação dada à área dividida em lotes. Geralmente consta no endereço oficial ou no contrato do imóvel.
                    </InfoCard>
                    {showNextButton && renderInlineNextButton()}
                  </>
                )}

                {errors.allotment && !noAllotment && (
                  <p className="text-xs text-red-500 ml-1">
                    {errors.allotment.message as string}
                  </p>
                )}
              </div>
            )}
          </div>
          )}

          {subSteps[currentSubStep] === 'block' && (
            <div className="flex flex-col gap-3 mt-0">
            {noBlock === undefined ? (
              <ChoiceCards
                className="mt-0"
                value={undefined}
                tone="block"
                yesLabel="Tenho o número da quadra"
                noLabel="Não tenho o número da quadra"
                onChange={(hasInfo) => {
                  const isNoInfo = !hasInfo
                  if (isNoInfo) {
                    setValue('noBlock', isNoInfo)
                    setValue('block', '')
                    handleContinue(true)
                  } else {
                    flushSync(() => {
                      setValue('noBlock', isNoInfo)
                    })
                    blockRef.current?.focus()
                    blockRef.current?.click()
                  }
                }}
              />
            ) : (
              <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center pr-1">
                  <label
                    htmlFor="block"
                    className="text-sm font-semibold text-gray-700 ml-1"
                  >
                    {noBlock ? 'Você marcou que não possui quadra' : 'Quadra'}
                  </label>
                  <button
                    onClick={() => {
                      setValue('noBlock', undefined)
                      setValue('block', '')
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-primary font-bold bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors border border-primary/10"
                  >
                    <Pencil className="size-3" />
                    Alterar
                  </button>
                </div>

                {!noBlock && (
                  <>
                    <div className="relative group">
                      <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none">
                        <Layout className="size-5" />
                      </div>

                      <input
                        id="block"
                        type="text"
                        inputMode="numeric"
                        placeholder="Ex: Quadra A ou 12"
                        {...register('block')}
                        ref={(e) => {
                          register('block').ref(e)
                          blockRef.current = e
                        }}
                        className={`
                          w-full 
                          pl-12 pr-4 py-4
                          bg-white 
                          border ${errors.block ? 'border-red-500' : 'border-gray-200'}
                          rounded-xl
                          text-sm text-gray-900 
                          placeholder:text-gray-400 
                          outline-none 
                          transition-all duration-200
                          focus:border-primary 
                          focus:ring-4 focus:ring-primary/10
                        `}
                      />
                    </div>
                    <InfoCard className="mt-2">
                      A quadra é o conjunto de lotes delimitado por ruas. Verifique no seu carnê de IPTU ou contrato.
                    </InfoCard>
                    {showNextButton && renderInlineNextButton()}
                  </>
                )}

                {errors.block && !noBlock && (
                  <p className="text-xs text-red-500 ml-1">
                    {errors.block.message as string}
                  </p>
                )}
              </div>
            )}
          </div>
          )}

          {subSteps[currentSubStep] === 'lot' && (
            <div className="flex flex-col gap-3 mt-0">
            {noLot === undefined ? (
              <ChoiceCards
                className="mt-0"
                value={undefined}
                tone="lot"
                yesLabel="Tenho o número do lote"
                noLabel="Não tenho o número do lote"
                onChange={(hasInfo) => {
                  const isNoInfo = !hasInfo
                  setValue('noLot', isNoInfo)
                  if (isNoInfo) {
                    setValue('lot', '')
                    handleContinue(true)
                  } else {
                    flushSync(() => {
                      setValue('noLot', isNoInfo)
                    })
                    lotRef.current?.focus()
                    lotRef.current?.click()
                  }
                }}
              />
            ) : (
              <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center pr-1">
                  <label
                    htmlFor="lot"
                    className="text-sm font-semibold text-gray-700 ml-1"
                  >
                    {noLot ? 'Você marcou que não possui lote' : 'Lote'}
                  </label>
                  <button
                    onClick={() => {
                      setValue('noLot', undefined)
                      setValue('lot', '')
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-primary font-bold bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors border border-primary/10"
                  >
                    <Pencil className="size-3" />
                    Alterar
                  </button>
                </div>

                {!noLot && (
                  <>
                    <div className="relative group">
                      <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none">
                        <Hash className="size-5" />
                      </div>

                      <input
                        id="lot"
                        type="text"
                        inputMode="numeric"
                        placeholder="Ex: Lote 01 ou 10"
                        {...register('lot')}
                        ref={(e) => {
                          register('lot').ref(e)
                          lotRef.current = e
                        }}
                        className={`
                          w-full 
                          pl-12 pr-4 py-4
                          bg-white 
                          border ${errors.lot ? 'border-red-500' : 'border-gray-200'}
                          rounded-xl
                          text-sm text-gray-900 
                          placeholder:text-gray-400 
                          outline-none 
                          transition-all duration-200
                          focus:border-primary 
                          focus:ring-4 focus:ring-primary/10
                        `}
                      />
                    </div>
                    <InfoCard className="mt-2">
                      O lote é a unidade mínima de terra dentro da quadra. Encontre essa informação no IPTU ou na matrícula.
                    </InfoCard>
                    {showNextButton && renderInlineNextButton()}
                  </>
                )}

                {errors.lot && !noLot && (
                  <p className="text-xs text-red-500 ml-1">
                    {errors.lot.message as string}
                  </p>
                )}
              </div>
            )}
          </div>
          )}

          {subSteps[currentSubStep] === 'complement' && (
            <div className="flex flex-col gap-3 mt-0">
              <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <label
                  htmlFor="complement"
                  className="text-sm font-semibold text-gray-700 ml-1"
                >
                  Complemento do endereço
                </label>

                <div className="relative group">
                  <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none">
                    <Building2 className="size-5" />
                  </div>

                  <input
                    id="complement"
                    type="text"
                    placeholder="Ex: Edifício Sol, Bloco B, Apto 301"
                    {...register('complement')}
                    ref={(e) => {
                      register('complement').ref(e)
                      complementRef.current = e
                    }}
                    className={`
                      w-full 
                      pl-12 pr-4 py-4
                      bg-white 
                      border ${errors.complement ? 'border-red-500' : 'border-gray-200'}
                      rounded-xl
                      text-sm text-gray-900 
                      placeholder:text-gray-400 
                      outline-none 
                      transition-all duration-200
                      focus:border-primary 
                      focus:ring-4 focus:ring-primary/10
                    `}
                  />
                </div>

                <InfoCard className="mt-2">
                  Sugestão: informe edifício, número do bloco e número do apartamento.
                </InfoCard>

                {renderInlineNextButton()}
              </div>
            </div>
          )}
        </div>
      </div>
      <BottomSheet 
        isOpen={isValidationBottomSheetOpen} 
        onClose={() => setIsValidationBottomSheetOpen(false)}
        variant="alert"
        className={validationStyle.sheet}
      >
        <div className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${validationStyle.iconWrap}`}>
                <Info className={`size-6 ${validationStyle.icon}`} />
              </div>
              <h3 className={`text-xl font-bold ${validationStyle.title}`}>Campo obrigatório</h3>
            </div>
            
            <p className="text-lg font-semibold leading-tight text-gray-700">
              Por favor, informe {missingFieldLabel} para prosseguir.
            </p>

            <p className="text-sm text-gray-500 leading-relaxed">
              Esta informação é necessária para localizarmos o seu imóvel com precisão. Caso não possua a informação, você pode marcar a opção &quot;Não Tenho&quot; acima.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => {
                flushSync(() => {
                  setIsValidationBottomSheetOpen(false)
                })
                focusCurrentField()
              }} 
              className={`w-full h-12 rounded-xl ${validationStyle.button}`}
              icon={<Check className="size-5" />}
            >
              Entendido
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div >
  )
})
AddressComplementStep.displayName = 'AddressComplementStep'