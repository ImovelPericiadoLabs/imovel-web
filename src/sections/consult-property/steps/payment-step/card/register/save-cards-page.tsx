'use client'

import { useState } from 'react'
import { Switch } from '@/components/switch'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    icon?: React.ReactNode
}

function FormInput({ label, icon, className, ...props }: InputProps) {
    return (
        <div className="space-y-2">
            {label && (
                <label className="text-[14px] font-normal text-gray-700 ml-1 block">
                    {label}
                </label>
            )}
            <div className="relative group">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                        {icon}
                    </div>
                )}
                <input
                    className={`
            w-full h-[50px] bg-white border border-gray-300 rounded-[10000px] 
            focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]
            transition-all placeholder:text-gray-400 text-gray-700 text-[16px]
            ${icon ? 'pl-14' : 'pl-4'} ${className}
          `}
                    {...props}
                />
            </div>
        </div>
    )
}

export function CreditCardPage({
    amount = '67,56',
    onSave,
}: {
    amount?: string
    onSave: () => void
}) {
    const [saveCard, setSaveCard] = useState(false)

    const [form, setForm] = useState({
        cardNumber: '',
        name: '',
        expiry: '',
        cvv: '',
        cpf: '',
    })

    const masks = {
        card: (v: string) =>
            v.replace(/\D/g, '')
                .replace(/(\d{4})/g, '$1 ')
                .trim()
                .substring(0, 19),
        expiry: (v: string) => {
            const c = v.replace(/\D/g, '')
            if (c.length >= 2) return c.substring(0, 2) + '/' + c.substring(2, 4)
            return c
        },
        cpf: (v: string) =>
            v
                .replace(/\D/g, '')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
                .substring(0, 14),
        numbersOnly: (v: string) => v.replace(/\D/g, '').substring(0, 4),
    }

    function handleChange(
        field: keyof typeof form,
        value: string,
        mask?: (v: string) => string
    ) {
        const clean = mask ? mask(value) : value
        setForm((prev) => ({ ...prev, [field]: clean }))
    }

    function handleSubmit() {
        onSave()
    }

    return (
        <form className="flex flex-col relative w-full z-50 -mt-15">
            <div className="bg-background min-h-[calc(100vh-80px)] px-6 pt-8 pb-8 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                <div className="flex flex-col gap-5">

                    <FormInput
                        label="Número do cartão"
                        placeholder="0000 0000 0000 0000"
                        value={form.cardNumber}
                        onChange={(e) => handleChange('cardNumber', e.target.value, masks.card)}
                        icon={
                            <div className="flex -space-x-1.5">
                                <div className="w-5 h-5 rounded-full bg-[#EB001B] z-10"></div>
                                <div className="w-5 h-5 rounded-full bg-[#F79E1B] z-20"></div>
                            </div>
                        }
                    />

                    <FormInput
                        label="Nome do titular"
                        placeholder="Ex: Roberto Silva"
                        value={form.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormInput
                            label="MM/AA"
                            placeholder="MM/AA"
                            className="pl-4"
                            value={form.expiry}
                            onChange={(e) => handleChange('expiry', e.target.value, masks.expiry)}
                        />
                        <FormInput
                            label="CVV"
                            placeholder="CVV"
                            type="tel"
                            className="pl-4"
                            value={form.cvv}
                            onChange={(e) => handleChange('cvv', e.target.value, masks.numbersOnly)}
                        />
                    </div>

                    <FormInput
                        placeholder="000.000.000-00"
                        value={form.cpf}
                        onChange={(e) => handleChange('cpf', e.target.value, masks.cpf)}
                    />

                    <div className="flex items-center justify-between pt-2 px-1">
                        <span
                            className="text-[15px] font-normal text-gray-800 cursor-pointer"
                            onClick={() => setSaveCard(!saveCard)}
                        >
                            Salvar cartão para compras futuras
                        </span>
                        <Switch checked={saveCard} onCheckedChange={setSaveCard} />
                    </div>

                    <div className="pt-6">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="w-full bg-[var(--color-primary)] hover:opacity-90 active:opacity-100 text-white font-semibold text-base h-12 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-100 mb-6"
                        >
                            Pagar
                        </button>
                    </div>
                </div>
            </div>
        </form>
    )
}
