'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, FileText, Files, Users, RotateCcw } from 'lucide-react'
import OrderHeader from '@/sections/orders/order-header'
import { cn } from '@/utils/tailwind'

import { useOrderDetailQuery } from '@/hooks/use-order-detail-query'
import { isOrderPaymentConfirmed } from '@/domain/order-journey'
import { REREQUESTABLE_STATUS_VALUES } from '@/sections/orders/constants'
import { orderQueryKey, replyNotaryQuestion } from '@/services/orders'

export default function OrderOptionsPage() {
  const { id } = useParams()
  const orderId = id as string
  const queryClient = useQueryClient()

  const { data: order, isLoading } = useOrderDetailQuery(orderId)
  const [reply, setReply] = useState('')
  const [replyError, setReplyError] = useState<string | null>(null)

  const replyMutation = useMutation({
    mutationFn: (message: string) => replyNotaryQuestion(orderId, message),
    onSuccess: async () => {
      setReply('')
      setReplyError(null)
      await queryClient.invalidateQueries({ queryKey: orderQueryKey(orderId) })
    },
    onError: () => {
      setReplyError('Não foi possível enviar a resposta. Tente novamente.')
    },
  })

  const buttons = [
    {
      icon: FileText,
      title: 'Resultado',
      subtitle: 'Visualizar resultado completo',
      href: `/consultas/${id}/visualizar`,
    },
    {
      icon: Files,
      title: 'Documentos',
      subtitle: 'Relatório PDF, matrícula e certidões anexas',
      href: `/consultas/${id}/opcoes/documentos`,
    },
    {
      icon: Users,
      title: 'Proprietários ',
      subtitle: 'Visualizar proprietários da consulta',
      href: `/consultas/${id}/opcoes/proprietarios`,
    },
  ]

  const returnReason = order?.document_response?.return_reason
  const notaryQuestion =
    order?.notary_question || order?.document_response?.latest_notary_message
  const onrProtocol = order?.document_response?.onr_protocol
  const statusValue = order?.status?.value
  const statusLabel = order?.status?.label ?? statusValue

  const inProgress =
    statusValue === 'SEARCHING_DOCUMENT' || statusValue === 'IN_PROGRESS'
  const awaitingNotaryReply =
    statusValue === 'AWAITING_CUSTOMER_REPLY' || order?.can_reply_notary === true
  const showRerequest = order?.can_rerequest === true
  const paymentConfirmed = isOrderPaymentConfirmed(order?.payment_status)
  const isFinalWithRerequest =
    statusValue != null &&
    REREQUESTABLE_STATUS_VALUES.includes(
      statusValue as (typeof REREQUESTABLE_STATUS_VALUES)[number]
    )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <OrderHeader />
        <div className="flex justify-center p-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
        </div>
      </div>
    )
  }

  function renderOptionCards() {
    return buttons.map((button) => (
      <Link
        key={button.title}
        href={button.href}
        className={cn(
          'flex flex-col p-4 border border-box rounded-sm group transition-colors',
          button.title === 'Resultado' ? 'border-primary' : 'hover:border-primary'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex gap-4 items-center">
            <button.icon className="size-6 text-primary" />
            <div className="flex flex-col gap-2">
              <p
                className={cn(
                  'text-sm font-semibold leading-[130%] group-hover:text-primary',
                  button.title === 'Resultado' ? 'text-primary' : 'text-gray-900'
                )}
              >
                {button.title}
              </p>
              <p className="text-gray-2 text-xs font-normal leading-[130%] group-hover:text-primary">
                {button.subtitle}
              </p>
            </div>
          </div>
          <ChevronRight className="size-6 text-primary" />
        </div>
      </Link>
    ))
  }

  return (
    <div className="flex flex-col gap-3">
      <OrderHeader />

      <div className="flex flex-col gap-3">
        {statusValue === 'PENDING' ? (
          paymentConfirmed ? (
            <div className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-2xl bg-gray-50/80 text-center gap-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">
                Em processamento
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Pagamento confirmado. Acompanhe o andamento em tempo real.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-2xl bg-gray-50/80 text-center gap-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">Pendente</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Sua solicitação foi recebida. Finalize o pagamento para
                iniciarmos a consulta.
              </p>
            </div>
          )
        ) : statusValue === 'FINISHED' ? (
          renderOptionCards()
        ) : awaitingNotaryReply ? (
          <div className="p-4 border border-amber-200 rounded-xl bg-amber-50/80 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-amber-900">
              {statusLabel || 'Cartório pediu informações'}
            </h3>
            {notaryQuestion ? (
              <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-line font-medium py-2 px-3 rounded-lg bg-amber-100/80 border border-amber-300">
                {notaryQuestion}
              </p>
            ) : (
              <p className="text-sm text-amber-900 leading-relaxed">
                O cartório solicitou informações adicionais para continuar o
                pedido.
              </p>
            )}
            {onrProtocol && (
              <p className="text-xs text-amber-700">Protocolo: {onrProtocol}</p>
            )}
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={5}
              placeholder="Escreva a resposta para o cartório…"
              className="w-full text-sm rounded-lg border border-amber-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400"
            />
            {replyError && (
              <p className="text-xs text-red-600">{replyError}</p>
            )}
            <button
              type="button"
              disabled={reply.trim().length < 5 || replyMutation.isPending}
              onClick={() => replyMutation.mutate(reply.trim())}
              className="self-end rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {replyMutation.isPending ? 'Enviando…' : 'Enviar resposta'}
            </button>
            {replyMutation.isSuccess && (
              <p className="text-xs text-amber-800">
                Resposta enfileirada. O pedido volta a acompanhar o cartório no
                mesmo protocolo.
              </p>
            )}
          </div>
        ) : isFinalWithRerequest ? (
          <>
            <div className="p-4 border border-amber-200 rounded-xl bg-amber-50/80">
              <h3 className="text-sm font-semibold text-amber-900 mb-2">
                {statusLabel}
              </h3>
              {returnReason ? (
                <p
                  className={cn(
                    'text-sm text-amber-900 leading-relaxed whitespace-pre-line',
                    (statusValue === 'REJECTED_DATA' ||
                      statusValue === 'RETURNED_BY_NOTARY') &&
                      'font-medium py-2 px-3 rounded-lg bg-amber-100/80 border border-amber-300'
                  )}
                >
                  {returnReason}
                </p>
              ) : statusValue === 'CANCELED' ? (
                <p className="text-sm text-amber-900 leading-relaxed">
                  Esta consulta foi cancelada. Você pode re-solicitar usando seus
                  créditos.
                </p>
              ) : statusValue === 'RETURNED_BY_NOTARY' ? (
                <p className="text-sm text-amber-900 leading-relaxed">
                  Justificativa não disponível. Você pode re-solicitar usando
                  seus créditos.
                </p>
              ) : (
                <p className="text-sm text-amber-900 leading-relaxed">
                  Não foi possível concluir a consulta. Você pode re-solicitar
                  usando seus créditos, corrigindo ou complementando os dados.
                </p>
              )}
              {onrProtocol && (
                <p className="text-xs text-amber-700 mt-2">
                  Protocolo: {onrProtocol}
                </p>
              )}
            </div>

            {showRerequest && (
              <Link
                href={`/consultas/${id}/opcoes/re-solicitar`}
                className={cn(
                  'flex flex-col p-4 border border-box rounded-sm group transition-colors hover:border-primary'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 items-center">
                    <RotateCcw className="size-6 text-primary" />
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-semibold leading-[130%] group-hover:text-primary text-gray-900">
                        Re-solicitar
                      </p>
                      <p className="text-gray-2 text-xs font-normal leading-[130%] group-hover:text-primary">
                        Corrigir dados e solicitar novamente
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="size-6 text-primary" />
                </div>
              </Link>
            )}
          </>
        ) : inProgress ? (
          <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/80">
            <h3 className="text-sm font-semibold text-gray-900">
              {statusLabel}
            </h3>
          </div>
        ) : (
          <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/80">
            <h3 className="text-sm font-semibold text-gray-900">
              {statusLabel}
            </h3>
          </div>
        )}
      </div>
    </div>
  )
}
