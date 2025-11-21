'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X, MapPin, CircleAlert, MapPinX } from 'lucide-react'
import { cn } from '@/utils/tailwind'
import Button from '@/components/button'
import TextTitle from '@/components/text-title'
import TextSubtitle from '../text-subtitle'
import Skeleton from '@/components/skeleton'
import AddressSheet from '@/components/auto-complete-address-input/components/address-sheet'

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
  onSelectAddress: (value: string) => Promise<string>
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

  function handleCloseErrorSheet() {
    setIsOpenErrorSheet(false)
    setAddressError(null)
  }

  function handleCloseNotFoundAddressSheet() {
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
    const regex = /,\s*(\d+[A-Za-z]?|s\/?n)$/i
    return regex.test(address)
  }

  async function handleSelectAddress({ placeId, primary }: Option) {
    if (!hasHouseNumber(primary as string)) {
      setAddressError({
        title: 'Número do endereço obrigatório',
        subtitle: 'Para prosseguir, informe o número.',
      })

      return
    }

    handleOpenAddressSheet()

    const address = await onSelectAddress(placeId as string)

    setValue(address)
  }

  function handleOpenAddressSheet() {
    setIsOpenAddressSheet(true)
  }

  function handleCloseAddressSheet() {
    setIsOpenAddressSheet(false)
  }

  function handleChangeAddress() {
    const el = inputRef?.current

    el?.focus()
    el?.setSelectionRange(el.value.length, el.value.length)

    handleCloseAddressSheet()

    handleCloseErrorSheet()

    handleCloseNotFoundAddressSheet()

    setAddressError(null)
  }

  useEffect(() => {
    setIsOpenErrorSheet(error !== null)
  }, [error])

  useEffect(() => {
    if (!isLoading && isDirty && value?.length) {
      setIsOpenNotFoundAddressSheet(!options?.length)
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

        <input
          ref={inputRef}
          autoFocus
          className="
            px-9.5  py-4 bg-white w-full rounded-[6rem] border 
            border-input-border shadow-[0_1px_2px_rgba(10,13,18,0.05)] 
             placeholder:text-gray placeholder:text-base placeholder:font-normal placeholder:leading-6
            focus:border-primary focus:ring-1 focus:ring-primary outline-none
            "
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

      {(isOpenAddressSheet ||
        isOpenErrorSheet ||
        isOpenNotFoundAddressSheet ||
        !!addressError?.title?.length) && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-500"
          onClick={handleChangeAddress}
        />
      )}

      <AddressSheet isOpen={isOpenErrorSheet || !!addressError?.title?.length}>
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
      </AddressSheet>

      <AddressSheet isOpen={isOpenNotFoundAddressSheet && !error}>
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
      </AddressSheet>

      <AddressSheet isOpen={isOpenAddressSheet}>
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
      </AddressSheet>
    </div>
  )
}