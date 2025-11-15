'use client'

import { ReactNode } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'

type AlertVariant = 'success' | 'error' | 'warning' | 'default'

interface AlertProps {
  variant?: AlertVariant
  message: string
  icon?: ReactNode
  className?: string
}

const variantConfig: Record<AlertVariant, string> = {
  success: 'bg-green-50 text-green-700 border-green-300',
  error: 'bg-red-50 text-red-700 border-red-300',
  warning: 'bg-yellow-50 text-yellow-700 border-yellow-300',
  default: 'bg-gray-50 text-gray-700 border-gray-300',
}

const Icons: Record<AlertVariant, ReactNode> = {
  success: <CheckCircle className="size-5 text-green-600" data-testid="alert-icon" />,
  error: <XCircle className="size-5 text-red-600" data-testid="alert-icon" />,
  warning: <AlertTriangle className="size-5 text-yellow-600" data-testid="alert-icon" />,
  default: <Info className="size-5 text-gray-600" data-testid="alert-icon" />,
}

export default function Alert({ variant = 'default', message, icon, className = '' }: AlertProps) {
  return (
    <div
      className={`w-full border rounded-md p-4 flex items-start gap-3 ${variantConfig[variant]} ${className}`}
      data-testid="alert"
    >
      <div>{icon ?? Icons[variant]}</div>

      <p className="text-sm leading-5" data-testid="alert-message">
        {message}
      </p>
    </div>
  )
}
