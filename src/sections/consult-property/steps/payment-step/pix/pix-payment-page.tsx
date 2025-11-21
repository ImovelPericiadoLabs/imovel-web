'use client'

import { useState } from 'react'
import { Check, Clock } from 'lucide-react'

interface PixPaymentPageProps {
    pixCode?: string
    amount?: string
    expirationTime?: string
}

export function PixPaymentPage({
    pixCode = "00020126580014BR.GOV.BCB.PIX0114+551199999999520400005303986540610.005802BR5925NOME DO RECEBEDOR6009SAO PAULO62070503***6304B60E",
    amount = "67,56",
    expirationTime = "10:30"
}: PixPaymentPageProps) {
    const [copied, setCopied] = useState(false)

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCode)}&margin=0`

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(pixCode)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error('Falha ao copiar código pix:', error)
        }
    }

    return (
        <div className="flex flex-col relative px-4">
            <div className="mb-6 -mt-20 text-white px-1 text-left relative z-50">
                <p className="text-[17px] leading-snug font-normal">
                    Pague <span className="font-bold">R$ {amount}</span> via Pix para garantir <br />
                    sua compra
                </p>
            </div>

            <div className="mx-auto mb-8 relative z-50 shadow-xl rounded-2xl w-fit">
                <div className="bg-[var(--color-primary)] p-1.5 rounded-2xl">
                    <div className="bg-white p-1.5 rounded-xl">
                        <div className="w-44 h-44 bg-white rounded-lg overflow-hidden flex items-center justify-center">
                            <img
                                src={qrCodeUrl}
                                alt="QR Code para pagamento Pix"
                                className="w-full h-full object-contain"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center w-full px-1 mt-2">
                <div className="text-center mb-5 w-full">
                    <p className="text-[var(--color-dark)] text-[15px] font-medium flex flex-col sm:flex-row items-center justify-center gap-1">
                        <span>Este código expira em 30 minutos, pague até {expirationTime}</span>
                    </p>
                </div>

                <div className="w-full bg-white border border-[var(--color-gray-200)] rounded-xl p-4 mb-6 shadow-sm">
                    <p className="text-[11px] text-[var(--color-gray-600)] break-all font-mono leading-relaxed text-center uppercase tracking-wide">
                        {pixCode}
                    </p>
                </div>

                <button
                    onClick={handleCopy}
                    type="button"
                    className="w-full bg-[var(--color-primary)] hover:opacity-90 active:opacity-100 text-white font-semibold text-base h-12 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-100 mb-6"
                    aria-label={copied ? "Código copiado" : "Copiar código Pix"}
                >
                    {copied ? <Check size={20} /> : null}
                    <span>{copied ? 'Copiado!' : 'Copiar código pix'}</span>
                </button>

                <div className="flex items-center gap-2 text-[var(--color-primary)] font-medium text-sm pb-4">
                    <Clock size={18} className="stroke-[2px] animate-[spin_4s_linear_infinite]" />
                    <span>Aguardando o pagamento</span>
                </div>
            </div>
        </div>
    )
}