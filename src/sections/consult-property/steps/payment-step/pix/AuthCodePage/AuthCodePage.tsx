'use client'

import { useState, useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import Image from 'next/image'
import { Mail, ArrowLeft } from 'lucide-react'
import { signIn } from 'next-auth/react'

import Button from '@/components/button'
import Alert from '@/components/alert'
import { InputOtp } from '@/sections/login/components/InputOtp'
import { startAuth } from '@/services/account'
import { FormTypes } from '@/sections/login/validations'

interface AuthCodePageProps {
    onBack: () => void;
    onSuccess: (code: string) => void;
}

export function AuthCodePage({ onBack, onSuccess }: AuthCodePageProps) {
    const { control, watch, handleSubmit } = useFormContext<FormTypes>()

    const email = watch('email')

    const [timer, setTimer] = useState(59)
    const [errorMsg, setErrorMsg] = useState('')
    const [isResending, setIsResending] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (!email) {
            onBack();
        }
    }, [email, onBack]);

    useEffect(() => {
        if (timer === 0) return
        const id = setInterval(() => {
            setTimer((prev) => prev - 1)
        }, 1000)
        return () => clearInterval(id)
    }, [timer])

    function clearError() {
        setErrorMsg('');
    }

    const onSubmit = async (data: FormTypes) => {
        clearError();
        setIsSubmitting(true);

        if (!email) {
            setErrorMsg("Email não encontrado. Volte e tente novamente.")
            setIsSubmitting(false);
            return
        }

        try {
            const result = await signIn('credentials', {
                email: email,
                code: data.code,
                redirect: false,
            })

            if (result?.error) {
                const cleanError = result.error.replace("Error: ", "")
                setErrorMsg(cleanError || 'Código incorreto ou expirado.')
                return
            }

            onSuccess(data.code);

        } catch (error) {
            console.error('Erro inesperado:', error)
            setErrorMsg('Ocorreu um erro ao validar o código.')
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleResendCode = async () => {
        if (!email) return;

        try {
            setIsResending(true)
            clearError()
            await startAuth({ email })
            setTimer(59)
        } catch (error: unknown) {
            console.error('Erro ao reenviar:', error)
            const err = error as { response?: { data?: { detail?: string } } }
            const detail =
                err?.response?.data?.detail ||
                (error instanceof Error ? error.message : undefined) ||
                'Aguarde alguns instantes antes de tentar novamente.'
            setErrorMsg(detail)
        } finally {
            setIsResending(false)
        }
    }

    if (!email) return null;

    return (
        <div className="min-h-screen w-full bg-white fixed inset-0 z-50 flex flex-col items-center justify-start pt-8 px-4">
            <button onClick={onBack} className="absolute top-6 left-4 p-2 rounded-full hover:bg-gray-100">
                <ArrowLeft className="size-6 text-dark" />
            </button>

            <div className="flex flex-col items-center max-w-sm w-full pt-6">
                <div className="mb-12">
                    <Image
                        src="/images/logo.png"
                        alt="Logo"
                        width={200}
                        height={50}
                        priority
                        className="object-contain"
                    />
                </div>

                <div className="mb-6 flex items-center justify-center size-16 rounded-full bg-primary/10">
                    <Mail className="size-8 text-primary" />
                </div>

                <h1 className="text-[1.375rem] font-bold text-dark mb-2">Confira seu e-mail</h1>

                {/* --- ALTERAÇÃO AQUI: Agrupei o texto e o botão de alterar --- */}
                <div className="flex flex-col items-center gap-1 mb-8 text-center">
                    <p className="text-sm text-gray-500 max-w-xs">
                        Enviamos um código de 6 dígitos para <span className="font-medium text-dark">{email}</span>.
                    </p>
                    <button
                        type="button"
                        onClick={onBack}
                        className="text-xs font-medium text-primary hover:underline cursor-pointer"
                    >
                        Alterar e-mail
                    </button>
                </div>
                {/* ------------------------------------------------------------- */}

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-col items-center w-full"
                >
                    <Controller
                        name="code"
                        control={control}
                        defaultValue=""
                        render={({ field, fieldState }) => (
                            <InputOtp
                                value={field.value}
                                onChange={(val) => {
                                    field.onChange(val);
                                    clearError();
                                }}
                                length={6}
                                isError={!!fieldState.error || !!errorMsg}
                            />
                        )}
                    />

                    {errorMsg && (
                        <Alert variant="error" message={errorMsg} className="mt-4" />
                    )}

                    <div className="text-xs text-gray-500 mt-6 mb-8 flex gap-1">
                        {timer === 0 ? (
                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={isResending || isSubmitting}
                                className="text-primary font-medium hover:underline transition-colors disabled:opacity-50"
                            >
                                {isResending ? 'Enviando...' : 'Reenviar agora'}
                            </button>
                        ) : (
                            <span className="text-primary font-medium">Reenviar em {timer}s</span>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting || isResending}
                        className="w-full h-14 rounded-xl font-semibold text-base transition-colors bg-primary text-white hover:bg-primary/90 shadow-md"
                    >
                        {isSubmitting ? 'Verificando...' : 'Confirmar e Gerar Pix'}
                    </Button>
                </form>
            </div>
        </div>
    )
}