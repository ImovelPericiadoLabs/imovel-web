'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Controller, useFormContext } from 'react-hook-form'
import { Mail } from 'lucide-react'
import { FormTypes } from '@/sections/login/validations'
import { InputOtp } from '@/sections/login/components/InputOtp'

export function VerifyCodeStep({ onBack }: { onBack: () => void }) {
  const router = useRouter()
  const { control, watch, handleSubmit } = useFormContext<FormTypes>()

  const email = watch('email')
  const [timer, setTimer] = useState(59)

  useEffect(() => {
    if (timer === 0) return
    const id = setInterval(() => {
      setTimer((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(id)
  }, [timer > 0]) 

  const onSubmit = (data: FormTypes) => {
    console.log('Sucesso, código completo:', data.code)
    router.push('/consultar-imovel')
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-300 text-center"
    >

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
            isError={!!fieldState.error}
          />
        )}
      />

      <div className="text-xs text-[#4B4B4B] mt-6 mb-6 flex gap-1">
        {!timer ? (
          <button
            type="button"
            onClick={() => setTimer(59)}
            className="text-primary font-medium hover:text-primary/80 transition-colors"
          >
            Reenviar agora
          </button>
        ) : (
          <span className="text-primary font-medium">Reenviar em {timer}s</span>
        )}
      </div>

      <button
        type="submit"
        className="w-full h-14 rounded-full font-semibold text-base transition-colors bg-primary text-white hover:bg-primary/90 shadow-md"
      >
        Continuar
      </button>
    </form>
  )
}