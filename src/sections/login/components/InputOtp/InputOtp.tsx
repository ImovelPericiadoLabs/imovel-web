'use client'

import { cva, VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/tailwind'

const inputOtpVariants = cva(
  "flex text-center shadow-sm transition-all duration-200 outline-none placeholder:text-transparent",
  {
    variants: {
      status: {
        default: "bg-white border border-gray-200 text-gray-900 focus:border-primary focus:ring-4 focus:ring-primary/10",
        filled: "bg-white border border-primary text-primary focus:ring-4 focus:ring-primary/10",
        error: "bg-red-50 border border-red-500 text-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10",
      },
      size: {
        md: "h-14 w-12 text-2xl rounded-lg",
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
}

export function InputOtp({
  value = "",
  onChange,
  length = 6,
  disabled,
  type = 'text',
  isError,
}: Props) {

  const handleChange = (index: number, val: string) => {
    if (type === 'number' && !/^\d*$/.test(val)) return

    const chars = value.split('').concat(Array(length).fill(''))
    chars[index] = val.slice(-1)

    const nextValue = chars.join('').slice(0, length)
    onChange(nextValue)

    if (val && index < length - 1) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const chars = value.split('').concat(Array(length).fill('')).slice(0, length)

  return (
    <div className="flex gap-3 justify-center">
      {chars.map((char, index) => {
        const status = isError ? "error" : char ? "filled" : "default"

        return (
          <input
            key={index}
            id={`otp-${index}`}
            type={type === 'number' ? 'tel' : 'text'}
            maxLength={1}
            disabled={disabled}
            value={char}
            onChange={(e) => handleChange(index, e.target.value)}
            className={cn(inputOtpVariants({ status }))}
          />
        )
      })}
    </div>
  )
}
