'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronLeft, CircleQuestionMark } from 'lucide-react'
import { startAuth } from '@/services/account'
import LoadingOverlay from '@/components/loading-overlay'
import TrafficLightModal from '@/components/traffic-light-modal'
import { validations, FormTypes } from '@/sections/login/validations'
import { InsertStep } from './steps/insert-step'
import { VerifyCodeStep } from './steps/verify-step'

type FlowState = 'email' | 'code'

const STORAGE_KEY = '@pix-payment:form-data'

function Activity({ isActive, children }: { isActive: boolean; children: ReactNode }) {
    return (
        <div
            aria-hidden={!isActive}
            style={{ display: isActive ? 'block' : 'none' }}
        >
            {children}
        </div>
    )
}

export function Login() {
    const [flow, setFlow] = useState<FlowState>('email')
    const [isCheckingStorage, setIsCheckingStorage] = useState(true)

    const router = useRouter()

    const methods = useForm<FormTypes>({
        resolver: zodResolver(validations),
        mode: 'onChange',
        defaultValues: {
            email: "",
            code: ""
        }
    })

    const { setValue } = methods

    useEffect(() => {
        const checkAutoLogin = async () => {
            const savedData = localStorage.getItem(STORAGE_KEY)

            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData)

                    if (parsed.email) {
                        setValue('email', parsed.email)
                        await startAuth({ email: parsed.email })
                        setFlow('code')
                    }
                } catch (error) {
                    console.error(error)
                }
            }
            setIsCheckingStorage(false)
        }

        checkAutoLogin()
    }, [setValue])

    function go(next: FlowState) {
        setFlow(next)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function back() {
        if (flow === 'code') {
            setFlow('email')
        } else {
            router.push('/')
        }
    }

    if (isCheckingStorage) {
        return <LoadingOverlay isLoading={true} message="Verificando cadastro..." />
    }

    return (
        <section className="min-h-screen bg-white flex flex-col">
            <header className="w-full bg-primary pt-7 pb-7 px-5 shadow-sm relative shrink-0">
                <div className="flex items-center justify-between relative">
                    <div className="flex items-center justify-start w-10">
                        <ChevronLeft
                            onClick={back}
                            className={`size-8 text-white transition-opacity ${flow === 'email' ? 'opacity-0 pointer-events-none' : 'cursor-pointer'}`}
                            role="button"
                        />
                    </div>

                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <Image
                            src="/images/logo.png"
                            alt="Logo"
                            width={200}
                            height={50}
                            className="object-contain"
                        />
                    </div>

                    <TrafficLightModal>
                        <CircleQuestionMark className="cursor-pointer size-7 text-white" />
                    </TrafficLightModal>
                </div>
            </header>

            <FormProvider {...methods}>
                <main className="w-full mx-auto lg:max-w-lg px-6 py-8 flex-1">
                    <Activity isActive={flow === 'email'}>
                        <InsertStep onNext={() => go('code')} />
                    </Activity>

                    <Activity isActive={flow === 'code'}>
                        <VerifyCodeStep onBack={() => go('email')} />
                    </Activity>
                </main>
            </FormProvider>
        </section>
    )
}