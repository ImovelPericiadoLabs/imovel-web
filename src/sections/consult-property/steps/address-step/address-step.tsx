'use client'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useQuery, useMutation } from '@tanstack/react-query'
import TextTitle from '@/components/text-title'
import type { FormContextWithSteps } from '@/sections/consult-property/types'
import AutoCompleteAddressInput from '@/components/auto-complete-address-input'
import LoadingOverlay from '@/components/loading-overlay'
import useDebounce from '@/hooks/use-debounce'
import { queryKey } from '@/constants/queries'
import { listAddresses, listAddress, listRegistry } from '@/services/addresses'

export function AddressStep() {
  const { handleNextStep, setValue } = useFormContext() as FormContextWithSteps
  const [address, setAddress] = useState('')

  const debouncedAddress = useDebounce(address, 500)

  const { data, isLoading } = useQuery({
    queryKey: [queryKey.getAddresses, debouncedAddress],
    queryFn: () => listAddresses(debouncedAddress),
    enabled: debouncedAddress?.length >= 3,
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

  return (
    <div className="flex flex-col gap-5 px-4">
      <TextTitle>Para começar, onde fica seu imóvel?</TextTitle>

      <AutoCompleteAddressInput
        placeholder="Buscar endereço"
        options={data}
        onChange={handleChangeAddress}
        onConfirm={handleSubmit}
        isLoading={isLoading}
        onSelectAddress={handleSelectAddress}
        isLoadingAddress={isLoadingListAddress}
        error={
          debouncedAddress?.length > 0 && debouncedAddress?.length < 3
            ? 'Digite pelo menos 3 caracteres para realizar a busca.'
            : ''
        }
      />

      <LoadingOverlay isLoading={isLoadingListRegistry} message="Buscando dados do cartório" />
    </div>
  )
}
