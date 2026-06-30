'use client'

import { useCallback, useEffect, useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { useSession } from 'next-auth/react'
import { VerifyCodeStep } from '@/sections/login/steps/verify-step'
import { InsertStep } from '@/sections/login/steps/insert-step'
import { X } from 'lucide-react'

type FormProps = {
  email: string;
  code: string;
}

type FlowState = 'email' | 'code'
const STORAGE_KEY = '@pix-payment:form-data'

export function SessionMonitor() {
  const [isOpen, setIsOpen] = useState(false)
  const [flow, setFlow] = useState<FlowState>('email')

  const { update } = useSession()

  const methods = useForm<FormProps>({
    defaultValues: {
      email: '',
      code: ''
    }
  })

  useEffect(() => {
    const handleUnauthorized = () => {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        try {
          const { email } = JSON.parse(savedData)
          if (email) {
            methods.setValue('email', email)
          }
        } catch {
          // no-op: fallback to empty email input
        }
      }
      setFlow('email')
      setIsOpen(true)
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [methods])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setFlow('email')
    methods.reset({ email: '', code: '' })
  }, [methods])

  const handleSuccess = useCallback(() => {
    handleClose()
    // Refresh the client session on the same screen and let listeners retry.
    void update()
    window.dispatchEvent(new Event('auth:reauthenticated'))
  }, [handleClose, update])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl mx-4">
        
        <button 
          onClick={handleClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="size-5" />
        </button>

        <FormProvider {...methods}>
          {flow === 'email' ? (
            <InsertStep onNext={() => setFlow('code')} />
          ) : (
            <VerifyCodeStep onBack={() => setFlow('email')} onSuccess={handleSuccess} />
          )}
        </FormProvider>
      </div>
    </div>
  )
}