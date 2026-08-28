'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, FileDown, Loader2, RefreshCw, X } from 'lucide-react'

import Button from '@/components/button'
import AdminSegmentedControl from '@/components/admin/admin-segmented-control'
import { ADMIN_LABEL } from '@/components/admin/admin-styles'
import { cn } from '@/utils/tailwind'
import {
  DEFAULT_PRINT_CONFIG,
  type BatchPdfPrintConfig,
  type BatchPdfStatus,
} from '@/services/staff/voucher-print'
import PrintLayoutPreview from './print-layout-preview'

const PREFS_KEY = 'imovel.voucherPrintPrefs'

function loadPrefs(): BatchPdfPrintConfig {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return DEFAULT_PRINT_CONFIG
    const parsed = JSON.parse(raw) as Partial<BatchPdfPrintConfig>
    return {
      layout: parsed.layout === 'stacked' ? 'stacked' : 'duplex',
      duplex: parsed.duplex === 'short-edge' ? 'short-edge' : 'long-edge',
      verso: parsed.verso === 'cut' || parsed.verso === 'join' ? parsed.verso : 'fold',
    }
  } catch {
    return DEFAULT_PRINT_CONFIG
  }
}

function savePrefs(config: BatchPdfPrintConfig) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(config))
  } catch {
    /* ignore quota / private mode */
  }
}

type Props = {
  open: boolean
  forceDefault?: boolean
  loading?: boolean
  lastPdf?: BatchPdfStatus | null
  onClose: () => void
  onConfirm: (config: BatchPdfPrintConfig, force: boolean) => void
  onConfigChange?: (config: BatchPdfPrintConfig) => void
}

export default function PrintPdfDialog({
  open, forceDefault = false, loading = false, lastPdf = null, onClose, onConfirm, onConfigChange,
}: Props) {
  const [config, setConfig] = useState<BatchPdfPrintConfig>(DEFAULT_PRINT_CONFIG)
  const [force, setForce] = useState(forceDefault)

  useEffect(() => {
    if (!open) return
    const next = loadPrefs()
    setConfig(next)
    setForce(forceDefault)
    onConfigChange?.(next)
  }, [open, forceDefault, onConfigChange])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, loading, onClose])

  if (!open) return null

  const changeConfig = (next: BatchPdfPrintConfig) => {
    setConfig(next)
    onConfigChange?.(next)
  }

  const lastUrl = lastPdf?.pdf_url || lastPdf?.last_pdf_url

  const confirm = () => {
    savePrefs(config)
    onConfirm(config, force)
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-pdf-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#101114]/45"
        aria-label="Fechar"
        disabled={loading}
        onClick={onClose}
      />

      <div
        className={cn(
          'relative grid w-full max-w-3xl gap-0 overflow-hidden rounded-2xl border border-[#dedee5] bg-white',
          'shadow-[rgba(0,0,0,0.12)_0px_16px_48px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]',
          'max-h-[90dvh] overflow-y-auto',
        )}
      >
        <div className="flex flex-col border-b border-[#dedee5] lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between gap-3 px-5 py-4">
            <div>
              <h2 id="print-pdf-title" className="text-base font-semibold text-[#101114]">
                Como a gráfica vai imprimir?
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[#686b82]">
                Escolha o formato da máquina. A prévia ao lado mostra o que sai em cada página do PDF.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg p-1 text-[#9497a9] hover:bg-[rgba(148,151,169,0.08)] disabled:opacity-50"
              aria-label="Fechar modal"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-5 px-5 pb-5">
            <div>
              <p className={ADMIN_LABEL}>Layout</p>
              <AdminSegmentedControl
                className="mt-2 w-full [&>button]:flex-1 [&>button]:justify-center"
                aria-label="Layout de impressão"
                value={config.layout}
                onChange={(id) => changeConfig({ ...config, layout: id as BatchPdfPrintConfig['layout'] })}
                segments={[
                  { id: 'duplex', label: 'Duplex' },
                  { id: 'stacked', label: 'Empilhado' },
                ]}
              />
              <p className="mt-2 text-[11px] leading-relaxed text-[#9497a9]">
                {config.layout === 'duplex'
                  ? '4 cartões por folha. Frente e verso em páginas intercaladas — a impressora vira o papel.'
                  : '2 cartões por folha. Frente e verso na mesma página — dobra, corte, ou panfleto junto.'}
              </p>
            </div>

            {config.layout === 'duplex' ? (
              <div>
                <p className={ADMIN_LABEL}>Virada da folha</p>
                <AdminSegmentedControl
                  className="mt-2 w-full [&>button]:flex-1 [&>button]:justify-center"
                  aria-label="Borda da virada duplex"
                  value={config.duplex}
                  onChange={(id) => changeConfig({ ...config, duplex: id as BatchPdfPrintConfig['duplex'] })}
                  segments={[
                    { id: 'long-edge', label: 'Borda longa' },
                    { id: 'short-edge', label: 'Borda curta' },
                  ]}
                />
              </div>
            ) : (
              <div>
                <p className={ADMIN_LABEL}>Verso</p>
                <AdminSegmentedControl
                  className="mt-2 w-full [&>button]:flex-1 [&>button]:justify-center"
                  aria-label="Orientação do verso"
                  value={config.verso}
                  onChange={(id) => changeConfig({ ...config, verso: id as BatchPdfPrintConfig['verso'] })}
                  segments={[
                    { id: 'fold', label: 'Dobra 180°' },
                    { id: 'cut', label: 'Corte' },
                    { id: 'join', label: 'Junto' },
                  ]}
                />
              </div>
            )}

            {lastUrl && (
              <a
                href={lastUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7132f5] hover:underline"
              >
                <ExternalLink className="size-3.5" />
                Abrir último PDF gerado
              </a>
            )}

            <label className="flex items-start gap-2 text-xs text-[#686b82]">
              <input
                type="checkbox"
                className="mt-0.5 size-3.5 accent-[#7132f5]"
                checked={force}
                onChange={(e) => setForce(e.target.checked)}
              />
              <span>
                Descartar PDF já gerado e renderizar de novo com os dados atuais da campanha.
                Sem isto, o último arquivo do GCS é reaproveitado.
              </span>
            </label>
          </div>

          <div className="mt-auto flex flex-col-reverse gap-2 border-t border-[#dedee5] px-5 py-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="!w-auto min-w-[7rem] px-5"
              disabled={loading}
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="!w-auto min-w-[9rem] px-5"
              disabled={loading}
              onClick={confirm}
            >
              {loading
                ? <Loader2 className="mr-2 size-4 animate-spin" />
                : force
                  ? <RefreshCw className="mr-2 size-4" />
                  : <FileDown className="mr-2 size-4" />}
              {loading ? 'Gerando…' : force ? 'Regerar PDF' : 'Gerar PDF'}
            </Button>
          </div>
        </div>

        <div className="bg-[#F4F5FA] p-4">
          <PrintLayoutPreview config={config} />
        </div>
      </div>
    </div>
  )
}
