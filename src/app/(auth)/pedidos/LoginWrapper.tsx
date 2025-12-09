'use client'

import { useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { Login } from '@/sections/login'

const STORAGE_KEY = '@pix-payment:form-data'

export function LoginWrapper() {
    const methods = useForm({
        defaultValues: {
            email: '',
            code: ''
        }
    })

    const { setValue } = methods

    useEffect(() => {
        const savedData = localStorage.getItem(STORAGE_KEY)

        if (savedData) {
            try {
                const parsed = JSON.parse(savedData)
                if (parsed.email) {
                    setValue('email', parsed.email)
                }
            } catch (error) { }
        }
    }, [setValue])

    return (
        // Alterações feitas:
        // 1. Removido 'p-4' (para tirar o espaço branco das bordas)
        // 2. Removido 'items-center' (para o cabeçalho subir e colar no topo)
        // 3. Alterado min-h-[60vh] para min-h-screen (para garantir fundo branco na tela toda)
        <div className="flex flex-col justify-start min-h-screen bg-white relative z-50">

            {/* Removido max-w-md se quiser que o cabeçalho ocupe 100% da largura no mobile */}
            <div className="w-full">
                <FormProvider {...methods}>
                    <Login />
                </FormProvider>
            </div>
        </div>
    )
}