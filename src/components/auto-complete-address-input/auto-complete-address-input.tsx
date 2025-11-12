'use client'
import { useState } from 'react'
import { Search, X, MapPin } from 'lucide-react'
import { cn } from '@/utils/tailwind'
import Button from '@/components/button'
import TextTitle from '@/components/text-title'

type Option = {
  street: string
  city: string
  value: string
}

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  options: Option[]
  onConfirm: (address: string) => void
}

export default function AutoCompleteInput({ options, onConfirm, ...props }: Props) {
  const [value, setValue] = useState('')
  const [isOpenAddressSheet, setIsOpenAddressSheet] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (props.onChange) {
      props.onChange(e)
    }

    setValue(e.target.value)
  }

  function handleClearInput() {
    setValue('')
  }

  function handleSelectAddress(address: string) {
    handleOpenAddressSheet()
    setValue(address)
  }

  function handleOpenAddressSheet() {
    setIsOpenAddressSheet(true)
  }

  function handleCloseAddressSheet() {
    setIsOpenAddressSheet(false)
  }

  function handleChangeAddres() {
    handleClearInput()
    handleCloseAddressSheet()
  }

  return (
    <div
      className={cn({
        'bg-white p-3 rounded-2xl': !!value.length,
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
          className="
            pl-9.5 pr-3.5 py-4 bg-white w-full rounded-[6rem] border 
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

      {!!value?.length && (
        <div className="w-full space-y-4 mt-3.5">
          {options.map((address) => (
            <div
              key={address.value}
              className="flex items-start gap-4 pb-4 border-b border-hr last:border-b-0 cursor-pointer"
              onClick={() => handleSelectAddress(`${address.street}, ${address.city}`)}
            >
              <div className="shrink-0 mt-1">
                <MapPin className="size-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium leading-[130%]">{address.city}</h3>
                <p className="text-xs font-normal leading-[130%] text-gray mt-1">
                  {address.street}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpenAddressSheet && (
        <div className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-500" />
      )}

      <div
        className={`fixed bottom-0 left-0 right-0 bg-white shadow-[0px_4px_8px_3px_rgba(0,0,0,0.15),0px_1px_3px_rgba(0,0,0,0.3)] rounded-t-[1.75rem] z-50 transition-all duration-500 ease-out ${
          isOpenAddressSheet ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-8 h-1 rounded-full bg-handle" />
        </div>

        <div className="px-6 py-8 pb-12 max-h-[70vh] overflow-y-auto">
          <TextTitle className="mb-7">Confirmar este endereço?</TextTitle>

          <div className="border border-[#EBEBEB] rounded-[0.25rem] px-4 py-3 mb-6 bg-white">
            <div className="flex flex-col items-start">
              <MapPin className="size- text-dark mb-2" />
              <p className="text-dark font-medium text-base leading-6 mb-3">{value}</p>
              <button
                onClick={handleChangeAddres}
                className="cursor-pointer text-primary font-semibold text-sm transition-colors"
              >
                Mudar
              </button>
            </div>
          </div>

          <Button onClick={() => onConfirm(value)}>Confirmar</Button>
        </div>
      </div>
    </div>
  )
}
