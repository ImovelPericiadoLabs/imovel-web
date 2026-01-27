'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { ArrowRight, LogIn, Search } from 'lucide-react'
import { cn } from '@/utils/tailwind'
import { FormTypes } from '@/sections/login/validations'
import { startAuth } from '@/services/account'
import Button from '@/components/button'

export function InsertStep({ onNext }: { onNext: () => void }) {
    const { register, watch, trigger, formState: { errors } } = useFormContext<FormTypes>()

    const [isLoading, setIsLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    const email = watch('email')

    async function handleSendEmail(e: React.FormEvent) {
        e.preventDefault()
        setErrorMsg('')

        const isValid = await trigger('email')
        if (!isValid) return

        try {
            setIsLoading(true)

            await startAuth({ email })
            console.log('Email enviado para:', email)

            onNext()

        } catch (error: unknown) {
            console.error('Erro ao enviar código:', error)
            const err = error as { response?: { data?: { detail?: string } } }
            const detail =
                err?.response?.data?.detail ||
                (error instanceof Error ? error.message : undefined) ||
                'Não foi possível enviar o código. Tente novamente.'
            setErrorMsg(detail)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h1 className="text-[1.375rem] font-bold text-[#1A1A1A] mb-4 leading-tight flex items-center gap-2">
                    <LogIn className="size-5 text-[#1A1A1A]" />
                    Acessar
                </h1>

                <p className="text-sm text-[#4B4B4B] leading-relaxed mb-8">
                    Insira seu e-mail para receber um código de acesso rápido e seguro. Sem senhas complicadas.
                </p>
            </div>

            <form onSubmit={handleSendEmail} className="flex flex-col gap-4">
                <div>
                    <input
                        {...register('email')}
                        value={email ?? ''}
                        type="email"
                        placeholder="Seu e-mail"
                        disabled={isLoading}
                        className={cn(
                            "w-full h-14 px-8 rounded-xl border bg-white text-[#1A1A1A] outline-none transition-all",
                            errors.email || errorMsg
                                ? "border-red-500 focus:border-red-500"
                                : "border-[#E5E5E5] focus:border-primary focus:ring-1 focus:ring-primary",
                            "placeholder:text-[#808080] placeholder:font-normal",
                            "disabled:opacity-70 disabled:cursor-not-allowed"
                        )}
                    />
                    {errors.email && (
                        <span className="text-xs text-red-500 px-4 mt-1 block">
                            {errors.email.message}
                        </span>
                    )}
                </div>

                {errorMsg && !errors.email && (
                    <span className="text-xs text-red-500 px-4 -mt-2 text-center">
                        {errorMsg}
                    </span>
                )}

                <button
                    type="submit"
                    disabled={!!errors.email || !email || isLoading}
                    className={cn(
                        "w-full h-14 rounded-xl font-semibold text-base transition-colors flex items-center justify-center shadow-[0_6px_0_rgba(11,27,58,0.8)] active:translate-y-1 active:shadow-[0_2px_0_rgba(11,27,58,0.8)]",
                        (!!errors.email || !email || isLoading)
                            ? "bg-[#EAEAEA] text-[#A3A3A3] cursor-not-allowed"
                            : "bg-[var(--color-button-primary)] text-white hover:bg-[var(--color-button-primary-hover)]"
                    )}
                >
                    <span className="flex items-center justify-center gap-2">
                        {!isLoading && <ArrowRight className="size-5" />}
                        {isLoading ? 'Enviando...' : 'Continuar'}
                    </span>
                </button>

            <Button
                type="button"
                href="/consultar-imovel"
                icon={<Search className="size-5" />}
                className="bg-transparent text-primary border-2 border-primary hover:bg-primary/5 mt-2 shadow-none"
            >
                Consultar Imóvel
            </Button>
            </form>
        </div>
    )
}