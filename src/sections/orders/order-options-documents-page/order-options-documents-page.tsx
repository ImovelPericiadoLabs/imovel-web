'use client'

import { useState } from 'react'
import { Download, Info, FileText } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import OrderHeader from '@/sections/orders/order-header'
import {
  getOrder,
  orderQueryKey,
  getAnalysisPdfBlob,
  getDocumentBlob,
  type Document
} from '@/services/orders'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function safeDocumentFilename(doc: Document): string {
  const base = (doc.original_name || 'documento').trim() || 'documento'
  const ext = (doc.extension || 'pdf').toLowerCase().replace(/^\./, '')
  const lowerBase = base.toLowerCase()
  if (ext && (lowerBase.endsWith(`.${ext}`) || lowerBase.endsWith('.pdf'))) return base
  return ext ? `${base}.${ext}` : `${base}.pdf`
}

export default function OrderOptionsDocumentsPage() {
  const { id } = useParams()
  const orderId = id as string
  const [loadingReport, setLoadingReport] = useState(false)
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null)

  const { data: order } = useQuery({
    queryKey: orderQueryKey(orderId),
    queryFn: () => getOrder(orderId),
    enabled: !!orderId
  })

  const isFinished = order?.status?.value === 'FINISHED'
  const hasReport = Boolean(isFinished && orderId)

  const handleDownloadReport = async () => {
    if (!order?.code || !orderId) return
    setLoadingReport(true)
    try {
      const blob = await getAnalysisPdfBlob(orderId)
      downloadBlob(blob, `Consulta #${order.code}.pdf`)
    } finally {
      setLoadingReport(false)
    }
  }

  const handleDownloadDocument = async (doc: Document) => {
    const isSignedUrl = doc.file_path.startsWith('http://') || doc.file_path.startsWith('https://')
    if (isSignedUrl) {
      window.open(doc.file_path, '_blank', 'noopener,noreferrer')
      return
    }
    setLoadingDocId(doc.id)
    try {
      const blob = await getDocumentBlob(doc.file_path)
      downloadBlob(blob, safeDocumentFilename(doc))
    } finally {
      setLoadingDocId(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <OrderHeader />

      <div className="flex flex-col gap-2 px-3 lg:px-0 w-full mx-auto lg:max-w-lg">
        {order && (!order.documents || order.documents.length === 0) && !hasReport && (
          <div className="flex flex-col gap-2 px-3 lg:px-0 w-full mx-auto lg:max-w-lg">
            <div className="flex flex-col items-center justify-center p-6 border border-blue-100 rounded-2xl bg-blue-50/60 text-center gap-4 shadow-sm">
              <div className="bg-blue-100 p-3 rounded-full">
                <Info className="size-8 text-blue-600" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-blue-900">
                  Consulta em Análise
                </h3>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Esta consulta ainda está sendo processada pela nossa equipe.
                  <br />
                  As opções de visualização serão liberadas em breve.
                </p>
              </div>
            </div>
          </div>
        )}

        {hasReport && (
          <button
            type="button"
            onClick={handleDownloadReport}
            disabled={loadingReport}
            className="w-full cursor-pointer flex flex-col p-4 border border-box rounded-sm group hover:border-primary text-left disabled:opacity-70"
          >
            <div className="flex gap-4 items-center">
              {loadingReport ? (
                <span className="size-6 shrink-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              ) : (
                <FileText className="size-6 text-primary shrink-0" />
              )}
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <p className="text-sm font-semibold leading-[130%] group-hover:text-primary">
                  Relatório da consulta (PDF)
                </p>
                <p className="text-dark text-xs font-normal leading-4 group-hover:text-primary">
                  Consulta #{order?.code}.pdf
                </p>
              </div>
            </div>
          </button>
        )}

        {order?.documents?.map((document) => {
          const isLoading = loadingDocId === document.id
          return (
            <button
              key={document.id}
              type="button"
              onClick={() => handleDownloadDocument(document)}
              disabled={isLoading}
              className="w-full cursor-pointer flex flex-col p-4 border border-box rounded-sm group hover:border-primary text-left disabled:opacity-70"
            >
              <div className="flex gap-4 items-center">
                {isLoading ? (
                  <span className="size-6 shrink-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                ) : (
                  <Download className="size-6 text-primary shrink-0" />
                )}
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-[130%] group-hover:text-primary truncate">
                    Documento - {document.extension.toLocaleUpperCase()}
                  </p>
                  <p className="text-dark text-xs font-normal leading-4 group-hover:text-primary truncate">
                    {document.original_name || safeDocumentFilename(document)}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
