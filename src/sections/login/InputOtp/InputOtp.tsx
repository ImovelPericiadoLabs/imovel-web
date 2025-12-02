import React, { useState, useEffect } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/tailwind'

const inputOtpVariants = cva(
  `
    text-white placeholder:text-neutral-500  shadow-[0_1px_2px_rgba(0,0,0,0.05)]  border border-[var(--color-neutral-gray)]
    flex w-full text-center min-w-0 rounded-0 bg-background font-normal leading-[140%] shadow-xs 
    transition-[color,box-shadow] outline-none 
    disabled:cursor-not-allowed disabled:hover:border-none  disabled:opacity-50 disabled:bg-disabled disabled:text-primary-foreground-disabled
    hover:border-primary 
    focus:border-primary 
    aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive
  `,
  {
    variants: {
      size: {
        xs: 'h-[1.5rem] w-[1.5rem] text-xs',
        sm: 'h-[2rem]  w-[2rem] text-xs',
        md: 'h-[2.25rem]  w-[2.25rem] text-sm',
        lg: 'h-[2.5rem] w-[2.5rem] text-sm',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

type OtherProps = {
  length?: number
  disabled?: boolean
  type: 'text' | 'number'
  onChange?: (value: string | number) => void
  className?: string
}

type InputOtpProps = Omit<React.ComponentProps<'input'>, 'size' | 'onChange' | 'type'> &
  VariantProps<typeof inputOtpVariants> &
  OtherProps

export function InputOtp({
  disabled,
  type = 'text',
  length = 6,
  onChange,
  className,
  size,
  ...rest
}: InputOtpProps) {
  const [values, setValues] = useState<string[]>([])

  const handleChange = (index: number, val: string) => {
    if (type === 'number') {
      if (!/^\d?$/.test(val)) return
    }

    const newValues = [...values]
    newValues[index] = val
    setValues(newValues)
    onChange?.(newValues.join(''))

    if (val && index < length - 1) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`)
      nextInput?.focus()
    }

    if (!val && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasteData = e.clipboardData.getData('Text')
    if (!pasteData) return

    let chars = pasteData.split('')
    if (type === 'number') {
      chars = chars.filter((c) => /^\d$/.test(c))
    }
    const newValues = [...values]
    for (let i = index; i < length; i++) {
      newValues[i] = chars[i - index] || ''
    }
    setValues(newValues)
    onChange?.(newValues.join(''))

    const lastFilled = Math.min(index + chars.length - 1, length - 1)
    if (lastFilled >= 0) {
      setTimeout(() => {
        const input = document.getElementById(`otp-input-${lastFilled}`)
        input?.focus()
      }, 0)
    }
    e.preventDefault()
  }

  useEffect(() => {
    setValues(Array(length).fill(''))
  }, [length])

  return (
    <div className={cn('flex gap-[0.5rem]', className)}>
      {values.map((v, i) => (
        <input
          {...rest}
          key={i}
          id={`otp-input-${i}`}
          type="text"
          maxLength={1}
          value={v}
          disabled={disabled}
          className={cn(inputOtpVariants({ size }))}
          onChange={(e) => handleChange(i, e.target.value)}
          onPaste={(e) => handlePaste(i, e)}
        />
      ))}
    </div>
  )
}
