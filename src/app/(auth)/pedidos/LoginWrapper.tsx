'use client'

import { useEffect, useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { VerifyCodeStep } from '@/sections/login/steps/verify-step' // Ajuste seu caminho
import { InsertStep } from '@/sections/login/steps/insert-step'   // Ajuste seu caminho

const STORAGE_KEY = '@pix-payment:form-data'

type AuthStep = 'LOADING' | 'EMAIL' | 'CODE'

export function LoginWrapper() {
    const methods = useForm({
        defaultValues: {
            email: '',
            code: ''
        }
    })

    const { setValue } = methods
    const [currentStep, setCurrentStep] = useState<AuthStep>('LOADING')

    useEffect(() => {
        const checkStorage = () => {
            const savedData = localStorage.getItem(STORAGE_KEY)

            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData)
                    if (parsed.email) {
                        console.log("Fluxo automático: Email encontrado no storage")
                        setValue('email', parsed.email)
                        setCurrentStep('CODE') // Pula direto para o código
                        return
                    }
                } catch (error) {
                    console.error("Erro ao ler storage", error)
                }
            }

            // Se não achou nada, vai para o passo de inserir email
            console.log("Fluxo manual: Nenhum email salvo")
            setCurrentStep('EMAIL')
        }

        checkStorage()
    }, [setValue])

    // Funções de navegação entre os passos
    const handleGoToCode = () => setCurrentStep('CODE')
    const handleBackToEmail = () => setCurrentStep('EMAIL')

    // Se o usuário desistir no passo de email (opcional)
    const handleExit = () => {
        window.location.href = '/'
    }

    // Enquanto verifica o storage, não mostra nada ou um spinner
    if (currentStep === 'LOADING') return null

    return (
        <div className="flex items-center justify-center min-h-[60vh] p-4 bg-white relative z-50">
            <div className="w-full max-w-md">
                <FormProvider {...methods}>

                    {/* PASSO 1: INSERIR EMAIL */}
                    {currentStep === 'EMAIL' && (
                        <InsertStep onNext={handleGoToCode} />
                    )}

                    {/* PASSO 2: VERIFICAR CÓDIGO */}
                    {currentStep === 'CODE' && (
                        <VerifyCodeStep onBack={handleBackToEmail} />
                    )}

                </FormProvider>
            </div>
        </div>
    )
}