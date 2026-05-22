'use client'

import { useState, useEffect, useCallback, ReactNode, memo } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { ChevronLeft, CircleQuestionMark } from 'lucide-react'
import { BrandLogoLink } from '@/components/brand-logo-link'

import { startAuth } from '@/services/account'
import LoadingOverlay from '@/components/loading-overlay'
import TrafficLightModal from '@/components/traffic-light-modal'
import { validations, FormTypes } from '@/sections/login/validations'
import { InsertStep } from './steps/insert-step'
import { VerifyCodeStep } from './steps/verify-step'

type FlowState = 'email' | 'code'
const STORAGE_KEY = '@pix-payment:form-data'

const Activity = memo(({ isActive, children }: { isActive: boolean; children: ReactNode }) => (
  <div 
    aria-hidden={!isActive} 
    style={{ display: isActive ? 'block' : 'none' }}
    className="w-full"
  >
    {children}
  </div>
))

Activity.displayName = 'Activity'

export function Login() {
  const [flow, setFlow] = useState<FlowState>('email')
  const [isInitializing, setIsInitializing] = useState(true)
  const router = useRouter()

  const methods = useForm<FormTypes>({
    resolver: zodResolver(validations),
    mode: 'onChange',
    defaultValues: { email: "", code: "" }
  })

  const handleNavigation = useCallback((next: FlowState) => {
    setFlow(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY)
        if (savedData) {
          const { email } = JSON.parse(savedData)
          if (email) {
            methods.setValue('email', email)
            await startAuth({ email })
            setFlow('code')
          }
        }
      } catch (error) {
        console.error('Session restoration failed:', error)
      } finally {
        setIsInitializing(false)
      }
    }
    initializeAuth()
  }, [methods])

  const handleBack = useCallback(() => {
    if (flow === 'code') return handleNavigation('email')
    router.push('/')
  }, [flow, handleNavigation, router])

  if (isInitializing) {
    return <LoadingOverlay isLoading message="Verificando cadastro..." />
  }

  return (
    <section className="flex min-h-dvh flex-col bg-white">
      <header className="w-full bg-primary py-7 px-5 shadow-sm shrink-0">
        <div className="flex items-center justify-between relative max-w-lg mx-auto">
          <button
            onClick={handleBack}
            className="transition-opacity duration-200"
            aria-label="Voltar"
          >
            <ChevronLeft className="size-8 text-white" />
          </button>

          <div className="absolute left-1/2 -translate-x-1/2">
            <BrandLogoLink priority className="[&_img]:brightness-0 [&_img]:invert" />
          </div>

          <TrafficLightModal>
            <CircleQuestionMark className="cursor-pointer size-7 text-white" />
          </TrafficLightModal>
        </div>
      </header>

      <FormProvider {...methods}>
        <main className="w-full mx-auto lg:max-w-lg px-6 py-8 flex-1">
          <Activity isActive={flow === 'email'}>
            <InsertStep onNext={() => handleNavigation('code')} />
          </Activity>

          <Activity isActive={flow === 'code'}>
            <VerifyCodeStep onBack={() => handleNavigation('email')} />
          </Activity>
        </main>
      </FormProvider>
    </section>
  )
}