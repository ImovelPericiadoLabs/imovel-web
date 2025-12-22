'use client'

import { Download } from 'lucide-react'
import OrderHeader from '@/sections/orders/order-header'
import { useEffect, useState } from 'react'
import { getOrder, Order } from '@/services/orders'
import { useParams } from 'next/navigation'

export default function OrderOptionsDocumentsPage() {
  const { id } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

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

  async function handleDownload(
    fileUrl: string,
    fileName: string
  ) {
    try {
      setDownloadingId(fileName)

      const response = await fetch(fileUrl)
      if (!response.ok) {
        throw new Error('Erro ao baixar o arquivo')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()

      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro no download:', error)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <OrderHeader />

      <div className="flex flex-col gap-2 px-3 lg:px-0 w-full mx-auto lg:max-w-lg">
        {order?.documents?.map((document) => {
          const fileName =
            document.original_name?.endsWith(`.${document.extension}`)
              ? document.original_name
              : `${document.original_name}.${document.extension}`

          return (
            <button
              key={document.id}
              onClick={() =>
                handleDownload(document.file_path, fileName)
              }
              className="text-left cursor-pointer flex flex-col p-4 border border-box rounded-sm group hover:border-primary disabled:opacity-60"
              disabled={downloadingId === fileName}
            >
              <div className="flex gap-4 items-center">
                <Download className="size-6 text-primary shrink-0" />

                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-[130%] group-hover:text-primary truncate">
                    Documento - {document.extension.toUpperCase()}
                  </p>

                  <p className="text-dark text-xs font-normal leading-4 group-hover:text-primary truncate">
                    {document.original_name}
                  </p>

                  {downloadingId === fileName && (
                    <span className="text-xs text-primary">
                      Baixando...
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
