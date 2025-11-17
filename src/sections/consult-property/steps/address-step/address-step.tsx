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
import { listAddresses, listRegistry } from '@/services/addresses'

export function AddressStep() {
  const { handleNextStep, setValue } = useFormContext() as FormContextWithSteps
  const [address, setAddress] = useState('')

  const debouncedAddress = useDebounce(address, 500)

  const { data, isLoading } = useQuery({
    queryKey: [queryKey.getAddresses, debouncedAddress],
    queryFn: () => listAddresses(debouncedAddress),
    enabled: !!debouncedAddress,
    refetchOnWindowFocus: false,
  })

  const { mutateAsync, isPending } = useMutation({
    mutationFn: listRegistry,
    onSuccess(data) {
      setValue('registry', data)
    },
  })

  function handleChangeAddress(e: React.ChangeEvent<HTMLInputElement>) {
    setAddress(e.target.value)
  }

  async function handleSubmit(value: string) {
    setValue('address', value)
    await mutateAsync(value)
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
      />

      <LoadingOverlay isLoading={isPending} message="Buscando dados do cartório" />
    </div>
  )
}
