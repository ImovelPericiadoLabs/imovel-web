'use client'

import { useEffect, useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { VerifyCodeStep } from '@/sections/login/steps/verify-step' 
import { X } from 'lucide-react'

type FormProps = {
  email: string;
  code: string;
}

export function SessionMonitor() {
  const [isOpen, setIsOpen] = useState(false)

  const methods = useForm<FormProps>({
    defaultValues: {
      email: '',
      code: ''
    }
  })

  useEffect(() => {
    const handleUnauthorized = (event: Event) => {
      setIsOpen(true)
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [methods])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl mx-4">
        
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="size-5" />
        </button>

        <FormProvider {...methods}>
          <VerifyCodeStep onBack={() => setIsOpen(false)} />
        </FormProvider>
      </div>
    </div>
  )
}