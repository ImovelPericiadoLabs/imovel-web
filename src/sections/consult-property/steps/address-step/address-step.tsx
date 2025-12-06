'use client'

import { useState } from 'react'
import { Home, MouseOff, FileText, BellDot } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { useQuery, useMutation } from '@tanstack/react-query'
import TextTitle from '@/components/text-title'
import AutoCompleteAddressInput from '@/components/auto-complete-address-input'
import LoadingOverlay from '@/components/loading-overlay'
import useDebounce from '@/hooks/use-debounce'
import { queryKey } from '@/constants/queries'
import { listAddresses, listAddress, listRegistry } from '@/services/addresses'

const initialHomeItems = [
  { Icon: Home, text: 'Pesquisa rápida que revela tudo do imóvel.' },
  { Icon: MouseOff, text: 'Zero burocracia para entender riscos.' },
  { Icon: FileText, text: 'Relatório simples e direto ao ponto.' },
  { Icon: BellDot, text: 'Decisão segura com alertas inteligentes.' },
]

export function AddressStep({ onNext }: { onNext: () => void }) {
  const { setValue } = useFormContext()
  const [address, setAddress] = useState('')

  const debouncedAddress = useDebounce(address, 1000)

  const getError = () => {
    if (debouncedAddress?.length > 0) {
      if (debouncedAddress?.length !== address?.length) return null
      if (debouncedAddress.length < 3) {
        return {
          title: 'Texto muito curto',
          subtitle: 'Digite pelo menos 3 caracteres para realizar a busca.',
        }
      }
    }
    return null
  }

  const { data, isLoading, isEnabled, isError, error: queryError } = useQuery({
    queryKey: [queryKey.getAddresses, debouncedAddress],
    queryFn: () => listAddresses(debouncedAddress),
    enabled: !getError() && debouncedAddress === address && address.length >= 3,
    refetchOnWindowFocus: false,
    retry: 0,
  })

  const getDebugInfo = () => {
    if (isLoading) return null

    const validationError = getError()
    if (validationError) return validationError

    if (isError && queryError) {
      const err = queryError as any
      const debugData = {
        TYPE: 'ERROR_CATCH',
        MESSAGE: err.message,
        CODE: err.code || err.name,
        STATUS: err.response?.status,
        URL: err.config?.url,
        DATA: err.response?.data,
        HEADERS: err.response?.headers,
      }
      return {
        title: `DEBUG: ERRO (${err.response?.status || 'N/A'})`,
        subtitle: JSON.stringify(debugData, null, 2)
      }
    }

    if (data) {
      return {
        title: 'DEBUG: SUCESSO (200)',
        subtitle: JSON.stringify(data, null, 2)
      }
    }

    return null
  }

  const displayDebug = getDebugInfo()

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
    setValue('placeId', placeId)
    const response = await listAddressMutate({ address, placeId })
    return (response as any).address || ''
  }

  function handleChangeAddress(e: React.ChangeEvent<HTMLInputElement>) {
    setAddress(e.target.value)
  }

  async function handleSubmit(value: string) {
    setValue('address', value)
    await listRegistryMutate(value)
    onNext()
  }

  function handleClearAddress() {
    setAddress('')
  }

  return (
    <div className="flex flex-col gap-5 px-4 relative">
      <TextTitle>Para começar, onde fica seu imóvel?</TextTitle>

      <AutoCompleteAddressInput
        placeholder="Buscar endereço"
        options={[]}
        onChange={handleChangeAddress}
        onConfirm={handleSubmit}
        isLoading={isLoading}
        onSelectAddress={handleSelectAddress}
        isLoadingAddress={isLoadingListAddress}
        error={displayDebug}
        isDirty={isEnabled}
        onClear={handleClearAddress}
      />

      {(data || isError) && (
        <div className="w-full overflow-hidden">
          <pre className="mt-4 p-2 bg-slate-950 text-green-400 text-[10px] leading-tight overflow-x-auto max-h-60 rounded border border-gray-700 whitespace-pre-wrap font-mono break-all">
            {displayDebug?.subtitle}
          </pre>
        </div>
      )}

      {!address?.length && (
        <div className="border border-box p-4 flex flex-col gap-8">
          {initialHomeItems.map(({ Icon, text }) => (
            <div className="flex items-center gap-4" key={text}>
              <Icon className="size-6 text-primary" />
              <p className="text-xs">{text}</p>
            </div>
          ))}
        </div>
      )}

      <LoadingOverlay
        isLoading={isLoadingListRegistry}
        message="Buscando dados do cartório"
      />
    </div>
  )
}