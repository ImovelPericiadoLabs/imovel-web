'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Check } from 'lucide-react'
import Image from 'next/image'
import { useFormContext } from 'react-hook-form'
import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'
import AddressSummaryCard from '@/components/address-summary-card'
import { trackGtmEvent } from '@/utils/analytics/gtm'

interface Card {
  id: string
  number: string
  expiry: string
  brand: string
  isSelected: boolean
}

export function SavedCardsPage({
  onAddNewCard,
}: {
  onAddNewCard: () => void
}) {
  const [cards, setCards] = useState<Card[]>([
    { id: '1', number: '1234', expiry: '11/29', brand: 'Mastercard', isSelected: true },
    { id: '2', number: '7536', expiry: '11/28', brand: 'Visa', isSelected: false },
  ])

  const handleSelectCard = useCallback((id: string) => {
    setCards((prev) =>
      prev.map((c) => ({
        ...c,
        isSelected: c.id === id,
      }))
    )
    trackGtmEvent('saved_card_selected', {
      event_category: 'payment',
      event_label: id,
      event_description: 'Cartão salvo selecionado para pagamento.',
      card_id: id,
    })
  }, [])

  const { getValues } = useFormContext()

  const cardValues = useCallback((field: string) => {
    return getValues(field)
  }, [getValues])

  const addressSummaryData = useMemo(() => ({
    address: cardValues('address'),
    registrationNumber: cardValues('registrationNumber'),
    allotment: cardValues('allotment'),
    block: cardValues('block'),
    lot: cardValues('lot'),
  }), [cardValues])

  useEffect(() => {
    trackGtmEvent('saved_cards_view', {
      event_category: 'payment',
      event_label: 'saved_cards',
      event_description: 'Tela de seleção de cartões salvos visualizada.',
      cards_count: cards.length,
    })
  }, [cards.length])

  return (
    <div className="flex flex-col relative px-6 py-4 -mt-20">
      <div className="flex flex-col gap-2 relative z-50 mb-6 px-1">
        <TextTitle className="text-dark">Seus cartões</TextTitle>
        <TextSubtitle>Escolha um cartão salvo para realizar o pagamento</TextSubtitle>
      </div>

      <div className="mb-8 relative z-50 w-full flex flex-col gap-5">
        <p className="text-center text-white/90 leading-snug font-normal px-4">
          Realize o pagamento do valor <span className="font-bold text-white">R$ 59,00</span> para começar a consulta dos dados do endereço
        </p>

        <AddressSummaryCard
          {...addressSummaryData}
        />
      </div>

      <div className="flex flex-col gap-4 relative z-50">
        {cards.map((card) => {
          const cardClasses = `flex flex-col p-4 rounded-xl border bg-white cursor-pointer transition-all duration-200
            ${card.isSelected ? 'bg-primary/5 border-primary shadow-sm shadow-primary/10' : 'bg-white border-gray-200 hover:border-gray-300'}`

          const selectionCircleClasses = `size-10 rounded-full flex items-center justify-center shrink-0 transition-colors
            ${card.isSelected ? 'bg-primary' : 'bg-gray-100'}`

          return (
            <button
              key={card.id}
              type="button"
              className={cardClasses}
              onClick={() => handleSelectCard(card.id)}
            >
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-4">
                  <div className={selectionCircleClasses}>
                    <Check className={`size-6 ${card.isSelected ? 'text-white' : 'text-gray-400'} stroke-[3px]`} />
                  </div>

                  <div className="flex items-center gap-3">
                    <div>
                      {card.brand === 'Mastercard' ? (
                        <div className="flex -space-x-1">
                          <div className="w-5 h-5 rounded-full bg-[#EB001B]" />
                          <div className="w-5 h-5 rounded-full bg-[#F79E1B]" />
                        </div>
                      ) : (
                        <Image
                          src="/images/visa.webp"
                          alt="Visa"
                          className="w-8 h-auto"
                          width={32}
                          height={20}
                        />
                      )}
                    </div>

                    <div className="flex flex-col items-start flex-1">
                      <p className={`text-base font-semibold ${card.isSelected ? 'text-primary' : 'text-dark'}`}>
                        {card.brand} ****{card.number}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Vence {card.expiry}
                      </p>
                    </div>
                  </div>
                </div>

                {card.isSelected ? (
                  <div className="size-6 bg-primary rounded-full flex items-center justify-center animate-in zoom-in duration-300 mr-2">
                    <Check className="size-4 text-white stroke-[3px]" />
                  </div>
                ) : (
                  <button 
                    type="button"
                    className="text-xs text-primary font-medium hover:underline p-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      // handle edit
                    }}
                  >
                    Editar
                  </button>
                )}
              </div>
            </button>
          )
        })}

        <div className="mt-4 pb-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              trackGtmEvent('add_new_card_click', {
                event_category: 'payment',
                event_label: 'add_new_card',
                event_description: 'Usuário escolheu adicionar um novo cartão.',
              })
              onAddNewCard()
            }}
            className="w-full bg-primary text-white py-4 rounded-xl font-semibold text-base shadow-sm hover:opacity-90 active:opacity-100 transition"
          >
            Novo cartão
          </button>
        </div>
      </div>
    </div>
  )
}
