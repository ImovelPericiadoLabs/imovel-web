'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import TextTitle from '@/components/text-title'
import Badge from '@/components/badge'
import LoadingOverlay from '@/components/loading-overlay'
import { formatDateWithTime } from '@/utils/date'
import { cn } from '@/utils/tailwind'
import { listOrders } from '@/services/orders'
import type { Order } from '@/services/orders'

const ChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
)

const EmptyInboxIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 text-gray-300">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
  </svg>
)

const mapAnalysisBadge: Record<string, any> = {
  IN_PROGRESS: { label: 'Em análise', dot: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-500', badgeClass: 'border-blue-500 text-blue-500 bg-transparent' },
  PENDING: { label: 'Aguardando Pagamento', dot: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-500', badgeClass: 'border-blue-500 text-blue-500 bg-transparent' },
  APPROVED: { label: 'Aprovado', dot: 'bg-green-500', border: 'border-green-500', text: 'text-green-500', badgeClass: 'border-green-500 text-green-500 bg-transparent' },
  REJECTED: { label: 'Risco Detectado', dot: 'bg-red-500', border: 'border-red-500', text: 'text-red-500', badgeClass: 'border-red-500 text-red-500 bg-transparent' },
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const observerRef = useRef<IntersectionObserver | null>(null)

  const lastOrderElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading || isFetchingMore) return
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage((prevPage) => prevPage + 1)
      }
    })

    if (node) observerRef.current.observe(node)
  }, [isLoading, isFetchingMore, hasMore])

  useEffect(() => {
    async function fetchOrders() {
      if (page === 1) setIsLoading(true)
      else setIsFetchingMore(true)

      try {
        const response = await listOrders({ limit: 10, p: page })
        const newOrders = response.items || []

        setOrders((prevOrders) => {
          if (page === 1) return newOrders
          return [...prevOrders, ...newOrders]
        })

        setHasMore(response.meta.has_next)
      } catch (error) {
        console.error('Erro ao buscar pedidos:', error)
      } finally {
        setIsLoading(false)
        setIsFetchingMore(false)
      }
    }

    fetchOrders()
  }, [page])

  return (
    <div className="relative z-40 flex-1 px-4 flex flex-col gap-5 pb-24 md:pb-0 max-w-4xl mx-auto w-full min-h-[80vh]">
      <TextTitle>Meus pedidos</TextTitle>

      {orders.length === 0 && !isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-80 animate-in fade-in duration-500">
          <div className="mb-4">
            <EmptyInboxIcon />
          </div>
          <h3 className="text-gray-900 font-medium text-base">
            Nenhum pedido encontrado
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            Seus pedidos aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order, index) => {
            const isLastElement = orders.length === index + 1
            const style = mapAnalysisBadge[order.analysis_status] || { 
              label: order.analysis_status, 
              dot: 'bg-gray-300', 
              border: 'border-gray-200',
              text: 'text-gray-400',
              badgeClass: 'border-gray-300 text-gray-400 bg-transparent'
            }

            return (
              <div
                key={`${order.id}`}
                ref={isLastElement ? lastOrderElementRef : null}
              >
                <Link
                  className={cn(
                    "group cursor-pointer p-4 bg-white border rounded-lg transition-all duration-200 ease-in-out block shadow-sm",
                    style.border
                  )}
                  href={`/pedidos/${order.id}/opcoes`}
                >
                  <div className="flex items-center">
                    <div
                      className={cn(
                        'p-1.5 mr-4 rounded-full flex-shrink-0 animate-pulse',
                        style.dot
                      )}
                    />

                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex justify-between items-center w-full">
                        <span className="text-gray-900 text-sm font-bold">
                          Pedido #{order.code}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm font-normal break-words">
                        {order.formatted_address || 'Endereço não informado'}
                      </p>

                      <p className="text-gray-400 text-xs mt-0.5">
                        Analisado em {formatDateWithTime(order.modified)}
                      </p>

                      <div className="mt-2 flex gap-2 items-center">
                        <Badge className={cn("border bg-transparent shadow-none font-medium", style.badgeClass)}>
                          {style.label}
                        </Badge>

                        {order.analysis?.length > 0 && (
                          <span className="text-[10px] text-gray-400">
                            • {order.analysis.length} pontos analisados
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={cn(
                      "opacity-0 group-hover:opacity-100 transition-opacity ml-2",
                      style.text
                    )}>
                      <ChevronRight />
                    </div>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {isFetchingMore && (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      <LoadingOverlay isLoading={isLoading && page === 1} message="Carregando pedidos..." />
    </div>
  )
}