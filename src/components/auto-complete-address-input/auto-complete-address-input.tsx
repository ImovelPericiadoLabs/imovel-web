'use client'

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Search, X, MapPin, CircleAlert, MapPinX, Check, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/tailwind'
import Button from '@/components/button'
import TextTitle from '@/components/text-title'
import Skeleton from '@/components/skeleton'
import BottomSheet from '@/components/bottom-sheet'
import Input from '@/components/input'
import type { AddressConfirmPayload, PlaceResponseFromApi } from '@/services/addresses/addresses'

type Option = {
  primary?: string
  secondary?: string
  placeId?: string
  value?: string
}

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  options?: Option[]
  isLoading?: boolean
  onConfirm: (payload: AddressConfirmPayload) => void
  isLoadingAddress?: boolean
  onSelectAddress: (value: string) => Promise<AddressConfirmPayload>
  error?: {
    title: string
    subtitle: string
  } | null
  isDirty?: boolean
  onClear?: () => void
  onFocus?: () => void
}

const loadingOptions = Array.from({ length: 5 }, (_, i) => ({
  value: i,
}))

function buildConfirmPayload(
  address: string,
  placeResponse: PlaceResponseFromApi | undefined,
  streetNumber: string | null,
  noStreetNumber: boolean,
): AddressConfirmPayload {
  const trimmed = streetNumber?.trim() || ''
  const hasNumber = !noStreetNumber && Boolean(trimmed)

  const place_response: PlaceResponseFromApi = {
    ...placeResponse,
    formatted_address: placeResponse?.formatted_address || address,
    street_number: hasNumber ? trimmed : undefined,
    address_has_number: hasNumber,
  }

  return {
    address,
    addressNumber: hasNumber ? trimmed : null,
    postalCode: placeResponse?.postal_code,
    place_response,
  }
}

