'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { MapPin, ChevronRight, FileText, Files, Users } from 'lucide-react'
import TrafficLight from '@/components/traffic-light'

export default function OrderPage() {
  const { id } = useParams()

  const buttons = [
    {
      icon: FileText,
      title: 'Resultado',
      subtitle: 'Visualizar resultado completo',
      href: `/pedidos/${id}/resultado`,
    },
    {
      icon: Files,
      title: 'Documentos',
      subtitle: 'Visualizar documentos da consulta',
      href: `/pedidos/${id}/documentos`,
    },
    {
      icon: Users,
      title: 'Proprietários ',
      subtitle: 'Visualizar proprietários da consulta',
      href: `/pedidos/${id}/proprietarios`,
    },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex align-middle justify-between">
        <p className="text-base font-semibold leading-[130%] self-center">#000001</p>

        <div className="flex flex-col">
          <p className="text-gray-2 text-[0.65rem] font-normal leading-[130%] self-end">
            Solicitado em
          </p>

          <p className="text-base font-semibold leading-[130%]">26/11/2025 16:23</p>
        </div>
      </div>

      <div className="bg-box rounded-sm px-4 py-5">
        <div className="flex gap-4">
          <MapPin className="size-6" />

          <p className="text-xs font-normal leading-[130%]">
            Rua Pamplona, 1593, Jardim Paulista, São Paulo, SP, CEP 01405-002.
          </p>
        </div>
      </div>

      <div className="flex align-middle justify-center">
        <TrafficLight red />
      </div>

      <div className="flex flex-col gap-2">
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
