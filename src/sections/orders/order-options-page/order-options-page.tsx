'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronRight, FileText, Files, Users, Info } from 'lucide-react'
import OrderHeader from '@/sections/orders/order-header'
import { cn } from '@/utils/tailwind'

import { getOrder, Order } from '@/services/orders'

export default function OrderOptionsPage() {
  const { id } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!id) return
      try {
        const data = await getOrder(id as string)
        setOrder(data)
      } catch (error) {
        console.error('Erro ao buscar pedido:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id])

  const buttons = [
    {
      icon: FileText,
      title: 'Resultado',
      subtitle: 'Visualizar resultado completo',
      href: `/consultas/${id}`,
    },
    {
      icon: Files,
      title: 'Documentos',
      subtitle: 'Visualizar documentos da consulta',
      href: `/consultas/${id}/opcoes/documentos`,
    },
    {
      icon: Users,
      title: 'Proprietários ',
      subtitle: 'Visualizar proprietários da consulta',
      href: `/consultas/${id}/opcoes/proprietarios`,
    },
  ]

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

  const isNotFinished = order?.status.value !== 'FINISHED'

  return (
    <div className="flex flex-col gap-3">
      <OrderHeader />

      <div className="flex flex-col gap-2 px-3 lg:px-0 w-full mx-auto lg:max-w-lg">
        {isNotFinished ? (
          <div className="flex flex-col items-center justify-center p-8 border border-blue-100 rounded-sm bg-blue-50/50 text-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Info className="size-8 text-blue-600" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wide">
                Processo em análise
              </h3>
              <p className="text-xs text-blue-700 leading-relaxed">
                Esta consulta ainda está sendo processada pela nossa equipe. <br />
                As opções de visualização serão liberadas em breve.
              </p>
            </div>
          </div>
        ) : (
          buttons.map((button) => (

            <Link
              key={button.title}
              href={button.href}
              className={cn(
                'flex flex-col p-4 border border-box rounded-sm group transition-colors',
                button.title === "Resultado"
                  ? 'border-primary'
                  : 'hover:border-primary'
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
                    >{button.title}
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
        )}
      </div>
    </div>
  )
}