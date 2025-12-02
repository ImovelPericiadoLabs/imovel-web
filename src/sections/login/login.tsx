'use client'

import { useState, ReactNode } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { validations, FormTypes } from '@/sections/consult-property/validations'
import { InsertStep } from './steps/insert-step'

type FlowState = 'email' | 'code'

function Activity({ isActive, children }: { isActive: boolean; children: ReactNode }) {
    return (
        <div
            aria-hidden={!isActive}
            style={{ display: isActive ? 'block' : 'none' }}
        >
            {children}
        </div>
    )
}

export default function Login() {
    const [flow, setFlow] = useState<FlowState>('email')

    const methods = useForm<FormTypes>({
        resolver: zodResolver(validations),
        mode: 'onChange',
    })

    function go(next: FlowState) {
        setFlow(next)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div className="flex flex-col px-5 pt-6 pb-8">
            <FormProvider {...methods}>
                <Activity isActive={flow === 'email'}>
                    <InsertStep onNext={() => go('code')} />
                </Activity>
            </FormProvider>
        </div>
    )
}