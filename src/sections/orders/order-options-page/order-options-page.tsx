'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronRight, FileText, Files, Users, Info, RotateCcw } from 'lucide-react'
import OrderHeader from '@/sections/orders/order-header'
import { cn } from '@/utils/tailwind'

import { useOrderDetailQuery } from '@/hooks/use-order-detail-query'
import { isOrderPaymentConfirmed } from '@/domain/order-journey'
import { REREQUESTABLE_STATUS_VALUES } from '@/sections/orders/constants'

export default function OrderOptionsPage() {
  const { id } = useParams()
  const orderId = id as string

  const { data: order, isLoading } = useOrderDetailQuery(orderId)

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
  const onrProtocol = order?.document_response?.onr_protocol
  const statusValue = order?.status?.value
  const statusLabel = order?.status?.label ?? statusValue

  const inProgress =
    statusValue === 'SEARCHING_DOCUMENT' || statusValue === 'IN_PROGRESS'
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
                  'text-sm font-semibold leading-[130%]',
                  button.title === 'Resultado'
                    ? 'text-primary'
                    : 'group-hover:text-primary'
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

      <div className="flex flex-col gap-2 px-3 lg:px-0 w-full mx-auto lg:max-w-lg">
        {inProgress ? (
          <div className="flex flex-col items-center justify-center p-6 border border-blue-100 rounded-2xl bg-blue-50/60 text-center gap-4 shadow-sm">
            <div className="bg-blue-100 p-3 rounded-full">
              <Info className="size-8 text-blue-600" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-blue-900">
                Consulta em Análise
              </h3>
              <p className="text-xs text-blue-700 leading-relaxed">
                Esta consulta ainda está sendo processada pela nossa equipe. As
                opções de visualização serão liberadas em breve.
              </p>
            </div>
          </div>
        ) : statusValue === 'PENDING' ? (
          paymentConfirmed ? (
            <div className="flex flex-col items-center justify-center p-6 border border-blue-100 rounded-2xl bg-blue-50/60 text-center gap-4 shadow-sm">
              <h3 className="text-sm font-semibold text-blue-900">
                Consulta em retomada
              </h3>
              <p className="text-xs text-blue-700 leading-relaxed">
                O pagamento já está confirmado. Estamos iniciando ou retomando o
                processamento — volte à página principal da consulta para ver o
                andamento em tempo real.
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