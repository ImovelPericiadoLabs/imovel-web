'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Controller, useFormContext } from 'react-hook-form'
import { Mail, ArrowLeft, AlertCircle } from 'lucide-react' 
import { signIn } from 'next-auth/react'
import { FormTypes } from '@/sections/login/validations'
import { InputOtp } from '@/sections/login/components/InputOtp'
import { startAuth } from '@/services/account'

export function VerifyCodeStep({ onBack }: { onBack: () => void }) {
  const router = useRouter()
  const { control, watch, handleSubmit, formState: { isSubmitting } } = useFormContext<FormTypes>()

  const email = watch('email')
  
  const [timer, setTimer] = useState(59)
  const [errorMsg, setErrorMsg] = useState('')
  const [isResending, setIsResending] = useState(false)

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

  const onSubmit = async (data: FormTypes) => {
    setErrorMsg('')

    if (!email) {
      setErrorMsg("Email não encontrado. Volte e tente novamente.")
      return
    }

    try {
      const result = await signIn('credentials', {
        email: email,
        code: data.code,
        redirect: false,
      })

      if (result?.error) {
        console.error('Erro no login:', result.error)
    
        const cleanError = result.error.replace("Error: ", "")
        
        setErrorMsg(cleanError || 'Código incorreto ou expirado.')
        return
      }

      console.log('Autenticado com sucesso.')
      router.push('/consultar-imovel')

    } catch (error) {
      console.error('Erro inesperado:', error)
      setErrorMsg('Ocorreu um erro ao validar o código.')
    }
  }

  const handleResendCode = async () => {
    if (!email) return;
    
    try {
      setIsResending(true)
      setErrorMsg('')
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-300 text-center"
    >
      <div className="w-full flex justify-start mb-2">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-primary flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="size-4" /> Voltar
        </button>
      </div>

      <div className="mb-6 flex items-center justify-center size-16 rounded-full bg-[#F3E8FF]">
        <Mail className="size-8 text-primary" />
      </div>

      <h1 className="text-[1.375rem] font-bold text-[#1A1A1A] mb-2">Confira seu e-mail</h1>
      <p className="text-sm text-[#4B4B4B] mb-8 max-w-xs">
        Enviamos um código de 6 dígitos para <span className="font-medium">{email}</span>.
      </p>

      <Controller
        name="code"
        control={control}
        defaultValue=""
        render={({ field, fieldState }) => (
          <InputOtp
            value={field.value}
            onChange={field.onChange}
            length={6}
            isError={!!fieldState.error || !!errorMsg}
          />
        )}
      />

      {errorMsg && (
        <div className="flex items-center gap-2 mt-4 text-red-600 bg-red-50 px-4 py-2 rounded-md text-xs font-medium animate-in fade-in">
           <AlertCircle className="size-4" />
           <span>{errorMsg}</span>
        </div>
      )}

      <div className="text-xs text-[#4B4B4B] mt-6 mb-6 flex gap-1">
        {timer === 0 ? (
          <button
            type="button"
            onClick={handleResendCode}
            disabled={isResending}
            className="text-primary font-medium hover:text-primary/80 transition-colors disabled:opacity-50"
          >
            {isResending ? 'Enviando...' : 'Reenviar agora'}
          </button>
        ) : (
          <span className="text-primary font-medium">Reenviar em {timer}s</span>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || isResending}
        className="w-full h-14 rounded-full font-semibold text-base transition-colors bg-primary text-white hover:bg-primary/90 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Verificando...' : 'Continuar'}
      </button>
    </form>
  )
}