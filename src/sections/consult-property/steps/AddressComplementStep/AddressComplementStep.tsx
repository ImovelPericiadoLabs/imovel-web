'use client'

import { MapPin, Building } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import TextTitle from '@/components/text-title'
import Button from '@/components/button'

export function AddressComplementStep({ onNext }: { onNext: () => void }) {
  const { register, getValues, trigger, watch } = useFormContext()
  const currentAddress = getValues('address')
  const complementValue = watch('addressComplement') || ''
  const currentLength = complementValue.length

  const handleContinue = async () => {
    const isValid = await trigger(['addressComplement', 'registrationNumber'])
      console.log(getValues())

    if (isValid) {
      onNext()
    }
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

      <div className="flex flex-col gap-2">
        
        <div className="flex justify-between items-end">
          <label
  htmlFor="registrationNumber"
  className="text-sm font-semibold text-gray-700 ml-1"
>
  Número da matrícula
  <span className="text-gray-400 font-normal text-xs ml-1">(Opcional)</span>
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
    placeholder="Ex: 123456 ou 123.456"
    maxLength={20}
    {...register('registrationNumber', {
      pattern: {
        value: /^[0-9.\-/]+$/,
        message: 'Informe apenas números ou separadores válidos'
      }
    })}
    className="
      w-full 
      pl-12 pr-4 py-4
      bg-white 
      border border-gray-200 
      rounded-xl
      text-sm text-gray-900 
      placeholder:text-gray-400 
      outline-none 
      transition-all duration-200
      focus:border-primary 
      focus:ring-4 focus:ring-primary/10
    "
  />
</div>

        <p className="text-xs text-gray-500 ml-1 leading-relaxed">
          Preencha aqui caso tenha informações além do endereço, como o <strong>número da matrícula</strong>, lote, quadra ou unidade (apto/sala).
        </p>
      </div>
      <div className="flex flex-col gap-2">
        
        <div className="flex justify-between items-end">
          <label
            htmlFor="complement"
            className="text-sm font-semibold text-gray-700 ml-1"
          >
            Complementos <span className="text-gray-400 font-normal text-xs ml-1">(Opcional)</span>
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
            placeholder="Ex: Matrícula nº 123.456, Apartamento 10, Bloco B..."
            {...register('addressComplement')}

            onFocus={handleInputScroll}
            onClick={handleInputScroll}

            className="
              w-full 
              pl-12 pr-4 pt-4 pb-10
              bg-white 
              border border-gray-200 
              rounded-xl
              text-sm text-gray-900 
              placeholder:text-gray-400 
              resize-none
              outline-none 
              transition-all duration-200
              focus:border-primary 
              focus:ring-4 focus:ring-primary/10
            "
          />

          <span className="absolute bottom-3 right-4 text-xs text-gray-400 font-medium pointer-events-none">
            {currentLength}/150
          </span>
        </div>

        <p className="text-xs text-gray-500 ml-1 leading-relaxed">
          Preencha aqui caso tenha informações além do endereço, como o <strong>número da matrícula</strong>, lote, quadra ou unidade (apto/sala).
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
    </div >
  )
}