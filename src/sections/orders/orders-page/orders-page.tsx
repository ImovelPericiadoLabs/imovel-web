'use client'

import { useRef, useCallback } from 'react'
import Link from 'next/link'
import { ChevronRight, Inbox } from 'lucide-react'
import { useInfiniteQuery } from '@tanstack/react-query'

import { CONSULTAR_IMOVEL_INICIO_HREF } from '@/constants/consult-flow'
import { Surface } from '@/components/ui/surfaces'
import { HeroTitle } from '@/components/ui/typography'
import { cn } from '@/utils/tailwind'
import Badge from '@/components/badge'
import LoadingOverlay from '@/components/loading-overlay'
import Button from '@/components/button'

import { formatDateWithTime } from '@/utils/date'

import { listOrders, type Order } from '@/services/orders'
import {
  resolveOrderTheme,
  resolveListBadgeLabel
} from '@/sections/orders/constants'

const ORDERS_QUERY_KEY = ['orders'] as const
const PAGE_SIZE = 10

export default function OrdersPage() {
  const observerRef = useRef<IntersectionObserver | null>(null)

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage
  } = useInfiniteQuery({
    queryKey: ORDERS_QUERY_KEY,
    queryFn: ({ pageParam }) =>
      listOrders({ limit: PAGE_SIZE, p: pageParam }),
    initialPageParam: 1,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    getNextPageParam: lastPage =>
      lastPage.meta.has_next ? lastPage.meta.page + 1 : undefined
  })

  const orders: Order[] = data?.pages.flatMap(p => p.items) ?? []

  const lastOrderElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (isLoading || isFetchingNextPage || !hasNextPage) return
      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) fetchNextPage()
      })

      if (node) observerRef.current.observe(node)
    },
    [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]
  )

  const renderEmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-80 animate-in fade-in duration-500">
      <Inbox className="w-12 h-12 text-gray-300 mb-4" />
      <h3 className="text-gray-900 font-medium text-base">
        Nenhuma consulta encontrada
      </h3>
      <p className="text-gray-400 text-sm mt-1 mb-6">
        Suas consultas aparecerão aqui.
      </p>
      <Button href={CONSULTAR_IMOVEL_INICIO_HREF} className="max-w-xs">
        Consultar Imóvel
      </Button>
    </div>
  )

  return (
    <div className="relative z-40 flex-1 px-4 flex flex-col gap-5 pb-24 md:pb-0 max-w-4xl mx-auto w-full min-h-[80vh]">
      <Surface variant="dark">
        <HeroTitle variant="large">Minhas Consultas</HeroTitle>
      </Surface>

      {!isLoading && orders.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order, index) => {
            const isLast = orders.length === index + 1
            const isFinished = order.status?.value === 'FINISHED'

            const theme = resolveOrderTheme(order)
            const badgeLabel = resolveListBadgeLabel(order)

            const dateLabel = isFinished ? 'Analisado em' : 'Solicitado em'

            return (
              <div key={order.id} ref={isLast ? lastOrderElementRef : null} className="flex flex-col gap-2">
                <Link
                  href={`/consultas/${order.id}`}
                  className={cn(
                    'group p-4 bg-white border rounded-xl transition-all duration-200 block shadow-sm hover:shadow-md',
                    theme.border
                  )}
                >
                  <div className="flex items-center">
                    <div
                      className={cn(
                        'p-1.5 mr-4 rounded-full flex-shrink-0',
                        !isFinished && 'animate-pulse',
                        theme.dot
                      )}
                    />

                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-gray-900 text-sm font-bold">
                        Consulta #{order.code}
                      </span>

                      <p className="text-gray-600 text-sm break-words">
                        {order.formatted_address || 'Endereço não informado'}
                      </p>

                      <p className="text-gray-400 text-xs mt-0.5">
                        {dateLabel}{' '}
                        {formatDateWithTime(
                          order.modified || order.created
                        )}
                      </p>

                      <div className="mt-2 flex gap-2 items-center flex-wrap">
                        <Badge
                          variant={theme.variant}
                          className={cn(
                            'bg-transparent shadow-none font-medium border',
                            theme.badge
                          )}
                        >
                          {badgeLabel}
                        </Badge>

                        {order.can_rerequest && (
                          <Badge
                            variant="warning"
                            className="bg-amber-50 text-amber-800 border-amber-200 text-xs font-medium"
                          >
                            Pode re-solicitar
                          </Badge>
                        )}

                        {!!order.analysis?.length && (
                          <span className="text-[10px] text-gray-400">
                            • {order.analysis.length} pontos analisados
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className={cn(
                        'opacity-0 group-hover:opacity-100 transition-opacity ml-2',
                        theme.text
                      )}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      <LoadingOverlay
        isLoading={isLoading}
        message="Carregando consultas..."
      />
    </div>
  )
}
