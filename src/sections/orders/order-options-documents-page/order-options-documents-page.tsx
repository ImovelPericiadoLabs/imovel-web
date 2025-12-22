'use client'

import { Download } from 'lucide-react'
import OrderHeader from '@/sections/orders/order-header'
import BadgeComponent from '@/components/badge'
import { useEffect, useState } from 'react'
import { getOrder, Order } from '@/services/orders'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function OrderOptionsDocumentsPage() {
  const { id } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  
    useEffect(() => {
      async function fetchHeaderData() {
        if (!id) return
  
        try {
          const data = await getOrder(id as string)
          setOrder(data)
        } catch (error) {
          console.error('Erro ao carregar cabeçalho:', error)
        } 
      }
  
      fetchHeaderData()
    }, [id])

    
  return (
    <div className="flex flex-col gap-3">
      <OrderHeader />

      <div className="flex flex-col gap-2 px-3 lg:px-0 w-full mx-auto lg:max-w-lg">
        {order?.documents?.map((document) => (
          <Link
            key={document.id}
            className="cursor-pointer flex flex-col p-4 border border-box rounded-sm group hover:border-primary"
            href={document.file_path}
             target="_blank"
    rel="noopener noreferrer"
            
          >
            <div className="flex gap-4 items-center">
              <Download className="size-6 text-primary shrink-0" />

              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <p className="text-sm font-semibold leading-[130%] group-hover:text-primary truncate">
                 Documento - {document.extension.toLocaleUpperCase()}
                </p>

                <p className="text-dark text-xs font-normal leading-4 group-hover:text-primary truncate">
                  {document.original_name}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}