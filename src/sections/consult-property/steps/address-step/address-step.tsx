import { useFormContext } from 'react-hook-form'
import TextTitle from '@/components/text-title'
import type { FormContextWithSteps } from '@/sections/consult-property/types'
import AutoCompleteAddressInput from '@/components/auto-complete-address-input'

export function AddressStep() {
  const { handleNextStep, setValue } = useFormContext() as FormContextWithSteps

  async function handleSubmit(value: string) {
    setValue('address', value)
    handleNextStep()
  }

  const streets = [
    {
      street: 'Rua Pamplona',
      city: 'Jardim Paulista, São Paulo/SP',
      value: 'rua-pamplona-sao-paulo',
    },
    {
      street: 'Rua Pampulha',
      city: 'Paraisópolis - MG',
      value: 'rua-pampulha-paraisopolis',
    },
    {
      street: 'Avenida Paulista',
      city: 'Bela Vista, São Paulo/SP',
      value: 'avenida-paulista-sao-paulo',
    },
    {
      street: 'Rua das Flores',
      city: 'Centro, Curitiba/PR',
      value: 'rua-das-flores-curitiba',
    },
    {
      street: 'Rua XV de Novembro',
      city: 'Centro, Joinville/SC',
      value: 'rua-xv-de-novembro-joinville',
    },
    {
      street: 'Rua Atlântica',
      city: 'Copacabana, Rio de Janeiro/RJ',
      value: 'rua-atlantica-rio-de-janeiro',
    },
    {
      street: 'Avenida Beira Mar',
      city: 'Meireles, Fortaleza/CE',
      value: 'avenida-beira-mar-fortaleza',
    },
    {
      street: 'Rua das Palmeiras',
      city: 'Botafogo, Rio de Janeiro/RJ',
      value: 'rua-das-palmeiras-rio-de-janeiro',
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <TextTitle>Para começar, onde fica seu imóvel?</TextTitle>

      <AutoCompleteAddressInput
        placeholder="Buscar endereço"
        options={streets}
        onConfirm={handleSubmit}
      />
    </div>
  )
}
