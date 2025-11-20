'use client'
import { useState } from 'react'
import { Home, MouseOff, FileText, BellDot } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { useQuery, useMutation } from '@tanstack/react-query'
import TextTitle from '@/components/text-title'
import type { FormContextWithSteps } from '@/sections/consult-property/types'
import AutoCompleteAddressInput from '@/components/auto-complete-address-input'
import LoadingOverlay from '@/components/loading-overlay'
import useDebounce from '@/hooks/use-debounce'
import { queryKey } from '@/constants/queries'
import { listAddresses, listAddress, listRegistry } from '@/services/addresses'

const initialHomeItems = [
  {
    Icon: Home,
    text: 'Pesquisa rápida que revela tudo do imóvel.',
  },
  {
    Icon: MouseOff,
    text: 'Zero burocracia para entender riscos.',
  },
  {
    Icon: FileText,
    text: 'Relatório simples e direto ao ponto.',
  },
  {
    Icon: BellDot,
    text: 'Decisão segura com alertas inteligentes.',
  },
]

export function AddressStep() {
  const { handleNextStep, setValue } = useFormContext() as FormContextWithSteps
  const [address, setAddress] = useState('')

  const debouncedAddress = useDebounce(address, 1000)

  const getError = () => {
    if (debouncedAddress?.length > 0) {
      if (debouncedAddress?.length !== address?.length) return null

      if (debouncedAddress?.length < 3) {
        return {
          title: 'Texto muito curso',
          subtitle: 'Digite pelo menos 3 caracteres para realizar a busca.',
        }
      }
    }

    return null
  }

  const { data, isLoading, isEnabled } = useQuery({
    queryKey: [queryKey.getAddresses, debouncedAddress],
    queryFn: () => listAddresses(debouncedAddress),
    enabled: !getError() && debouncedAddress?.length > 0,
    refetchOnWindowFocus: false,
  })

  const { mutateAsync: listRegistryMutate, isPending: isLoadingListRegistry } = useMutation({
    mutationFn: listRegistry,
    onSuccess(data) {
      setValue('registry', data)
    },
  })

  const { mutateAsync: listAddressMutate, isPending: isLoadingListAddress } = useMutation({
    mutationFn: listAddress,
  })

  async function handleSelectAddress(placeId: string) {
    const result = await listAddressMutate({
      address,
      placeId,
    })

    return result
  }

  function handleChangeAddress(e: React.ChangeEvent<HTMLInputElement>) {
    setAddress(e.target.value)
  }

  async function handleSubmit(value: string) {
    setValue('address', value)
    await listRegistryMutate(value)
    handleNextStep()
  }

  function handleClearAddress() {
    setAddress('')
  }

  return (
    <div className="flex flex-col gap-5 px-4 relative">
      <TextTitle>Para começar, onde fica seu imóvel?</TextTitle>

      <AutoCompleteAddressInput
        placeholder="Buscar endereço"
        options={data}
        onChange={handleChangeAddress}
        onConfirm={handleSubmit}
        isLoading={isLoading}
        onSelectAddress={handleSelectAddress}
        isLoadingAddress={isLoadingListAddress}
        error={getError()}
        isDirty={isEnabled}
        onClear={handleClearAddress}
      />
      {!debouncedAddress?.length && (
        <div className="border border-box p-4 flex flex-col gap-8">
          {initialHomeItems.map(({ Icon, text }) => (
            <div className="flex items-center gap-4" key={text}>
              <Icon className="size-6 text-primary" />
              <p className="text-xs font-normal leading-[130%]">{text}</p>
            </div>
          ))}
        </div>
      )}

      <LoadingOverlay isLoading={isLoadingListRegistry} message="Buscando dados do cartório" />
    </div>
  )
}
