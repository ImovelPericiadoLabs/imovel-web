'use client'

import { useState, useRef, useImperativeHandle, forwardRef, useCallback, useMemo, useEffect } from 'react'
import { Home, MouseOff, FileText, BellDot, Package, ArrowUp } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { useQuery, useMutation } from '@tanstack/react-query'
import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'
import AutoCompleteAddressInput from '@/components/auto-complete-address-input'
import LoadingOverlay from '@/components/loading-overlay'
import Button from '@/components/button'
import useDebounce from '@/hooks/use-debounce'
import { queryKey } from '@/constants/queries'
import { listAddresses, listAddress, listRegistry } from '@/services/addresses'
import { trackGtmEvent } from '@/utils/analytics/gtm'

const IS_DEBUG_MODE = process.env.NEXT_PUBLIC_ENABLE_DEBUG_MODE === 'true'

const initialHomeItems = [
  { Icon: Home, text: 'Pesquisa rápida que revela tudo do imóvel.' },
  { Icon: MouseOff, text: 'Zero burocracia para entender riscos.' },
  { Icon: FileText, text: 'Relatório simples e direto ao ponto.' },
  { Icon: BellDot, text: 'Decisão segura com alertas inteligentes.' },
]

export const AddressStep = forwardRef<{ focus: () => boolean }, { onNext: () => void }>(({ onNext }, ref) => {
  const { setValue } = useFormContext()
  const [address, setAddress] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const lastSearchQueryRef = useRef<string | null>(null)
  const lastSearchErrorRef = useRef<string | null>(null)

  useImperativeHandle(ref, () => ({
    focus: () => {
      const el = inputRef.current
      if (!el) return false
      el.focus()
      // Garantir que o teclado abra no iOS
      el.click()
      // Forçar scroll para o input
      el.scrollIntoView({ behavior: 'auto', block: 'center' })
      return document.activeElement === el
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
      trackGtmEvent('address_registry_loaded', {
        event_category: 'address',
        event_label: 'registry_loaded',
        event_description: 'Cartório associado ao endereço foi carregado.',
        registry_name: data?.name,
        has_registry: Boolean(data?.name),
      })
    },
  })

  const { mutateAsync: listAddressMutate, isPending: isLoadingListAddress } = useMutation({
    mutationFn: listAddress,
  })

  const handleSelectAddress = useCallback(async (placeId: string) => {
    setValue('placeId', placeId)

    const response = await listAddressMutate({ address, placeId })

    trackGtmEvent('address_selected', {
      event_category: 'address',
      event_label: 'select',
      event_description: 'Endereço selecionado na lista de resultados.',
      place_id: placeId,
      address_length: address?.length || 0,
    })

    return response as { address: string; addressNumber: string | null }
  }, [setValue, listAddressMutate, address])

  const handleChangeAddress = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value)
  }, [])

  const handleSubmit = useCallback(async (value: string) => {
    setValue('address', value)
    await listRegistryMutate(value)
    trackGtmEvent('address_confirmed', {
      event_category: 'address',
      event_label: 'confirm',
      event_description: 'Endereço confirmado para avançar no fluxo.',
      address_length: value?.length || 0,
    })
    onNext()
  }, [setValue, listRegistryMutate, onNext])

  const handleClearAddress = useCallback(() => {
    setAddress('')
  }, [])

  const handleFocusClick = useCallback(() => {
    // Não usar preventDefault aqui para permitir que o sistema entenda como uma interação direta se necessário
    inputRef.current?.focus()
    inputRef.current?.click()
  }, [])

  useEffect(() => {
    const validationError = getValidationError()
    if (!debouncedAddress || debouncedAddress.length < 3) return
    if (debouncedAddress !== address) return
    if (validationError) return

    if (lastSearchQueryRef.current === debouncedAddress) return
    lastSearchQueryRef.current = debouncedAddress

    trackGtmEvent('address_search', {
      event_category: 'address',
      event_label: 'search',
      event_description: 'Busca de endereço iniciada.',
      query_length: debouncedAddress.length,
    })
  }, [debouncedAddress, address, getValidationError])

  useEffect(() => {
    if (!isError || !queryError) return
    const message = (queryError as { message?: string }).message || 'Erro ao buscar endereço.'
    if (lastSearchErrorRef.current === message) return
    lastSearchErrorRef.current = message

    trackGtmEvent('address_search_error', {
      event_category: 'address',
      event_label: 'search_error',
      event_description: 'Erro ao buscar endereço.',
      error_message: message,
    })
  }, [isError, queryError])

  return (
    <div className="relative flex h-full w-full flex-col px-4 pb-32 md:px-6 xl:px-8">
      <div className="flex-1 flex flex-col gap-4">
        <div className="mb-6 flex max-w-[100%] flex-col gap-2 pb-1 lg:mx-auto lg:max-w-2xl lg:text-center">
          <TextTitle className="text-balance text-black leading-snug sm:leading-6 md:text-xl lg:text-2xl">
            Digite o endereço do imóvel para começar
          </TextTitle>
          <TextSubtitle className="text-pretty text-black/70 leading-snug sm:leading-4 md:text-[15px] lg:mx-auto lg:max-w-xl lg:text-base">
            Escreva rua, número e bairro para avançar com segurança
          </TextSubtitle>
        </div>

        <div className="relative">
          {/* div (não button): o autocomplete inclui BottomSheets com <Button>, e <button> não pode aninhar <button> */}
          <div
            onClick={handleFocusClick}
            onTouchStart={handleFocusClick}
            className="w-full text-left outline-none cursor-text"
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
          </div>

          {!address?.length && (
            <button 
              onClick={handleFocusClick}
              onTouchStart={handleFocusClick}
              className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce cursor-pointer group outline-none"
            >
              <ArrowUp className="size-6 text-primary mb-1 group-active:scale-90 transition-transform" />
              <span className="text-primary font-bold text-sm bg-primary/10 px-3 py-1 rounded-lg whitespace-nowrap group-active:scale-95 transition-transform">
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
            className="flex text-white items-center justify-center gap-2 w-full shadow-lg"
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
