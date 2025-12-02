'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronRight, FileText, Files, Users } from 'lucide-react'
import OrderHeader from '@/sections/orders/order-header'

export default function OrderOptionsPage() {
  const { id } = useParams()

  const buttons = [
    {
      icon: FileText,
      title: 'Resultado',
      subtitle: 'Visualizar resultado completo',
      href: `/pedidos/${id}/opcoes/resultado`,
    },
    {
      icon: Files,
      title: 'Documentos',
      subtitle: 'Visualizar documentos da consulta',
      href: `/pedidos/${id}/opcoes/documentos`,
    },
    {
      icon: Users,
      title: 'Proprietários ',
      subtitle: 'Visualizar proprietários da consulta',
      href: `/pedidos/${id}/opcoes/proprietarios`,
    },
  ]

  return (
    <div className="flex flex-col">
      <OrderHeader />

      <div className="flex flex-col gap-2 px-3">
        {buttons.map((button) => (
          <Link
            key={button.title}
            href={button.href}
            className="flex flex-col p-4 border border-box rounded-sm group hover:border-primary"
          >
            <div className="flex items-center justify-between">
              <div className="flex gap-4 items-center">
                <button.icon className="size-6 text-primary" />

                <div className="flex flex-col gap-2">
                  <p className="text-sm font-semibold leading-[130%] group-hover:text-primary">
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
        ))}
      </div>
    </div>
  )
}
