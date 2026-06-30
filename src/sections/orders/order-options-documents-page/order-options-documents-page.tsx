'use client'

import { useState } from 'react'
import { Download, Info, FileText } from 'lucide-react'
import { useParams } from 'next/navigation'
import OrderHeader from '@/sections/orders/order-header'
import {
  getAnalysisPdfBlob,
  getDocumentBlob,
  type OrderRelatedDocument,
} from '@/services/orders'
import { useOrderDetailQuery } from '@/hooks/use-order-detail-query'
import { useOrderDocumentsQuery } from '@/hooks/use-order-documents-query'
import { useOrderRealtime } from '@/hooks/use-order-realtime'

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

function safeDocumentFilename(doc: OrderRelatedDocument): string {
  const base = (doc.original_name || 'documento').trim() || 'documento'
  const ext = (doc.extension || 'pdf').toLowerCase().replace(/^\./, '')
  const lowerBase = base.toLowerCase()
  if (ext && (lowerBase.endsWith(`.${ext}`) || lowerBase.endsWith('.pdf'))) return base
  return ext ? `${base}.${ext}` : `${base}.pdf`
}

export default function OrderOptionsDocumentsPage() {
  const { id } = useParams()
  const orderId = id as string
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null)

  const { connected: realtimeConnected } = useOrderRealtime(orderId)
  const { data: order } = useOrderDetailQuery(orderId, realtimeConnected)
  const { data: documents } = useOrderDocumentsQuery(
    orderId,
    order?.status?.value,
    realtimeConnected,
  )

  const hasDocuments = Boolean(documents && documents.length > 0)

  const handleDownload = async (doc: OrderRelatedDocument) => {
    setLoadingDocId(doc.id)
    try {
      // The laudo (REPORT) is rendered on demand: stream it through the report endpoint.
      if (doc.kind === 'REPORT') {
        const blob = await getAnalysisPdfBlob(orderId)
        downloadBlob(blob, safeDocumentFilename(doc))
        return
      }
      // Matrícula and certidões carry an absolute (GCS) URL: open it directly when present.
      if (doc.download_url) {
        window.open(doc.download_url, '_blank', 'noopener,noreferrer')
        return
      }
      // Otherwise stream the attached file by its path (getBlob handles absolute/relative).
      const blob = await getDocumentBlob(doc.file_path ?? doc.id)
      downloadBlob(blob, safeDocumentFilename(doc))
    } finally {
      setLoadingDocId(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <OrderHeader />

      <div className="flex flex-col gap-2 px-3 lg:px-0 w-full mx-auto lg:max-w-lg">
        {!hasDocuments && (
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
        )}

        {documents?.map((document) => {
          const isLoading = loadingDocId === document.id
          const Icon = document.kind === 'REPORT' ? FileText : Download
          return (
            <button
              key={document.id}
              type="button"
              onClick={() => handleDownload(document)}
              disabled={isLoading}
              className="w-full cursor-pointer flex flex-col p-4 border border-box rounded-sm group hover:border-primary text-left disabled:opacity-70"
            >
              <div className="flex gap-4 items-center">
                {isLoading ? (
                  <span className="size-6 shrink-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                ) : (
                  <Icon className="size-6 text-primary shrink-0" />
                )}
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-[130%] group-hover:text-primary truncate">
                    {document.label}
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
