'use client'

import { useState, useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { Mail, ArrowLeft, AlertCircle } from 'lucide-react'
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
    const { control, watch, handleSubmit, getValues } = useFormContext<FormTypes>()

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
        } catch (error: any) {
            console.error('Erro ao reenviar:', error)
            setErrorMsg('Aguarde alguns instantes antes de tentar novamente.')
        } finally {
            setIsResending(false)
        }
    }

    if (!email) return null;

    return (
        <div className="min-h-screen w-full bg-primary fixed inset-0 z-50 flex flex-col items-center justify-start pt-8 px-4">
            <button onClick={onBack} className="absolute top-6 left-4 p-2 rounded-full hover:bg-white/10">
                <ArrowLeft className="size-6 text-white" />
            </button>

            <div className="flex flex-col items-center max-w-sm w-full pt-16">
                <div className="mb-6 flex items-center justify-center size-16 rounded-full bg-white/10">
                    <Mail className="size-8 text-white" />
                </div>

                <h1 className="text-[1.375rem] font-bold text-white mb-2">Confira seu e-mail</h1>

                {/* --- ALTERAÇÃO AQUI: Agrupei o texto e o botão de alterar --- */}
                <div className="flex flex-col items-center gap-1 mb-8 text-center">
                    <p className="text-sm text-gray-200 max-w-xs">
                        Enviamos um código de 6 dígitos para <span className="font-medium">{email}</span>.
                    </p>
                    <button
                        type="button"
                        onClick={onBack}
                        className="text-xs font-medium text-white hover:underline cursor-pointer"
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

                    <div className="text-xs text-gray-200 mt-6 mb-8 flex gap-1">
                        {timer === 0 ? (
                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={isResending || isSubmitting}
                                className="text-white font-medium hover:text-gray-100 transition-colors disabled:opacity-50"
                            >
                                {isResending ? 'Enviando...' : 'Reenviar agora'}
                            </button>
                        ) : (
                            <span className="text-white font-medium">Reenviar em {timer}s</span>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting || isResending}
                        className="w-full bg-white text-primary hover:bg-gray-100"
                    >
                        {isSubmitting ? 'Verificando...' : 'Confirmar e Gerar Pix'}
                    </Button>
                </form>
            </div>
        </div>
    )
}