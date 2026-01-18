'use client'

import { useState, useRef, useImperativeHandle, forwardRef, useCallback, useMemo } from 'react'
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
  const { setValue } = useFormContext()
  const [address, setAddress] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (inputRef.current) {
        inputRef.current.focus()
        // Garantir que o teclado abra no iOS
        inputRef.current.click()
        // Forçar scroll para o input
        inputRef.current.scrollIntoView({ behavior: 'auto', block: 'center' })
      }
    }
  }))

  const debouncedAddress = useDebounce(address, 1000)

  const getValidationError = useCallback(() => {
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
  }, [debouncedAddress, address])

  const { data, isLoading, isEnabled, isError, error: queryError } = useQuery({
    queryKey: [queryKey.getAddresses, debouncedAddress],
    queryFn: () => listAddresses(debouncedAddress),
    enabled: !getValidationError() && debouncedAddress === address && address.length >= 3,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  const getDisplayError = useCallback(() => {
    const validation = getValidationError()
    if (validation) return validation

    if (!isError || !queryError) return null

    if (IS_DEBUG_MODE) {
      const err = queryError as { 
        message?: string; 
        code?: string; 
        response?: { status: number; data: unknown }; 
        config?: { url: string };
        name?: string;
      }
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

    const friendlyMessage = (queryError as { message?: string }).message || 'Não foi possível buscar o endereço.'

    return {
      title: 'Não encontramos endereços',
      subtitle: friendlyMessage
    }
  }, [getValidationError, isError, queryError])

  const displayError = useMemo(() => getDisplayError(), [getDisplayError])

  const { mutateAsync: listRegistryMutate, isPending: isLoadingListRegistry } = useMutation({
    mutationFn: listRegistry,
    onSuccess(data) {
      setValue('registry', data)
    },
  })

  const { mutateAsync: listAddressMutate, isPending: isLoadingListAddress } = useMutation({
    mutationFn: listAddress,
  })

  const handleSelectAddress = useCallback(async (placeId: string) => {
    setValue('placeId', placeId)

    const response = await listAddressMutate({ address, placeId })

    return response as { address: string; addressNumber: string | null }
  }, [setValue, listAddressMutate, address])

  const handleChangeAddress = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value)
  }, [])

  const handleSubmit = useCallback(async (value: string) => {
    setValue('address', value)
    await listRegistryMutate(value)
    onNext()
  }, [setValue, listRegistryMutate, onNext])

  const handleClearAddress = useCallback(() => {
    setAddress('')
  }, [])

  const handleFocusClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Não usar preventDefault aqui para permitir que o sistema entenda como uma interação direta se necessário
    inputRef.current?.focus()
    inputRef.current?.click()
  }, [])

  return (
    <div className="flex flex-col h-full w-full px-4 relative">
      <div className="flex-1 flex flex-col gap-5 pt-4">
        <TextTitle className="text-white">Para começar, onde fica seu imóvel?</TextTitle>

        <div className="relative">
          <button 
            onClick={handleFocusClick}
            onTouchStart={handleFocusClick}
            className="w-full text-left outline-none"
          >
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
          </button>

          {!address?.length && (
            <button 
              onClick={handleFocusClick}
              onTouchStart={handleFocusClick}
              className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce cursor-pointer group outline-none"
            >
              <ArrowUp className="size-6 text-primary mb-1 group-active:scale-90 transition-transform" />
              <span className="text-primary font-bold text-sm bg-primary/10 px-3 py-1 rounded-full whitespace-nowrap group-active:scale-95 transition-transform">
                Toque aqui para digitar o endereço
              </span>
            </button>
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
            icon={<Package className="size-5" />}
          >
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
AddressStep.displayName = 'AddressStep'
