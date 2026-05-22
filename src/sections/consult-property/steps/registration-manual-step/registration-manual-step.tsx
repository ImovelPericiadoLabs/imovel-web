'use client'

import { Hash } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'
import Button from '@/components/button'
import InfoCard from '@/components/info-card'
import { NotaryOfficeCombobox } from '@/components/notary-office-combobox/notary-office-combobox'
import { FormTypes } from '@/sections/consult-property/validations'
import { trackGtmEvent } from '@/utils/analytics/gtm'

type RegistrationManualStepProps = {
  onNext: () => void
  onBack: () => void
}

export function RegistrationManualStep({ onNext, onBack }: RegistrationManualStepProps) {
  const { register, setValue, watch, trigger, formState } = useFormContext<FormTypes>()
  const regErr = formState.errors.registrationNumber?.message
  const notaryErr = formState.errors.notaryName?.message

  const registrationNumber = watch('registrationNumber')
  const notaryName = watch('notaryName')

  const handleContinue = async () => {
    const reg = String(registrationNumber || '').trim()
    const cart = String(notaryName || '').trim()
    if (reg.length < 1 || cart.length < 3) {
      return
    }
    setValue('unknownRegistration', false, { shouldValidate: true })
    setValue('registrationNumber', reg, { shouldValidate: true })
    setValue('notaryName', cart, { shouldValidate: true })
    const ok = await trigger(['registrationNumber', 'notaryName'])
    if (!ok) return
    trackGtmEvent('registration_manual_continue', {
      event_category: 'consult_flow',
      event_label: 'matricula_cartorio',
      event_description: 'Continuou com matrícula e cartório informados manualmente.',
    })
    onNext()
  }

  const canContinue =
    String(registrationNumber || '').trim().length >= 1 && String(notaryName || '').trim().length >= 3

  return (
    <div className="relative flex-1 px-4 pb-28 md:px-6 lg:pb-16 xl:px-8">
      <div className="mb-4 flex flex-col gap-2 lg:mx-auto lg:max-w-2xl lg:text-center">
        <TextTitle className="text-dark md:text-xl lg:text-2xl">Matrícula e cartório</TextTitle>
        <TextSubtitle className="text-gray-500 md:text-[15px] lg:mx-auto lg:max-w-xl lg:text-base">
          Sem o endereço no mapa, informe o número da matrícula e o nome do cartório de registro de imóveis. Esses dados
          seguem no pedido para localizar o imóvel corretamente.
        </TextSubtitle>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 lg:max-w-xl">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-gray-700">Número da matrícula</span>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary pointer-events-none">
              <Hash className="size-5" />
            </div>
            <input
              type="text"
              inputMode="text"
              autoComplete="off"
              placeholder="Ex.: 12.345 ou 12345"
              maxLength={50}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              {...register('registrationNumber', {
                pattern: {
                  value: /^[0-9.\-/]+$/,
                  message: 'Use apenas números e separadores (. - /)',
                },
              })}
            />
          </div>
          {regErr ? <span className="text-xs text-red-600">{regErr}</span> : null}
        </label>

        <NotaryOfficeCombobox
          inputId="notaryName"
          value={String(notaryName || '')}
          onChange={(v) => setValue('notaryName', v, { shouldValidate: true, shouldDirty: true })}
          onGeoChange={({ uf, city }) => {
            setValue('notaryState', uf, { shouldDirty: true })
            setValue('notaryCity', city, { shouldDirty: true })
          }}
          error={notaryErr ? String(notaryErr) : undefined}
        />

        <InfoCard className="mt-1">
          A matrícula costuma estar na primeira página da escritura. Na lista de cartórios, ao escolher um item o sistema
          grava o número oficial e o nome padrão — você ainda pode ajustar o texto se precisar.
        </InfoCard>

        <div className="mt-6 flex flex-col gap-2 lg:mt-8 lg:flex-row lg:justify-center lg:gap-3">
          <Button
            type="button"
            className="h-11 w-full rounded-xl lg:max-w-xs lg:flex-1"
            disabled={!canContinue}
            onClick={handleContinue}
          >
            Continuar
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl lg:max-w-xs lg:flex-1"
            onClick={onBack}
          >
            Voltar
          </Button>
        </div>
      </div>
    </div>
  )
}
