'use client'

import { MapPin, Building, Clock } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { useState } from 'react'
import TextTitle from '@/components/text-title'
import Button from '@/components/button'
import BottomSheet from '@/components/bottom-sheet'

export function AddressComplementStep({ onNext }: { onNext: () => void }) {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)
  const { register, getValues, trigger, watch, setValue, formState: { errors } } = useFormContext()
  const currentAddress = getValues('address')
  const complementValue = watch('addressComplement') || ''
  const currentLength = complementValue.length
  
  const unknownRegistration = watch('unknownRegistration')
  const noComplement = watch('noComplement')

  const handleContinue = async () => {
    const isValid = await trigger(['addressComplement', 'registrationNumber', 'unknownRegistration', 'noComplement'])
    
    if (isValid) {
      setIsBottomSheetOpen(true)
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
      <div className="flex flex-col gap-2">
        <TextTitle>Deseja adicionar um complemento?</TextTitle>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex gap-3 items-start">
        <MapPin className="size-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-gray-700 mb-1">Endereço selecionado:</p>
          <p className="text-sm text-gray-600 leading-tight">{currentAddress}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        
        <div className="flex justify-between items-end">
          <label
            htmlFor="registrationNumber"
            className="text-sm font-semibold text-gray-700 ml-1"
          >
            Número da matrícula
          </label>
        </div>

        <div className="relative group">
          <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none">
            <Building className="size-5" />
          </div>

          <input
            id="registrationNumber"
            type="text"
            inputMode="numeric"
            disabled={unknownRegistration}
            placeholder="Ex: 123456 ou 123.456"
            maxLength={7}
            {...register('registrationNumber', {
              pattern: {
                value: /^[0-9.\-/]+$/,
                message: 'Informe apenas números ou separadores válidos'
              }
            })}
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
              disabled:bg-gray-50 disabled:text-gray-400
            `}
          />
        </div>

        {errors.registrationNumber && (
          <p className="text-xs text-red-500 ml-1">
            {errors.registrationNumber.message as string}
          </p>
        )}

        <label className="flex items-center gap-2 ml-1 cursor-pointer select-none">
          <input
            type="checkbox"
            className="size-4 rounded border-gray-300 text-primary focus:ring-primary/20"
            {...register('unknownRegistration')}
            onChange={(e) => {
              setValue('unknownRegistration', e.target.checked)
              if (e.target.checked) {
                setValue('registrationNumber', '')
                trigger('registrationNumber')
              }
            }}
          />
          <span className="text-sm text-gray-600">Não conheço o número da matrícula</span>
        </label>

        <p className="text-xs text-gray-500 ml-1 leading-relaxed">
          O número da matrícula é o registro único do imóvel no cartório.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-end">
          <label
            htmlFor="complement"
            className="text-sm font-semibold text-gray-700 ml-1"
          >
            Complementos
          </label>
        </div>

        <div className="relative group">
          <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none">
            <Building className="size-5" />
          </div>

          <textarea
            id="complement"
            rows={4}
            maxLength={150}
            disabled={noComplement}
            placeholder="Ex: Apartamento 10, Bloco B, Casa 2..."
            {...register('addressComplement')}

            onFocus={handleInputScroll}
            onClick={handleInputScroll}

            className={`
              w-full 
              pl-12 pr-4 pt-4 pb-10
              bg-white 
              border ${errors.addressComplement ? 'border-red-500' : 'border-gray-200'}
              rounded-xl
              text-sm text-gray-900 
              placeholder:text-gray-400 
              resize-none
              outline-none 
              transition-all duration-200
              focus:border-primary 
              focus:ring-4 focus:ring-primary/10
              disabled:bg-gray-50 disabled:text-gray-400
            `}
          />

          <span className="absolute bottom-3 right-4 text-xs text-gray-400 font-medium pointer-events-none">
            {currentLength}/150
          </span>
        </div>

        {errors.addressComplement && (
          <p className="text-xs text-red-500 ml-1">
            {errors.addressComplement.message as string}
          </p>
        )}

        <label className="flex items-center gap-2 ml-1 cursor-pointer select-none">
          <input
            type="checkbox"
            className="size-4 rounded border-gray-300 text-primary focus:ring-primary/20"
            {...register('noComplement')}
            onChange={(e) => {
              setValue('noComplement', e.target.checked)
              if (e.target.checked) {
                setValue('addressComplement', '')
                trigger('addressComplement')
              }
            }}
          />
          <span className="text-sm text-gray-600">Não possuo nenhum complemento</span>
        </label>

        <p className="text-xs text-gray-500 ml-1 leading-relaxed">
          Preencha com informações que facilitem a localização do imóvel, como lote, quadra ou unidade (apto/sala).
        </p>
      </div>
      <div className="
        fixed bottom-0 left-0 right-0 
        px-4 pt-5 pb-7 
        bg-white mt-auto 
        border-t border-gray-100 
        z-10
        supports-[-webkit-touch-callout:none]:pb-22
      ">
        <Button className="w-full h-12 text-base" onClick={handleContinue}>
          Continuar
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
            <Button onClick={handleConfirm} className="w-full">
              Confirmar
            </Button>
            <Button 
              onClick={() => setIsBottomSheetOpen(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 shadow-none border border-gray-200"
            >
              Voltar
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div >
  )
}