const AutoCompleteInput = forwardRef<HTMLInputElement, Props>(({
  options,
  isLoading,
  isLoadingAddress,
  onConfirm,
  onSelectAddress,
  error,
  isDirty,
  onClear,
  onFocus,
  ...props
}, ref) => {
  const [value, setValue] = useState('')
  const [isOpenAddressSheet, setIsOpenAddressSheet] = useState(false)
  const [isOpenErrorSheet, setIsOpenErrorSheet] = useState(false)
  const [isOpenNotFoundAddressSheet, setIsOpenNotFoundAddressSheet] = useState(false)
  const [isOpenConsentSheet, setIsOpenConsentSheet] = useState(false)
  const [addressError, setAddressError] = useState<{ title: string; subtitle: string } | null>(null)
  const [pendingPlace, setPendingPlace] = useState<AddressConfirmPayload | null>(null)
  const [manualNumber, setManualNumber] = useState('')
  const [noStreetNumber, setNoStreetNumber] = useState(false)

  const internalInputRef = useRef<HTMLInputElement>(null)
  const propertyNumberInputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => internalInputRef.current as HTMLInputElement)

  const canConfirmWithoutNumber =
    manualNumber.trim().length > 0 || noStreetNumber

  function handleFocusInput() {
    const el = internalInputRef?.current

    el?.focus()
    el?.setSelectionRange(el.value.length, el.value.length)
  }

  function handleCloseErrorSheet() {
    handleFocusInput()
    setIsOpenErrorSheet(false)
    setAddressError(null)
  }

  function handleCloseNotFoundAddressSheet() {
    handleFocusInput()
    setIsOpenNotFoundAddressSheet(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (props.onChange) {
      props.onChange(e)
    }

    setValue(e.target.value)
  }

  function handleClearInput() {
    if (onClear) {
      onClear()
    }
    setValue('')
    setPendingPlace(null)
    setManualNumber('')
    setNoStreetNumber(false)
    internalInputRef.current?.focus()
  }

  async function handleSelectAddress({ placeId }: Option) {
    handleOpenAddressSheet()

    const result = await onSelectAddress(placeId as string)

    if (!result.addressNumber) {
      setPendingPlace(result)
      setManualNumber('')
      setNoStreetNumber(false)
      setIsOpenConsentSheet(true)
      handleCloseAddressSheet()
      setValue(result.address)
      return
    }

    setValue(result.address)
    setPendingPlace(result)
  }

  function handleConfirmWithNumber() {
    if (!pendingPlace) return

    const payload = buildConfirmPayload(
      pendingPlace.address,
      pendingPlace.place_response,
      manualNumber,
      noStreetNumber,
    )

    setIsOpenConsentSheet(false)
    onConfirm(payload)
    setPendingPlace(null)
    setManualNumber('')
    setNoStreetNumber(false)
  }

  function handleConfirmAddressSheet() {
    if (!pendingPlace?.addressNumber) return

    onConfirm(
      buildConfirmPayload(
        value,
        pendingPlace.place_response,
        pendingPlace.addressNumber,
        false,
      ),
    )
  }

  function handleOpenAddressSheet() {
    setIsOpenAddressSheet(true)
  }

  function handleCloseAddressSheet() {
    setIsOpenAddressSheet(false)
  }

  function handleChangeAddress() {
    handleCloseAddressSheet()

    handleCloseErrorSheet()

    handleCloseNotFoundAddressSheet()

    setIsOpenConsentSheet(false)

    setAddressError(null)
    setPendingPlace(null)
    setManualNumber('')
    setNoStreetNumber(false)
    
    // Blur do elemento focado para impedir que foco retorne ao background
    // quando inert é removido do container
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  useEffect(() => {
    setIsOpenErrorSheet(error !== null)
  }, [error])

  useEffect(() => {
    if (!isLoading && isDirty && value?.length && !options?.length) {
      setIsOpenNotFoundAddressSheet(true)
    }
  }, [options, isLoading, isDirty, value])

  useEffect(() => {
    if (isOpenErrorSheet || isOpenNotFoundAddressSheet) {
      internalInputRef.current?.blur()
    }
  }, [isOpenErrorSheet, isOpenNotFoundAddressSheet])

  return (
    <div
      className={cn({
        'bg-white rounded-xl': !!options?.length,
      })}
    >
      <div className="relative">
        <Search className="top-4.5 left-3.5 absolute text-primary size-5" />

        {!!value.length && (
          <X
            className="absolute right-3.5 top-5 size-4 text-input-border cursor-pointer"
            onClick={handleClearInput}
          />
        )}

        <Input
          ref={internalInputRef}
          type="text"
          {...props}
          value={value}
          onChange={handleChange}
          onFocus={onFocus}
        />
      </div>

      {isLoading && (
        <div className="w-full space-y-4 mt-3.5">
          {loadingOptions?.map((address) => (
            <div
              key={address.value}
              className="flex items-start gap-4 px-7 pb-4 border-b border-gray-200 last:border-b-0 cursor-pointer"
            >
              <div className="shrink-0 mt-1">
                <MapPin className="size-6" />
              </div>
              <div className="flex-1 text-start min-w-0">
                <Skeleton className="w-64 h-4 rounded-full" />

                <Skeleton className="w-32 h-4 rounded-full mt-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!!value?.length && (
        <div className="w-full space-y-4 mt-3.5">
          {options?.map((address) => (
            <button
              key={address.value}
              className="w-full flex items-start gap-4 px-7 pb-4 border-b border-gray-200 last:border-b-0 cursor-pointer"
              onClick={() => {
                handleSelectAddress(address)
              }}
            >
              <div className="shrink-0 mt-1">
                <MapPin className="size-6" />
              </div>
              <div className="flex-1 text-start min-w-0">
                <h3 className="text-sm font-medium leading-[130%]">{address.primary}</h3>

                <p className="text-xs font-normal leading-[130%] text-gray mt-1">
                  {address.secondary}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <BottomSheet
        isOpen={isOpenErrorSheet || !!addressError?.title?.length}
        onClose={handleChangeAddress}
      >
        <div className="px-6 py-8 pb-12 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-50 rounded-xl">
                <CircleAlert className="size-6" />
              </div>
              <TextTitle className="text-xl font-bold">{error?.title || addressError?.title}</TextTitle>
            </div>
            
            <p className="text-lg font-semibold leading-tight text-gray-700">
              {error?.subtitle || addressError?.subtitle}
            </p>
          </div>

          <Button onClick={handleCloseErrorSheet} className="h-12 rounded-xl" icon={<Check className="size-5" />}>
            Entendi
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={isOpenNotFoundAddressSheet && !error} onClose={handleChangeAddress}>
        <div className="px-6 py-8 pb-12 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-primary">
              <div className="p-2 bg-primary/5 rounded-xl">
                <MapPinX className="size-6" />
              </div>
              <TextTitle className="text-xl font-bold">Não encontramos seu endereço</TextTitle>
            </div>
            
            <p className="text-lg font-semibold leading-tight text-gray-700">
              Verifique o local e tente novamente.
            </p>
          </div>

          <Button onClick={handleCloseNotFoundAddressSheet} className="h-12 rounded-xl" icon={<Check className="size-5" />}>
            Entendi
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={isOpenAddressSheet} onClose={handleChangeAddress}>
        <div className="px-6 py-8 pb-12 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-dark">
              <div className="p-2 bg-gray-50 rounded-xl">
                <MapPin className="size-6" />
              </div>
              <TextTitle className="text-xl font-bold">Confirmar este endereço?</TextTitle>
            </div>

            <div className="border border-gray-100 rounded-xl px-4 py-4 bg-gray-50 flex flex-col gap-3">
              {isLoadingAddress ? (
                <Skeleton className="w-full h-5 rounded-full" />
              ) : (
                <p className="text-gray-700 font-semibold text-base leading-tight">{value}</p>
              )}

              {!isLoadingAddress && (
                <button
                  onClick={handleChangeAddress}
                  className="w-fit text-primary font-bold text-sm hover:underline"
                >
                  Mudar endereço
                </button>
              )}
            </div>
          </div>

          {!isLoadingAddress ? (
            <Button 
              onClick={handleConfirmAddressSheet}
              className="h-12 rounded-xl" 
              icon={<Check className="size-5" />}
            >
              Confirmar
            </Button>
          ) : (
            <Skeleton className="w-full h-12 rounded-xl" />
          )}
        </div>
      </BottomSheet>

      <BottomSheet isOpen={isOpenConsentSheet} onClose={handleChangeAddress}>
        <div className="px-6 py-8 pb-12 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-yellow-600">
              <div className="p-2 bg-yellow-50 rounded-xl">
                <CircleAlert className="size-6" />
              </div>
              <TextTitle className="text-xl font-bold">Endereço sem número</TextTitle>
            </div>
            
            <p className="text-lg font-semibold leading-tight text-gray-700">
              O Google não retornou o número deste imóvel.
            </p>

            <div className="flex flex-col gap-2">
              <label htmlFor="property-number" className="text-sm font-semibold text-gray-700">
                Número do imóvel
              </label>
              <Input
                ref={propertyNumberInputRef}
                id="property-number"
                placeholder="Ex.: 123 ou S/N"
                type="text"
                inputMode="numeric"
                autoFocus
                value={manualNumber}
                onChange={(e) => {
                  // Validação numérica: permite apenas números, separadores e "S/N"
                  const inputValue = e.target.value
                  const value = inputValue.replace(/[^\d\s\-\/SN]/gi, '')
                  
                  setManualNumber(value)
                  if (value.trim()) {
                    setNoStreetNumber(false)
                  }
                }}
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 size-4 rounded border-gray-300"
                checked={noStreetNumber}
                onChange={(e) => {
                  setNoStreetNumber(e.target.checked)
                  if (e.target.checked) {
                    setManualNumber('')
                  }
                }}
              />
              <span className="text-sm text-gray-700 leading-snug">
                Imóvel sem número
              </span>
            </label>
          </div>

          <div className="flex flex-col w-full gap-3">
            <Button
              onClick={handleConfirmWithNumber}
              disabled={!canConfirmWithoutNumber}
              className="h-12 rounded-xl"
              icon={<Check className="size-5" />}
            >
              Confirmar endereço
            </Button>
            <Button 
              variant="outline" 
              onClick={handleChangeAddress} 
              className="h-12 rounded-xl"
              icon={<ChevronRight className="size-5 rotate-180" />}
            >
              Corrigir endereço
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
})

AutoCompleteInput.displayName = 'AutoCompleteInput'

export default AutoCompleteInput
