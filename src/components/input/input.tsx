import { type ComponentProps, forwardRef } from 'react'
import { cn } from '@/utils/tailwind'

type FormErrors = Record<string, { message?: string } | undefined>

type MaskType = 'cpf' | 'whatsapp' | 'cnpj' | 'cep' | ((value: string) => string)

type Props = {
  errors?: FormErrors
  label?: string
  className?: string
  mask?: MaskType
}

function applyMask(value: string, mask?: MaskType): string {
  const digits = value.replace(/\D/g, '')

  if (!mask) return value

  if (typeof mask === 'function') return mask(value)

  switch (mask) {
    case 'cpf':
      return digits
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, '$1.$2.$3-$4')
        .slice(0, 14)

    case 'whatsapp':
      return digits
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .slice(0, 15)

    case 'cnpj':
      return digits
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 18)

    case 'cep':
      return digits.replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9)
  }
}

const Input = forwardRef<HTMLInputElement, ComponentProps<'input'> & Props>(
  ({ errors, label, className, mask, onChange, ...props }, ref) => {
    const error = errors?.[props.name as string]

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const maskedValue = applyMask(e.target.value, mask)
      e.target.value = maskedValue

      if (onChange) onChange(e)
    }

    return (
      <div className="flex flex-col gap-1 w-full">
        <div className="flex flex-col gap-2 text-start">
          {label && (
            <label
              htmlFor={props.id || props.name}
              className="text-sm font-medium leading-5 text-gray-700"
            >
              {label}
            </label>
          )}

          <input
            ref={ref}
            {...props}
            onChange={handleChange}
            aria-invalid={props['aria-invalid'] || !!error?.message?.length}
            className={cn(
              `
            px-9.5 py-4 bg-white w-full rounded-[6rem] border 
            border-input-border shadow-[0_1px_2px_rgba(10,13,18,0.05)]
            placeholder:text-gray placeholder:text-base placeholder:font-normal placeholder:leading-6
            focus:border-primary focus:ring-1 focus:ring-primary outline-none
            aria-invalid:ring-red-500/20 aria-invalid:border-red-500
            `,
              className,
            )}
          />
        </div>

        {error?.message && <span className="text-xs text-red-500">{error.message}</span>}
      </div>
    )
  },
)

Input.displayName = 'Input'

export default Input
