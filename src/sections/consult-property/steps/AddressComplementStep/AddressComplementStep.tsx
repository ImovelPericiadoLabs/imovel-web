'use client'

import { ChoiceCards } from '@/components/choice-cards'
import { MapPin, Building, Clock, Box, Layout, Hash, Info } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import TextTitle from '@/components/text-title'
import Button from '@/components/button'
import BottomSheet from '@/components/bottom-sheet'
import SelectedAddressCard from '@/components/selected-address-card'

export const AddressComplementStep = forwardRef(({ onNext, onBack }: { onNext: () => void, onBack?: () => void }, ref) => {
  const [currentSubStep, setCurrentSubStep] = useState(0)
  const subSteps = ['registration', 'allotment', 'block', 'lot']

  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)
  const [isValidationBottomSheetOpen, setIsValidationBottomSheetOpen] = useState(false)
  const [missingFieldLabel, setMissingFieldLabel] = useState('')
  const { register, getValues, trigger, watch, setValue, formState: { errors } } = useFormContext()
  
  useImperativeHandle(ref, () => ({
    handleBack: () => {
      handleBack()
    }
  }))

  const currentAddress = getValues('address')
  
  const unknownRegistration = watch('unknownRegistration')
  const noAllotment = watch('noAllotment')
  const noBlock = watch('noBlock')
  const noLot = watch('noLot')

  const registrationRef = useRef<HTMLInputElement>(null)
  const allotmentRef = useRef<HTMLInputElement>(null)
  const blockRef = useRef<HTMLInputElement>(null)
  const lotRef = useRef<HTMLInputElement>(null)

  const helpInfo = {
    registrationNumber: {
      content: (
        <div className="mt-2 flex flex-col gap-3">
          <p className="text-xs text-gray-600 leading-relaxed">
            A <strong>matrícula</strong> é o "RG" do imóvel. É um documento único que contém todo o histórico de um imóvel, como quem são os proprietários atuais, se existem dívidas ou impedimentos para venda.
          </p>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <h4 className="font-semibold text-blue-900 text-[10px] mb-1">Onde encontrar?</h4>
            <p className="text-[10px] text-blue-800 leading-relaxed">
              Você pode encontrar esse número na <strong>escritura</strong> do imóvel ou em um <strong>contrato de compra e venda</strong>. Geralmente aparece como "Matrícula nº" seguido de alguns dígitos.
            </p>
          </div>
        </div>
      )
    },
    allotment: {
      content: (
        <div className="mt-2 flex flex-col gap-3">
          <p className="text-xs text-gray-600 leading-relaxed">
            O <strong>loteamento</strong> é a subdivisão de uma gleba de terra em lotes destinados a edificação, com abertura de novas vias de circulação.
          </p>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <h4 className="font-semibold text-blue-900 text-[10px] mb-1">Onde encontrar?</h4>
            <p className="text-[10px] text-blue-800 leading-relaxed">
              Esta informação costuma estar no <strong>endereço completo</strong> ou no <strong>contrato do imóvel</strong>. Ex: "Loteamento Jardim das Flores".
            </p>
          </div>
        </div>
      )
    },
    block: {
      content: (
        <div className="mt-2 flex flex-col gap-3">
          <p className="text-xs text-gray-600 leading-relaxed">
            A <strong>quadra</strong> é a área delimitada por ruas ou avenidas onde o lote está localizado dentro de um loteamento ou bairro.
          </p>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <h4 className="font-semibold text-blue-900 text-[10px] mb-1">Onde encontrar?</h4>
            <p className="text-[10px] text-blue-800 leading-relaxed">
              Verifique no seu <strong>carnê de IPTU</strong> ou no <strong>contrato de compra e venda</strong>. Costuma ser identificada por letras ou números (Ex: Quadra A, Quadra 12).
            </p>
          </div>
        </div>
      )
    },
    lot: {
      content: (
        <div className="mt-2 flex flex-col gap-3">
          <p className="text-xs text-gray-600 leading-relaxed">
            O <strong>lote</strong> é a parcela de terra resultante de um loteamento, com identificação específica dentro de uma quadra.
          </p>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <h4 className="font-semibold text-blue-900 text-[10px] mb-1">Onde encontrar?</h4>
            <p className="text-[10px] text-blue-800 leading-relaxed">
              Assim como a quadra, o lote está presente no <strong>IPTU</strong> ou na <strong>escritura</strong>. É o número que identifica sua propriedade dentro daquela quadra específica.
            </p>
          </div>
        </div>
      )
    }
  }

  const handleContinue = async (forceAdvance?: boolean) => {
    let fieldsToValidate: any[] = []
    let fieldLabel = ''
    
    if (subSteps[currentSubStep] === 'registration') {
      fieldsToValidate = ['unknownRegistration', 'registrationNumber']
      fieldLabel = 'o número da matrícula'
    }
    if (subSteps[currentSubStep] === 'allotment') {
      fieldsToValidate = ['noAllotment', 'allotment']
      fieldLabel = 'o loteamento'
    }
    if (subSteps[currentSubStep] === 'block') {
      fieldsToValidate = ['noBlock', 'block']
      fieldLabel = 'a quadra'
    }
    if (subSteps[currentSubStep] === 'lot') {
      fieldsToValidate = ['noLot', 'lot']
      fieldLabel = 'o lote'
    }

    // Forçar trigger de validação nos campos atuais
    const isValid = forceAdvance || await trigger(fieldsToValidate)
    
    // Obter os valores atuais para validação manual redundante
    const choiceValue = getValues(fieldsToValidate[0])
    const fieldValue = getValues(fieldsToValidate[1])

    if (!forceAdvance) {
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

      // Caso 3: Zod retornou erro (ex: padrão de caracteres inválido), mas passou nas checações acima
      if (!isValid) {
        return
      }
    }
    
    if (isValid || forceAdvance) {
      if (currentSubStep < subSteps.length - 1) {
        setCurrentSubStep(prev => prev + 1)
        window.scrollTo({ top: 0, behavior: 'auto' })
      } else {
        setIsBottomSheetOpen(true)
      }
    }
  }

  const handleBack = () => {
    if (currentSubStep > 0) {
      const prevStep = subSteps[currentSubStep - 1]
      
      // Limpa a seleção e o campo do passo anterior ao voltar
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
      window.scrollTo({ top: 0, behavior: 'auto' })
    } else if (onBack) {
      onBack()
    }
  }

  const handleConfirm = () => {
    setIsBottomSheetOpen(false)
    onNext()
  }

  const handleInputScroll = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget

    setTimeout(() => {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      })
    }, 300)
  }

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-7.5rem)] relative px-4 pb-32">
      <div className="flex-1 flex flex-col gap-6">
        <SelectedAddressCard address={currentAddress} />

        <div className="flex flex-col gap-2">
          <TextTitle className="text-dark">
            {subSteps[currentSubStep] === 'registration' && 'Você possui o número da matrícula?'}
            {subSteps[currentSubStep] === 'allotment' && 'Você possui o loteamento?'}
            {subSteps[currentSubStep] === 'block' && 'Você possui a quadra?'}
            {subSteps[currentSubStep] === 'lot' && 'Você possui o lote?'}
          </TextTitle>
        </div>

        {subSteps[currentSubStep] === 'registration' && (
          <div className="flex flex-col gap-3">
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
              {helpInfo.registrationNumber.content}
            </div>

            {unknownRegistration === undefined ? (
              <ChoiceCards
                label="Você possui o número da matrícula?"
                value={undefined}
                onChange={(hasInfo) => {
                  const isUnknown = !hasInfo
                  setValue('unknownRegistration', isUnknown)
                  if (isUnknown) {
                    setValue('registrationNumber', '')
                    setTimeout(() => handleContinue(true), 300)
                  } else {
                    setTimeout(() => registrationRef.current?.focus(), 100)
                  }
                }}
              />
            ) : (
              <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-end pr-1">
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
                    className="text-xs text-primary font-semibold hover:underline mb-0.5"
                  >
                    Alterar
                  </button>
                </div>

                {!unknownRegistration && (
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
                        // @ts-ignore
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
                )}

                {errors.registrationNumber && !unknownRegistration && (
                  <p className="text-xs text-red-500 ml-1">
                    {errors.registrationNumber.message as string}
                  </p>
                )}
              </div>
            )}

            <p className="text-xs text-gray-500 ml-1 leading-relaxed">
              O número da matrícula é o registro único do imóvel no cartório.
            </p>
          </div>
        )}

        {subSteps[currentSubStep] === 'allotment' && (
          <div className="flex flex-col gap-3">
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm mb-2">
              {helpInfo.allotment.content}
            </div>

            {noAllotment === undefined ? (
              <ChoiceCards
                label="Você possui o loteamento?"
                value={undefined}
                onChange={(hasInfo) => {
                  const isNoInfo = !hasInfo
                  setValue('noAllotment', isNoInfo)
                  if (isNoInfo) {
                    setValue('allotment', '')
                    setTimeout(() => handleContinue(true), 300)
                  } else {
                    setTimeout(() => allotmentRef.current?.focus(), 100)
                  }
                }}
              />
            ) : (
              <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-end pr-1">
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
                    className="text-xs text-primary font-semibold hover:underline mb-0.5"
                  >
                    Alterar
                  </button>
                </div>

                {!noAllotment && (
                  <div className="relative group">
                    <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none">
                      <Box className="size-5" />
                    </div>

                    <input
                      id="allotment"
                      type="text"
                      placeholder="Ex: Loteamento Jardim das Flores"
                      {...register('allotment')}
                      ref={(e) => {
                        register('allotment').ref(e)
                        // @ts-ignore
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
          <div className="flex flex-col gap-3">
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm mb-2">
              {helpInfo.block.content}
            </div>

            {noBlock === undefined ? (
              <ChoiceCards
                label="Possui quadra?"
                value={undefined}
                onChange={(hasInfo) => {
                  const isNoInfo = !hasInfo
                  setValue('noBlock', isNoInfo)
                  if (isNoInfo) {
                    setValue('block', '')
                    setTimeout(() => handleContinue(true), 300)
                  } else {
                    setTimeout(() => blockRef.current?.focus(), 100)
                  }
                }}
              />
            ) : (
              <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-end pr-1">
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
                    className="text-xs text-primary font-semibold hover:underline mb-0.5"
                  >
                    Alterar
                  </button>
                </div>

                {!noBlock && (
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
                        // @ts-ignore
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
          <div className="flex-1 flex flex-col gap-3">
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm mb-2">
              {helpInfo.lot.content}
            </div>

            {noLot === undefined ? (
              <ChoiceCards
                label="Possui lote?"
                value={undefined}
                onChange={(hasInfo) => {
                  const isNoInfo = !hasInfo
                  setValue('noLot', isNoInfo)
                  if (isNoInfo) {
                    setValue('lot', '')
                    setTimeout(() => handleContinue(true), 300)
                  } else {
                    setTimeout(() => lotRef.current?.focus(), 100)
                  }
                }}
              />
            ) : (
              <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-end pr-1">
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
                    className="text-xs text-primary font-semibold hover:underline mb-0.5"
                  >
                    Alterar
                  </button>
                </div>

                {!noLot && (
                  <div className="relative group">
                    <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none">
                      <Hash className="size-5" />
                    </div>

                    <input
                      id="lot"
                      type="text"
                      inputMode="numeric"
                      placeholder="Ex: Lote 05 ou 22"
                      {...register('lot')}
                      ref={(e) => {
                        register('lot').ref(e)
                        // @ts-ignore
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
      </div>
      <div className="
        fixed bottom-0 left-0 right-0 
        px-4 pt-5 pb-7 
        bg-white mt-auto 
        border-t border-gray-100 
        z-10
        supports-[-webkit-touch-callout:none]:pb-10
      ">
        <Button className="w-full h-12 text-base rounded-xl" onClick={() => handleContinue()}>
          {currentSubStep < subSteps.length - 1 ? 'Próximo' : 'Continuar'}
        </Button>
      </div>

      <BottomSheet 
        isOpen={isBottomSheetOpen} 
        onClose={() => setIsBottomSheetOpen(false)}
        variant="alert"
      >
        <div className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-yellow-600">
              <Clock className="size-6" />
              <h3 className="text-xl font-bold">Atenção ao prazo</h3>
            </div>
            
            <p className={`text-lg font-semibold leading-tight ${unknownRegistration ? 'text-yellow-700' : 'text-emerald-700'}`}>
              {unknownRegistration
                ? "Sem o número da matrícula, o prazo para a consulta é de até 2 dias úteis."
                : "Com o número da matrícula, sua consulta será realizada em apenas 1 hora!"}
            </p>

            <p className="text-sm text-gray-500">
              {unknownRegistration 
                ? "Dica: Informar a matrícula agiliza o processo juridicamente."
                : "Seu pedido terá prioridade total no processamento."}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={handleConfirm} className="w-full h-12 rounded-xl">
              Confirmar
            </Button>
            <Button 
              onClick={() => setIsBottomSheetOpen(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 shadow-none border border-gray-200 h-12 rounded-xl"
            >
              Voltar
            </Button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet 
        isOpen={isValidationBottomSheetOpen} 
        onClose={() => setIsValidationBottomSheetOpen(false)}
        variant="alert"
      >
        <div className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-primary">
              <Info className="size-6" />
              <h3 className="text-xl font-bold">Campo obrigatório</h3>
            </div>
            
            <p className="text-lg font-semibold leading-tight text-gray-700">
              Por favor, informe {missingFieldLabel} para prosseguir.
            </p>

            <p className="text-sm text-gray-500">
              Esta informação é necessária para localizarmos o seu imóvel com precisão. Caso não possua a informação, você pode marcar a opção "Não possuo" acima.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={() => setIsValidationBottomSheetOpen(false)} className="w-full h-12 rounded-xl">
              Entendido
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div >
  )
})