'use client'

import { useState, useCallback, useMemo, useEffect, type KeyboardEvent } from 'react'
import { Check } from 'lucide-react'
import Image from 'next/image'
import { useFormContext } from 'react-hook-form'
import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'
import AddressSummaryCard from '@/components/address-summary-card'
import { trackGtmEvent } from '@/utils/analytics/gtm'
import { formatMoney } from '@/utils/text/text'
import { usePublicPlanPrice } from '@/hooks/use-public-plan-price'

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
  const { price } = usePublicPlanPrice()
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

  const onCardKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSelectCard(id)
    }
  }, [handleSelectCard])

  return (
    <div className="relative -mt-20 flex flex-col px-6 py-4 md:px-8 lg:-mt-12 lg:px-10 xl:px-12">
      <div className="flex flex-col gap-2 relative z-50 mb-6 px-1">
        <TextTitle className="text-dark">Seus cartões</TextTitle>
        <TextSubtitle>Escolha um cartão salvo para realizar o pagamento</TextSubtitle>
      </div>

      <div className="mb-8 relative z-50 w-full flex flex-col gap-5">
        <p className="text-center text-white/90 leading-snug font-normal px-4">
          Realize o pagamento de <span className="font-bold text-white">{formatMoney(price)}</span> para iniciar a consulta do imóvel.
        </p>

        <AddressSummaryCard
          {...addressSummaryData}
        />
      </div>

      <div className="flex flex-col gap-4 relative z-50">
        {cards.map((card) => {
          const shellClasses = `flex flex-row items-stretch rounded-xl border bg-white transition-all duration-200 overflow-hidden
            ${card.isSelected ? 'bg-primary/5 border-primary shadow-sm shadow-primary/10' : 'border-gray-200 hover:border-gray-300'}`

          const selectionCircleClasses = `size-10 rounded-full flex items-center justify-center shrink-0 transition-colors
            ${card.isSelected ? 'bg-primary' : 'bg-gray-100'}`

          const selectableClasses =
            'flex flex-1 min-w-0 cursor-pointer items-center gap-4 p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary'

          return (
            <div key={card.id} className={shellClasses} data-testid={`saved-card-${card.id}`}>
              <div
                role="button"
                tabIndex={0}
                className={selectableClasses}
                onClick={() => handleSelectCard(card.id)}
                onKeyDown={(e) => onCardKeyDown(e, card.id)}
              >
                <div className={selectionCircleClasses}>
                  <Check className={`size-6 ${card.isSelected ? 'text-white' : 'text-gray-400'} stroke-[3px]`} />
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="shrink-0">
                    {card.brand === 'Mastercard' ? (
                      <div className="flex -space-x-1">
                        <div className="h-5 w-5 rounded-full bg-[#EB001B]" />
                        <div className="h-5 w-5 rounded-full bg-[#F79E1B]" />
                      </div>
                    ) : (
                      <Image
                        src="/images/visa.webp"
                        alt="Visa"
                        className="h-auto w-8"
                        width={32}
                        height={20}
                      />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col items-start">
                    <p className={`text-base font-semibold leading-snug ${card.isSelected ? 'text-primary' : 'text-dark'}`}>
                      {card.brand} ****{card.number}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">Vence {card.expiry}</p>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center border-l border-gray-100 px-2 py-2">
                {card.isSelected ? (
                  <div className="mr-1 flex size-6 items-center justify-center rounded-full bg-primary animate-in zoom-in duration-300">
                    <Check className="size-4 stroke-[3px] text-white" />
                  </div>
                ) : (
                  <button
                    type="button"
                    className="rounded-lg p-2 text-xs font-medium text-primary hover:bg-primary/5 hover:underline"
                    onClick={() => {
                      // handle edit
                    }}
                  >
                    Editar
                  </button>
                )}
              </div>
            </div>
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
