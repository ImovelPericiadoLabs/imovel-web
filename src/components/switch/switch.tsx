'use client'

import * as React from 'react'

interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export function Switch({ 
  checked = false, 
  onCheckedChange, 
  className = '', 
  disabled,
  ...props 
}: SwitchProps) {
  
  const handleClick = () => {
    if (disabled) return
    onCheckedChange?.(!checked)
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      className={`
        peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50
        ${checked ? 'bg-violet-600' : 'bg-gray-200'}
        ${className}
      `}
      {...props}
    >
      <span
        data-state={checked ? 'checked' : 'unchecked'}
        className={`
          pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  )
}