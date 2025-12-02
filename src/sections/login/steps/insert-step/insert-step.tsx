'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { cn } from '@/utils/tailwind'
import { FormTypes }from '@/sections/login/validations'

const mockAuthService = {
    sendLoginLink: async (email: string) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, email })
            }, 1500)
        })
    }
}

export function InsertStep({ onNext }: { onNext: () => void }) {
    const { register, watch, trigger, formState: { errors } } = useFormContext<FormTypes>()
    const [isLoading, setIsLoading] = useState(false)

    const email = watch('email')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        
        const isValid = await trigger('email')
        if (!isValid) return

        try {
            setIsLoading(true)
            await mockAuthService.sendLoginLink(email)
            console.log('Link enviado para:', email)
            
            onNext()
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h1 className="text-[1.375rem] font-bold text-[#1A1A1A] mb-4 leading-tight">
                    Acessar ou cadastrar
                </h1>

                <p className="text-sm text-[#4B4B4B] leading-relaxed mb-8">
                    Insira seu e-mail: se a conta existir, você será autenticado; se não
                    existir, uma nova conta será cadastrada automaticamente.
                </p>
            </div>

            <div className="flex flex-col gap-4">
                <input
                    {...register('email')}
                    type="email"
                    placeholder="Seu e-mail"
                    disabled={isLoading}
                    className={cn(
                        "w-full h-14 px-8 rounded-full border bg-white text-[#1A1A1A] outline-none transition-all",
                        errors.email 
                            ? "border-red-500 focus:border-red-500" 
                            : "border-[#E5E5E5] focus:border-primary focus:ring-1 focus:ring-primary",
                        "placeholder:text-[#808080] placeholder:font-normal",
                        "disabled:opacity-70 disabled:cursor-not-allowed"
                    )}
                />
                 {errors.email && <span className="text-xs text-red-500 px-4 -mt-2">{errors.email.message}</span>}

                <button
                    type="button"
                    onClick={handleSubmit} 
                    disabled={!email || isLoading}
                    className={cn(
                        "w-full h-14 rounded-full font-semibold text-base transition-colors flex items-center justify-center",
                        !email || isLoading
                            ? "bg-[#EAEAEA] text-[#A3A3A3] cursor-not-allowed" 
                            : "bg-primary text-white hover:bg-primary/90 shadow-md"
                    )}
                >
                    {isLoading ? 'Enviando...' : 'Enviar link'}
                </button>
            </div>
        </div>
    )
}