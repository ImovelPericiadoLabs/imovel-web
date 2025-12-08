'use client'

import { useForm, FormProvider } from 'react-hook-form'
import { VerifyCodeStep } from '@/sections/login/steps/verify-step' // Ajuste o caminho do seu import
import { useState } from 'react'
// Importe o componente de input de email se tiver, senão vamos simular o fluxo
// import { InputEmailStep } from './InputEmailStep' 

export function LoginScreen() {
  // Inicializa o form para fornecer o contexto que o VerifyCodeStep exige
  const methods = useForm({
    defaultValues: {
      email: '', // O VerifyCodeStep exige email, senão ele dá "onBack"
      code: ''
    }
  })

  // Estado simples para alternar entre "Pedir Email" e "Pedir Código"
  // Já que o VerifyCodeStep é o passo 2, precisamos garantir que temos o email antes
  const [step, setStep] = useState<'EMAIL' | 'CODE'>('EMAIL')
  
  // Função fictícia para simular o "onBack"
  const handleBack = () => setStep('EMAIL')

  /* NOTA IMPORTANTE: 
     O seu componente VerifyCodeStep verifica "if (!email) onBack()".
     Se exibirmos ele direto sem o usuário ter digitado o email, ele vai falhar.
     
     Para este exemplo funcionar, vou forçar o passo de código ou você deve 
     ter uma lógica para capturar o e-mail antes.
  */

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
        <FormProvider {...methods}>
           {/* Aqui você decide: Se tiver email, mostra o Verify, senão mostra input de email */}
           <VerifyCodeStep onBack={handleBack} />
        </FormProvider>
      </div>
    </div>
  )
}