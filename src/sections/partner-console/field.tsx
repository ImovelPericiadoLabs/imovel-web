import { Loader2 } from 'lucide-react'

import { cn } from '@/utils/tailwind'

export function PrimaryButton({
  children,
  onClick,
  loading,
  type = 'button',
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  loading?: boolean
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white',
        'transition-colors hover:bg-primary-hover disabled:opacity-60',
      )}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  )
}

const base =
  'w-full rounded-xl border border-input-border bg-white px-4 py-3 text-sm text-dark outline-none transition-colors placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary'

export function Field({
  label,
  hint,
  className,
  ...props
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex w-full flex-col gap-1.5">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input className={cn(base, className)} {...props} />
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </label>
  )
}

export function TextArea({
  label,
  hint,
  maxLength,
  value,
  className,
  ...props
}: { label: string; hint?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const count = typeof value === 'string' ? value.length : 0
  return (
    <label className="flex w-full flex-col gap-1.5">
      <span className="flex items-center justify-between text-sm font-medium text-gray-700">
        {label}
        {maxLength ? (
          <span className="text-xs font-normal text-gray-400">
            {count}/{maxLength}
          </span>
        ) : null}
      </span>
      <textarea
        className={cn(base, 'min-h-[88px] resize-y', className)}
        maxLength={maxLength}
        value={value}
        {...props}
      />
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </label>
  )
}
