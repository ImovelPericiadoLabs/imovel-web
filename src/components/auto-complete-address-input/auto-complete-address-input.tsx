'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X, MapPin, CircleAlert, MapPinX } from 'lucide-react'
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
}

const loadingOptions = Array.from({ length: 5 }, (_, i) => ({
  value: i,
}))

export default function AutoCompleteInput({
  options,
  isLoading,
  isLoadingAddress,
  onConfirm,
  onSelectAddress,
  error,
  isDirty,
  onClear,
  ...props
}: Props) {
  const [value, setValue] = useState('')
  const [isOpenAddressSheet, setIsOpenAddressSheet] = useState(false)
  const [isOpenErrorSheet, setIsOpenErrorSheet] = useState(false)
  const [isOpenNotFoundAddressSheet, setIsOpenNotFoundAddressSheet] = useState(false)
  const [addressError, setAddressError] = useState<{ title: string; subtitle: string } | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  function handleFocusInput() {
    const el = inputRef?.current

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
    inputRef.current?.focus()
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
      setAddressError({
        title: 'Número do endereço obrigatório',
        subtitle: 'O local selecionado não possui numeração. Por favor, informe o número.',
      })

      handleCloseAddressSheet()
      inputRef?.current?.blur()
      return
    }

    setValue(result.address)
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

    setAddressError(null)
  }

  useEffect(() => {
    setIsOpenErrorSheet(error !== null)
  }, [error])

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (error) {
      inputRef.current?.blur()
    }
  }, [error])

  useEffect(() => {
    if (!isLoading && isDirty && value?.length && !options?.length) {
      setIsOpenNotFoundAddressSheet(true)
      inputRef.current?.blur()
    }
  }, [options, isLoading, isDirty, value])

  return (
    <div
      className={cn({
        'bg-white rounded-t-4xl rounded-b-[1.75rem]': !!options?.length,
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
          ref={inputRef}
          autoFocus
          type="text"
          {...props}
          value={value}
          onChange={handleChange}
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
        <div className="px-6 py-8 pb-12 max-h-[70vh] overflow-y-auto flex flex-col items-center gap-2 text-center">
          <div className="rounded-full bg-error-50 size-14 flex items-center justify-center">
            <div className="rounded-full size-10 bg-error-100 flex items-center justify-center">
              <CircleAlert stroke="#D92D20" className="size-7 text-amber-100" />
            </div>
          </div>
          <TextTitle className="text-dark">{error?.title || addressError?.title}</TextTitle>
          <TextSubtitle className="mb-2 text-gray-2">
            {error?.subtitle || addressError?.subtitle}
          </TextSubtitle>
          <Button onClick={handleCloseErrorSheet}>Entendi</Button>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={isOpenNotFoundAddressSheet && !error} onClose={handleChangeAddress}>
        <div className="px-6 py-8 pb-12 max-h-[70vh] overflow-y-auto flex flex-col items-center gap-2 text-center">
          <div className="rounded-full bg-violet-50 size-14 flex items-center justify-center">
            <div className="rounded-full size-10 bg-violet-100 flex items-center justify-center">
              <MapPinX className="size-7 text-primary" />
            </div>
          </div>
          <TextTitle className="text-dark">Não encontramos seu endereço</TextTitle>
          <TextSubtitle className="mb-2 text-gray-2">
            Verifique o local e tente novamente.
          </TextSubtitle>
          <Button onClick={handleCloseNotFoundAddressSheet}>Entendi</Button>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={isOpenAddressSheet} onClose={handleChangeAddress}>
        <div className="px-6 py-8 pb-12 max-h-[70vh] overflow-y-auto">
          <TextTitle className="mb-7 text-dark">Confirmar este endereço?</TextTitle>

          <div className="border border-[#EBEBEB] rounded-[0.25rem] px-4 py-3 mb-6 bg-white">
            <div className="flex flex-col items-start">
              <MapPin className="size-5 text-dark mb-2" />
              {isLoadingAddress ? (
                <Skeleton className="w-80 h-4 mt-2 rounded-full" />
              ) : (
                <p className="text-dark font-medium text-base leading-6 mb-3">{value}</p>
              )}

              {isLoadingAddress ? (
                <Skeleton className="w-20 h-4 mt-4 rounded-full" />
              ) : (
                <button
                  onClick={handleChangeAddress}
                  className="cursor-pointer text-primary font-semibold text-sm transition-colors"
                >
                  Mudar
                </button>
              )}
            </div>
          </div>

          {!isLoadingAddress ? (
            <Button onClick={() => onConfirm(value)}>Confirmar</Button>
          ) : (
            <Skeleton className="w-full h-12 mt-4 rounded-full" />
          )}
        </div>
      </BottomSheet>
    </div>
  )
}
