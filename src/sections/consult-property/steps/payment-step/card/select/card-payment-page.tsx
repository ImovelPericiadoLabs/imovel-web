'use client'

import { useState } from 'react'

interface Card {
    id: string
    number: string
    expiry: string
    brand: string
    isSelected: boolean
}

export function SavedCardsPage() {
    const [cards, setCards] = useState<Card[]>([
        { id: '1', number: '1234', expiry: '11/29', brand: 'Mastercard', isSelected: true },
        { id: '2', number: '7536', expiry: '11/28', brand: 'Visa', isSelected: false }
    ])

    const handleSelectCard = (id: string) => {
        // Altera para que apenas um cartão possa ser selecionado por vez
        setCards(cards.map(card => ({
            ...card,
            isSelected: card.id === id
        })))
    }

    return (
        // Container principal da página (já tem p-6)
        <div className="bg-background min-h-screen p-6 relative">

            {/* ⭐️ ALTERAÇÃO CHAVE: Aplicação de z-50 e -mt-20 aqui. */}
            <div className="relative z-50 -mt-20">

                {/* Cabeçalho de contexto (Adicionado para dar o mesmo visual do Pix) */}
                <div className="mb-6 text-[var(--color-dark)] text-left px-1">
                    <p className="text-[17px] leading-snug font-normal text-white">
                        Selecione seu cartão para garantir <br />
                        <span className="font-bold">sua compra</span>
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    {cards.map((card) => {
                        // Removida a lógica isFirstCard, pois o z-index e o -mt foram movidos para o container pai
                        const cardClasses = `flex flex-col p-4 rounded-xl border bg-white cursor-pointer shadow-xl
                            ${card.isSelected ? 'border-[var(--color-primary)]' : 'border-gray-300'}`

                        return (
                            <div
                                key={card.id}
                                className={cardClasses}
                                onClick={() => handleSelectCard(card.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {/* Bandeira */}
                                        {card.brand === "Mastercard" ? (
                                            <div className="flex -space-x-1">
                                                <div className="w-6 h-6 rounded-full bg-[#EB001B]" />
                                                <div className="w-6 h-6 rounded-full bg-[#F79E1B]" />
                                            </div>
                                        ) : (
                                            // 🌐 Usando o arquivo WebP
                                            <img
                                                src="/images/visa.webp"
                                                alt="Visa"
                                                className="w-10 h-auto"
                                            />
                                        )}

                                        <div>
                                            <p className="text-[15px] font-semibold text-gray-900">
                                                {card.brand} final ****{card.number}
                                            </p>
                                            <p className="text-[13px] text-gray-600 -mt-1">
                                                Vence {card.expiry}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Indicador Selecionado */}
                                    <div
                                        className="w-5 h-5 rounded-full border flex items-center justify-center
                                            border-gray-400"
                                    >
                                        {card.isSelected && (
                                            <div className="w-3 h-3 bg-[var(--color-primary)] rounded-full" />
                                        )}
                                    </div>
                                </div>

                                {/* Editar */}
                                <button className="text-[14px] text-[var(--color-primary)] mt-2 ml-1 self-start">
                                    Editar
                                </button>
                            </div>
                        )
                    })}

                    {/* Botão Novo Cartão */}
                    <div className="mt-4">
                        <button className="w-full bg-[var(--color-primary)] text-white py-4 rounded-xl
                        font-semibold text-[16px] shadow-md hover:opacity-90 transition">
                            Novo cartão
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
