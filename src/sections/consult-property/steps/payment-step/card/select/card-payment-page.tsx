'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

interface Card {
  id: string
  number: string
  expiry: string
  brand: string
  isSelected: boolean
}

export function SavedCardsPage({
  onAddNewCard,
  onConfirmCard,
}: {
  onAddNewCard: () => void
  onConfirmCard: () => void
}) {
  const [cards, setCards] = useState<Card[]>([
    { id: '1', number: '1234', expiry: '11/29', brand: 'Mastercard', isSelected: true },
    { id: '2', number: '7536', expiry: '11/28', brand: 'Visa', isSelected: false },
  ])

  function handleSelectCard(id: string) {
    setCards((prev) =>
      prev.map((c) => ({
        ...c,
        isSelected: c.id === id,
      }))
    )
  }

  function handleConfirm() {
    const selected = cards.find((c) => c.isSelected)
    if (selected) onConfirmCard()
  }

  return (
    <div className="flex flex-col relative p-6">
      <div className="flex flex-col gap-4 relative z-50 -mt-5">
        {cards.map((card) => {
          const cardClasses = `flex flex-col p-4 rounded-xl border bg-white cursor-pointer shadow-xl transition-all
            ${card.isSelected ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' : 'border-gray-200 hover:border-gray-300'}`

          const selectionCircleClasses = `w-6 h-6 rounded-full border flex items-center justify-center transition-colors duration-200 shrink-0
            ${card.isSelected ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'bg-white border-gray-300'}`

          return (
            <div
              key={card.id}
              className={cardClasses}
              onClick={() => handleSelectCard(card.id)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div>
                    {card.brand === 'Mastercard' ? (
                      <div className="flex -space-x-1">
                        <div className="w-6 h-6 rounded-full bg-[#EB001B]" />
                        <div className="w-6 h-6 rounded-full bg-[#F79E1B]" />
                      </div>
                    ) : (
                      <img
                        src="/images/visa.webp"
                        alt="Visa"
                        className="w-10 h-auto"
                      />
                    )}
                  </div>

                  <div className="flex flex-col items-start">
                    <p className="text-[15px] font-semibold text-gray-900 leading-tight">
                      {card.brand} final ****{card.number}
                    </p>
                    <p className="text-[13px] text-gray-600 mt-0.5">
                      Vence {card.expiry}
                    </p>
                    <button className="text-[14px] text-[var(--color-primary)] font-medium mt-3 hover:underline text-left">
                      Editar
                    </button>
                  </div>
                </div>

                <div className={selectionCircleClasses}>
                  {card.isSelected && (
                    <Check size={16} className="text-white stroke-[3px]" />
                  )}
                </div>
              </div>
            </div>
          )
        })}

        <div className="mt-4 pb-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onAddNewCard}
            className="w-full bg-[var(--color-primary)] text-white py-4 rounded-4xl font-semibold text-[16px] shadow-lg shadow-violet-100 hover:opacity-90 active:opacity-100 transition"
          >
            Novo cartão
          </button>
        </div>
      </div>
    </div>
  )
}
