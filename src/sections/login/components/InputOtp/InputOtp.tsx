'use client'

import React, { useRef, useEffect } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/utils/tailwind'

const inputOtpVariants = cva(
  "flex text-center shadow-sm transition-all duration-200 outline-none placeholder:text-transparent selection:bg-primary/20",
  {
    variants: {
      status: {
        default: "bg-white border border-gray-200 text-gray-900 focus:border-primary focus:ring-4 focus:ring-primary/10",
        filled: "bg-white border border-primary text-primary focus:ring-4 focus:ring-primary/10",
        error: "bg-red-50 border border-red-500 text-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10",
      },
      size: {
        md: "h-14 w-12 text-2xl rounded-lg font-semibold",
      }
    },
    defaultVariants: {
      size: "md",
      status: "default",
    }
  }
)

type Props = {
  value: string
  length?: number
  disabled?: boolean
  type?: 'text' | 'number'
  isError?: boolean
  onChange: (value: string) => void
  autoFocus?: boolean
}

export function InputOtp({
  value = "",
  onChange,
  length = 6,
  disabled = false,
  type = 'text',
  isError = false,
  autoFocus = false,
}: Props) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (autoFocus && !disabled) {
      inputsRef.current[0]?.focus()
    }
  }, [autoFocus, disabled])

  const handleChange = (index: number, val: string) => {
    if (type === 'number' && val && !/^\d*$/.test(val)) return

    const newStr = value.split('')
    while (newStr.length < length) newStr.push('')

    newStr[index] = val.slice(-1)

    const nextValue = newStr.join('').slice(0, length)
    onChange(nextValue)

    if (val && index < length - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    switch (e.key) {
      case 'Backspace':
        if (!value[index] && index > 0) {
          e.preventDefault()
          const newStr = value.split('')
          newStr[index - 1] = ''
          onChange(newStr.join(''))
          inputsRef.current[index - 1]?.focus()
        }
        break

      case 'ArrowLeft':
        e.preventDefault()
        if (index > 0) inputsRef.current[index - 1]?.focus()
        break

      case 'ArrowRight':
        e.preventDefault()
        if (index < length - 1) inputsRef.current[index + 1]?.focus()
        break

      default:
        break
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (disabled) return

    const pastedData = e.clipboardData.getData('text')
    let curValue = pastedData

    if (type === 'number') {
      curValue = curValue.replace(/\D/g, '')
    }

    const pasteChars = curValue.split('').slice(0, length)

    onChange(pasteChars.join(''))

    const focusIndex = Math.min(pasteChars.length, length - 1)
    if (focusIndex >= 0) {
      setTimeout(() => {
        inputsRef.current[focusIndex]?.focus()
      }, 0)
    }
  }

  const chars = Array(length).fill('').map((_, i) => value[i] || '')

  return (
    <div className="flex gap-3 justify-center items-center">
      {chars.map((char, index) => {
        const status = isError ? "error" : char ? "filled" : "default"

        return (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el
            }}
            aria-label={`Dígito ${index + 1} do código`}

            type="tel"
            inputMode={type === 'number' ? 'numeric' : 'text'}
            pattern={type === 'number' ? "[0-9]*" : undefined} 

            autoComplete="one-time-code"
            maxLength={1}
            disabled={disabled}
            value={char}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onChange={(e) => handleChange(index, e.target.value)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={cn(inputOtpVariants({ status }))}
          />
        )
      })}
    </div>
  )
}