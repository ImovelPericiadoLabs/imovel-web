'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ChevronRight, Inbox } from 'lucide-react'
import TextTitle from '@/components/text-title'
import Badge from '@/components/badge'
import LoadingOverlay from '@/components/loading-overlay'
import Button from '@/components/button'
import { formatDateWithTime } from '@/utils/date'
import { cn } from '@/utils/tailwind'
import { listOrders, type Order, type AnalysisStatus } from '@/services/orders'

const STATUS_STYLES = {
  green: { dot: 'bg-green-500', border: 'border-green-500', text: 'text-green-500', badge: 'border-green-500 text-green-500 bg-transparent' },
  yellow: { dot: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-500', badge: 'border-yellow-500 text-yellow-500 bg-transparent' },
  red: { dot: 'bg-red-500', border: 'border-red-500', text: 'text-red-500', badge: 'border-red-500 text-red-500 bg-transparent' },
  blue: { dot: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-500', badge: 'border-blue-500 text-blue-500 bg-transparent' },
  gray: { dot: 'bg-gray-300', border: 'border-gray-200', text: 'text-gray-400', badge: 'border-gray-300 text-gray-400 bg-transparent' },
}

const getOrderStyle = (order: Order) => {
  if (order.semaphore) {
    return STATUS_STYLES[order.semaphore]
  }

  const statusToColorMap: Record<AnalysisStatus, keyof typeof STATUS_STYLES> = {
    PENDING: 'blue',
    SEARCHING_DOCUMENT: 'blue',
    IN_PROGRESS: 'blue',
    APPROVED: 'green',
    REJECTED: 'red',
    CANCELED: 'gray',
    FINISHED: 'gray',
  }

  const statusValue = order.status?.value as AnalysisStatus | undefined

  if (statusValue && statusToColorMap[statusValue]) {
    return STATUS_STYLES[statusToColorMap[statusValue]]
  }

  return STATUS_STYLES.gray
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const observerRef = useRef<IntersectionObserver | null>(null)

  const fetchOrders = useCallback(async (targetPage: number) => {
    targetPage === 1 ? setIsLoading(true) : setIsFetchingMore(true)

    try {
      const { items, meta } = await listOrders({ limit: 10, p: targetPage })
      setOrders(prev => (targetPage === 1 ? items : [...prev, ...items]))
      setHasMore(meta.has_next)
    } catch {
      setHasMore(false)
    } finally {
      setIsLoading(false)
      setIsFetchingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders(page)
  }, [page, fetchOrders])

  const lastOrderElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (isLoading || isFetchingMore || !hasMore) return
      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          setPage(prev => prev + 1)
        }
      })

      if (node) observerRef.current.observe(node)
    },
    [isLoading, isFetchingMore, hasMore]
  )

  const renderEmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-80 animate-in fade-in duration-500">
      <Inbox className="w-12 h-12 text-gray-300 mb-4" />
      <h3 className="text-gray-900 font-medium text-base">Nenhuma consulta encontrada</h3>
      <p className="text-gray-400 text-sm mt-1 mb-6">Suas consultas aparecerão aqui.</p>
      <Button href="/consultar-imovel" className="max-w-xs">
        Consultar Imóvel
      </Button>
    </div>
  )

  return (
    <div className="relative z-40 flex-1 px-4 flex flex-col gap-5 pb-24 md:pb-0 max-w-4xl mx-auto w-full min-h-[80vh]">
      <TextTitle>Minhas Consultas</TextTitle>

      {!isLoading && orders.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order, index) => {
            const isLast = orders.length === index + 1
            const style = getOrderStyle(order)
            const dateLabel = order.status?.value === 'PENDING' ? 'Solicitado em' : 'Analisado em'

            return (
              <div key={order.id} ref={isLast ? lastOrderElementRef : null}>
                <Link
                  href={`/consultas/${order.id}/opcoes`}
                  className={cn(
                    'group p-4 bg-white border rounded-lg transition-all duration-200 block shadow-sm hover:shadow-md',
                    style.border
                  )}
                >
                  <div className="flex items-center">
                    <div className={cn('p-1.5 mr-4 rounded-full flex-shrink-0 animate-pulse', style.dot)} />

                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-gray-900 text-sm font-bold">Consulta #{order.code}</span>
                      <p className="text-gray-600 text-sm break-words">
                        {order.formatted_address || 'Endereço não informado'}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {dateLabel} {formatDateWithTime(order.modified || order.created)}
                      </p>

                      <div className="mt-2 flex gap-2 items-center">
                        <Badge className={cn('border bg-transparent shadow-none font-medium', style.badge)}>
                          {order.status?.label || 'Processando'}
                        </Badge>
                        {!!order.analysis?.length && (
                          <span className="text-[10px] text-gray-400">
                            • {order.analysis.length} pontos analisados
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={cn('opacity-0 group-hover:opacity-100 transition-opacity ml-2', style.text)}>
                      <ChevronRight className="w-4 h-4" />
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
          <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      <LoadingOverlay isLoading={isLoading && page === 1} message="Carregando consultas..." />
    </div>
  )
}
