'use client'

import { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import { useRouter } from 'next/navigation'
import { Home, MouseOff, FileText, BellDot, Package, ArrowUp } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { useQuery, useMutation } from '@tanstack/react-query'
import TextTitle from '@/components/text-title'
import AutoCompleteAddressInput from '@/components/auto-complete-address-input'
import LoadingOverlay from '@/components/loading-overlay'
import Button from '@/components/button'
import useDebounce from '@/hooks/use-debounce'
import { queryKey } from '@/constants/queries'
import { listAddresses, listAddress, listRegistry } from '@/services/addresses'

const IS_DEBUG_MODE = process.env.NEXT_PUBLIC_ENABLE_DEBUG_MODE === 'true'

const initialHomeItems = [
  { Icon: Home, text: 'Pesquisa rápida que revela tudo do imóvel.' },
  { Icon: MouseOff, text: 'Zero burocracia para entender riscos.' },
  { Icon: FileText, text: 'Relatório simples e direto ao ponto.' },
  { Icon: BellDot, text: 'Decisão segura com alertas inteligentes.' },
]

export const AddressStep = forwardRef(({ onNext }: { onNext: () => void }, ref) => {
  const router = useRouter()
  const { setValue } = useFormContext()
  const [address, setAddress] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus()
    }
  }))

  const debouncedAddress = useDebounce(address, 1000)

  const getValidationError = () => {
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
    enabled: !getValidationError() && debouncedAddress === address && address.length >= 3,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  const getDisplayError = () => {
    const validation = getValidationError()
    if (validation) return validation

    if (!isError || !queryError) return null

    if (IS_DEBUG_MODE) {
      const err = queryError as any
      const debugInfo = {
        TYPE: 'DEBUG_MODE_ON',
        MESSAGE: err.message,
        CODE: err.code,
        STATUS: err.response?.status || 'No Response',
        URL: err.config?.url,
        DATA: err.response?.data,
      }
      return {
        title: `DEBUG: ${err.name || 'Erro'}`,
        subtitle: JSON.stringify(debugInfo, null, 2)
      }
    }

    const friendlyMessage = (queryError as any).message || 'Não foi possível buscar o endereço.'

    return {
      title: 'Não encontramos endereços',
      subtitle: friendlyMessage
    }
  }

  const displayError = getDisplayError()

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

    return response as { address: string; addressNumber: string | null }
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
    <div className="flex flex-col h-full w-full px-4 relative">
      <div className="flex-1 flex flex-col gap-5 pt-4">
        <TextTitle className="text-white">Para começar, onde fica seu imóvel?</TextTitle>

        <div className="relative">
          <AutoCompleteAddressInput
            ref={inputRef}
            placeholder="Buscar endereço"
            options={data}
            onChange={handleChangeAddress}
            onConfirm={handleSubmit}
            isLoading={isLoading}
            onSelectAddress={handleSelectAddress}
            isLoadingAddress={isLoadingListAddress}
            error={displayError}
            isDirty={isEnabled}
            onClear={handleClearAddress}
          />

          {!address?.length && (
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce pointer-events-none">
              <ArrowUp className="size-6 text-primary mb-1" />
              <span className="text-primary font-bold text-sm bg-primary/10 px-3 py-1 rounded-full whitespace-nowrap">
                Toque aqui para digitar o endereço
              </span>
            </div>
          )}
        </div>

        {IS_DEBUG_MODE && (data || isError) && (
          <div className="w-full mt-4">
            <p className="text-[10px] text-gray-500 font-bold mb-1">CONSOLE DEBUG (ENV ON):</p>
            <pre className="p-2 bg-slate-950 text-green-400 text-[10px] leading-tight overflow-x-auto max-h-60 rounded border border-gray-700 whitespace-pre-wrap font-mono break-all">
              {isError
                ? displayError?.subtitle
                : `SUCESSO:\n${JSON.stringify(data, null, 2)}`
              }
            </pre>
          </div>
        )}

        {!address?.length && (
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-6 mt-10">
            {initialHomeItems.map(({ Icon, text }) => (
              <div className="flex items-start gap-4" key={text}>
                <div className="p-2 bg-primary/5 rounded-xl">
                  <Icon className="size-5 text-primary" />
                </div>
                <p className="text-sm text-gray-600 leading-tight pt-1.5">{text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {!address?.length && (
        <div className="w-full mt-auto py-6">
          <Button
            href="/consultas" 
            className="flex items-center justify-center gap-2 w-full shadow-lg"
          >
            <Package className="size-5" />
            Minhas Consultas
          </Button>
        </div>
      )}

      <LoadingOverlay
        isLoading={isLoadingListRegistry}
        message="Buscando dados do cartório"
      />
    </div>
  )
})