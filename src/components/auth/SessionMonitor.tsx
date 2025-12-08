'use client'

import { useEffect, useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { VerifyCodeStep } from '@/sections/login/steps/verify-step' // Ajuste o import
import { X } from 'lucide-react'

// Tipagem baseada no que o VerifyCodeStep espera
type FormProps = {
  email: string;
  code: string;
}

export function SessionMonitor() {
  const [isOpen, setIsOpen] = useState(false)

  // O VerifyCodeStep precisa do FormContext para funcionar
  const methods = useForm<FormProps>({
    defaultValues: {
      email: '', // Problema aqui: Precisamos saber qual e-mail preencher (veja nota abaixo)
      code: ''
    }
  })

  useEffect(() => {
    // Função que roda quando o evento auth:unauthorized acontece
    const handleUnauthorized = (event: Event) => {
      // Se você tiver salvo o email do usuário no localStorage ou cookies,
      // essa é a hora de injetar no formulário para o componente funcionar
      // Exemplo: 
      // const userEmail = localStorage.getItem('user_email')
      // if (userEmail) methods.setValue('email', userEmail)
      
      setIsOpen(true)
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [methods])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl mx-4">
        
        {/* Botão para fechar forçado caso o usuário queira desistir */}
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="size-5" />
        </button>

        {/* Provedor do React Hook Form necessário para o VerifyCodeStep */}
        <FormProvider {...methods}>
          <VerifyCodeStep onBack={() => setIsOpen(false)} />
        </FormProvider>
      </div>
    </div>
  )
}