'use client'

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Search, X, MapPin, CircleAlert, MapPinX, Check, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/tailwind'
import Button from '@/components/button'
import TextTitle from '@/components/text-title'
import TextSubtitle from '../text-subtitle'
import Skeleton from '@/components/skeleton'
import BottomSheet from '@/components/bottom-sheet'
import Input from '@/components/input'

type Option = {
  primary?: string
  secondary?: string
  placeId?: string
  value?: string
}

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  options?: Option[]
  isLoading?: boolean
  onConfirm: (address: string) => void
  isLoadingAddress?: boolean
  onSelectAddress: (value: string) => Promise<{ address: string; addressNumber: string | null }>
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

  const internalInputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => internalInputRef.current as HTMLInputElement)

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
    internalInputRef.current?.focus()
  }

  function hasHouseNumber(address: string): boolean {
    const afterFirstComma = address.split(',')[1]?.trim()

    if (!afterFirstComma) return false

    const regex = /^(\d+[A-Za-z]?|s\/?n)\b/i
    return regex.test(afterFirstComma)
  }

  async function handleSelectAddress({ placeId }: Option) {
    handleOpenAddressSheet()

    const result = await onSelectAddress(placeId as string)

    if (!result.addressNumber) {
      setIsOpenConsentSheet(true)
      handleCloseAddressSheet()
      setValue(result.address)
      return
    }

    setValue(result.address)
  }

  function handleContinueWithoutNumber() {
    setIsOpenConsentSheet(false)
    onConfirm(value)
  }

  function handleOpenAddressSheet() {
    setIsOpenAddressSheet(true)
  }

  function handleCloseAddressSheet() {
    setIsOpenAddressSheet(false)
  }

  function handleChangeAddress() {
    handleFocusInput()

    handleCloseAddressSheet()

    handleCloseErrorSheet()

    handleCloseNotFoundAddressSheet()

    setIsOpenConsentSheet(false)

    setAddressError(null)
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
    if (isOpenAddressSheet || isOpenErrorSheet || isOpenNotFoundAddressSheet || isOpenConsentSheet || error) {
      internalInputRef.current?.blur()
    }
  }, [isOpenAddressSheet, isOpenErrorSheet, isOpenNotFoundAddressSheet, isOpenConsentSheet, error])

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
          autoFocus
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
              className="flex items-start gap-4 px-7 pb-4 border-b border-hr last:border-b-0 cursor-pointer"
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
              className="w-full flex items-start gap-4 px-7 pb-4 border-b border-hr last:border-b-0 cursor-pointer"
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
              onClick={() => {
                onConfirm(value)
              }} 
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
              O endereço selecionado não possui um número.
            </p>
            
            <p className="text-sm text-gray-500 leading-relaxed">
              Deseja continuar assim mesmo ou prefere corrigir?
            </p>
          </div>

          <div className="flex flex-col w-full gap-3">
            <Button onClick={handleContinueWithoutNumber} className="h-12 rounded-xl" icon={<Check className="size-5" />}>
              Continuar assim mesmo
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

export default AutoCompleteInput
