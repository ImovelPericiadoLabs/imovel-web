'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AlertTriangle, ArrowUpRight, CheckCircle2, FileText, MapPin, ScrollText, X } from 'lucide-react'

import type {
  JetimobConsultDraftResponse,
  JetimobConsultEntryPath,
  JetimobConsultModeDraft,
} from '@/lib/jetimob-consult-prefill'
import type { JetimobPropertyRow } from '@/services/jetimob'
import { cn } from '@/utils/tailwind'

import { PropertyPhoto } from './property-photo'

const MISSING_FIELD_LABELS: Record<string, string> = {
  address_hint: 'endereço incompleto na Jetimob',
  registration_number: 'matrícula não cadastrada na Jetimob',
  notary_name: 'cartório — você informa no fluxo',
}

const MODE_META: Record<
  JetimobConsultEntryPath,
  { title: string; description: string; Icon: typeof MapPin }
> = {
  address: {
    title: 'Por endereço',
    description: 'Você confirma o endereço no mapa e recebe a análise completa.',
    Icon: MapPin,
  },
  registry: {
    title: 'Por matrícula',
    description: 'Matrícula + cartório. Vai direto ao registro do imóvel.',
    Icon: ScrollText,
  },
  document: {
    title: 'Por documento',
    description: 'Envie matrícula, escritura ou contrato do imóvel.',
    Icon: FileText,
  },
}

function ModeButton({
  entryPath,
  mode,
  onStart,
}: {
  entryPath: JetimobConsultEntryPath
  mode?: JetimobConsultModeDraft
  onStart: (entryPath: JetimobConsultEntryPath, mode: JetimobConsultModeDraft) => void
}) {
  const { title, description, Icon } = MODE_META[entryPath]
  const available = Boolean(mode?.available)
  const pending = (mode?.missing_fields || []).map((f) => MISSING_FIELD_LABELS[f] || f)

  return (
    <button
      type="button"
      disabled={!available}
      onClick={() => mode && onStart(entryPath, mode)}
      className={cn(
        'group flex w-full items-start gap-3 rounded-[var(--radius-jetimob-field)] border p-4 text-left transition',
        available
          ? 'border-[var(--color-jetimob-border-field)] bg-white hover:border-[var(--color-jetimob-accent)] hover:shadow-[var(--shadow-jetimob-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2'
          : 'cursor-not-allowed border-dashed border-[var(--color-jetimob-border-strong)] bg-[var(--color-jetimob-surface-muted)]',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[10px]',
          available
            ? 'bg-[var(--color-jetimob-accent)]/8 text-[var(--color-jetimob-accent)]'
            : 'bg-[var(--color-jetimob-border)] text-[var(--color-jetimob-text-subtle)]',
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              'text-[14px] font-semibold',
              available ? 'text-[var(--color-jetimob-text-title)]' : 'text-[var(--color-jetimob-text-subtle)]',
            )}
          >
            {title}
          </span>
          {available ? (
            <CheckCircle2 className="size-4 text-emerald-500" aria-hidden />
          ) : (
            <AlertTriangle className="size-4 text-amber-500" aria-hidden />
          )}
        </span>
        <span
          className={cn(
            'mt-0.5 block text-[12px] leading-snug',
            available ? 'text-[var(--color-jetimob-text-muted)]' : 'text-[var(--color-jetimob-text-subtle)]',
          )}
        >
          {description}
        </span>
        {pending.length > 0 && (
          <span className="mt-1.5 block text-[11px] leading-snug text-amber-700">{pending.join(' · ')}</span>
        )}
      </span>

      {available && (
        <ArrowUpRight
          className="mt-1 size-4 shrink-0 text-[var(--color-jetimob-text-subtle)] transition group-hover:text-[var(--color-jetimob-accent)]"
          aria-hidden
        />
      )}
    </button>
  )
}

type ConsultPropertyDialogProps = {
  property: JetimobPropertyRow | null
  draft: JetimobConsultDraftResponse | null
  loading: boolean
  error: string | null
  onOpenChange: (open: boolean) => void
  onStart: (entryPath: JetimobConsultEntryPath, mode: JetimobConsultModeDraft) => void
}

/**
 * Modal "Como você quer consultar?" — no design de referência o catálogo ocupa a
 * largura toda, então o painel de consulta deixa de disputar espaço na grade e passa a
 * abrir sob demanda, depois de escolher um imóvel.
 */
export function ConsultPropertyDialog({
  property,
  draft,
  loading,
  error,
  onOpenChange,
  onStart,
}: ConsultPropertyDialogProps) {
  const title = property?.title || (property?.code ? `Imóvel ${property.code}` : 'Imóvel')

  return (
    <DialogPrimitive.Root open={Boolean(property)} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="jetimob-drawer-backdrop-in fixed inset-0 z-50 bg-black/45 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className={cn(
            'fixed z-50 flex flex-col bg-[var(--color-jetimob-surface)] focus:outline-none',
            // Mobile: bottom sheet. Desktop (sm+): diálogo centralizado.
            'jetimob-drawer-panel-in inset-x-0 bottom-0 max-h-[88dvh] rounded-t-3xl',
            'sm:jetimob-card-in sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[85dvh] sm:w-[calc(100%-2rem)] sm:max-w-md',
            'sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[var(--radius-jetimob-panel)]',
            'shadow-[0_24px_48px_-12px_rgb(16_24_40_/_0.25)]',
          )}
        >
          <header className="flex shrink-0 items-start gap-3 border-b border-[var(--color-jetimob-border)] p-5">
            <span className="size-12 shrink-0 overflow-hidden rounded-[10px] bg-[var(--color-jetimob-surface-muted)]">
              <PropertyPhoto photo={property?.photo} title={title} />
            </span>
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="truncate text-[15px] font-bold text-[var(--color-jetimob-text-title)]">
                {title}
              </DialogPrimitive.Title>
              {property?.address && (
                <DialogPrimitive.Description className="mt-0.5 truncate text-[12px] text-[var(--color-jetimob-text-muted)]">
                  {property.address}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--color-jetimob-text-subtle)] transition hover:bg-[var(--color-jetimob-surface-muted)] hover:text-[var(--color-jetimob-text-body)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]">
              <X className="size-4" aria-hidden />
              <span className="sr-only">Fechar</span>
            </DialogPrimitive.Close>
          </header>

          <div className="overflow-y-auto p-5">
            <h3 className="text-[14px] font-semibold text-[var(--color-jetimob-text-title)]">
              Como você quer consultar?
            </h3>

            {loading && (
              <div className="mt-3 flex flex-col gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-[86px] animate-pulse rounded-[var(--radius-jetimob-field)] bg-[var(--color-jetimob-surface-muted)]"
                  />
                ))}
              </div>
            )}

            {error && (
              <p className="mt-3 rounded-[var(--radius-jetimob-field)] border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                {error}
              </p>
            )}

            {draft?.modes && !loading && (
              <div className="mt-3 flex flex-col gap-2">
                {(['address', 'registry', 'document'] as JetimobConsultEntryPath[]).map((entryPath) => (
                  <ModeButton
                    key={entryPath}
                    entryPath={entryPath}
                    mode={draft.modes?.[entryPath]}
                    onStart={onStart}
                  />
                ))}
              </div>
            )}

            <p className="mt-4 text-[11px] leading-relaxed text-[var(--color-jetimob-text-subtle)]">
              Os dados do imóvel entram já preenchidos na consulta. Você revisa tudo antes de pagar.
            </p>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
