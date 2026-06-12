'use client'

import { useEffect, useMemo } from 'react'
import { unlockPageScroll } from '@/utils/consult-flow-scroll'
import { MapPin, Building, ChevronRight, Hash, Box, Layout, Package, Check, FileText } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'
import {
  consultFlowHeroBlockClass,
  consultFlowHeroSubtitleClass,
  consultFlowHeroTitleClass,
  consultFlowHeroTitleSizeLargeClass,
} from '@/constants/consult-flow-hero-text'
import { cn } from '@/utils/tailwind'
import Button from '@/components/button'
import { Switch } from '@/components/switch/switch'
import { SummaryItemsList, type SummaryItems } from '@/components/summary-items-list'
import { trackGtmEvent, buildConsultItem, DEFAULT_CURRENCY, CERTIFICATES_UPSELL_PRICE } from '@/utils/analytics/gtm'
import { formatMoney } from '@/utils/text/text'
import { ANALYSIS_VALUE_BULLETS } from '@/constants/included-certificates'
import { IncludedCertificatesPanel } from '@/components/included-certificates/included-certificates-panel'
import { resolveConsultPrice, type EntryPath } from '@/hooks/use-consult-price'
import type { FormTypes } from '@/sections/consult-property/validations'

const VALUE_BULLETS = ANALYSIS_VALUE_BULLETS

const DOCUMENT_TYPE_LABELS = {
  agreement: 'Contrato de compra e venda',
  registration: 'Matrícula',
  deed: 'Escritura',
} as const

export function SummaryStep({ onNext }: { onNext: () => void }) {
  const { watch, setValue } = useFormContext<FormTypes>()
  const values = watch()

  const entryPath = values.entryPath as EntryPath | undefined
  const includeCertificates = Boolean(values.includeCertificates)
  const { price: consultPrice } = resolveConsultPrice(entryPath, includeCertificates)
  const showCertificatesToggle = entryPath === 'address'

  useEffect(() => {
    unlockPageScroll()
  }, [])

  const summary = useMemo(() => {
    const {
      address,
      addressHint,
      registry,
      registrationNumber,
      notaryName,
      allotment,
      block,
      lot,
      documentType,
      document,
      documentPreview,
    } = values

    const items: SummaryItems = []

    const docTypeKey = documentType as keyof typeof DOCUMENT_TYPE_LABELS | undefined
    const docTypeLabel = docTypeKey ? DOCUMENT_TYPE_LABELS[docTypeKey] : ''
    const docFileName =
      (documentPreview as { name?: string } | undefined)?.name?.trim() ||
      document?.original_name?.trim() ||
      ''

    if (docTypeLabel) {
      items.push({
        key: 'documentType',
        icon: FileText,
        title: 'Tipo de documento',
        value: docTypeLabel,
      })
    }

    if (docFileName) {
      items.push({
        key: 'documentFile',
        icon: FileText,
        title: 'Arquivo enviado',
        value: docFileName,
      })
    }

    const loc = String(address || '').trim() || String(addressHint || '').trim()
    if (loc) {
      items.push({
        key: 'address',
        icon: MapPin,
        title: String(address || '').trim() ? 'Endereço selecionado' : 'Local informado',
        value: loc,
      })
    }

    const cartorio = registry?.name || String(notaryName || '').trim()
    if (cartorio) {
      items.push({
        key: 'registry',
        icon: Building,
        title: 'Cartório',
        value: cartorio,
        badge: registry?.name ? 'Reconhecido automaticamente' : 'Informado por você',
      })
    }

    if (registrationNumber) {
      items.push({
        key: 'registrationNumber',
        icon: Hash,
        title: 'Matrícula',
        value: registrationNumber
      })
    }

    if (allotment) {
      items.push({
        key: 'allotment',
        icon: Box,
        title: 'Loteamento',
        value: allotment
      })
    }

    if (block && lot) {
      items.push({
        key: 'block-lot',
        isGroup: true,
        items: [
          {
            key: 'block',
            icon: Layout,
            title: 'Quadra',
            value: block
          },
          {
            key: 'lot',
            icon: Package,
            title: 'Lote',
            value: lot
          }
        ]
      })
    } else {
      if (block) {
        items.push({
          key: 'block',
          icon: Layout,
          title: 'Quadra',
          value: block
        })
      }

      if (lot) {
        items.push({
          key: 'lot',
          icon: Package,
          title: 'Lote',
          value: lot
        })
      }
    }

    return items
  }, [values])

  return (
    <div className="relative">
      <div
        className="flex flex-col gap-4 px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:px-6 xl:px-8"
        aria-label="Resumo da consulta"
      >
        <div className={cn(consultFlowHeroBlockClass, 'mb-6 max-w-3xl')}>
          <TextTitle className={cn(consultFlowHeroTitleClass, consultFlowHeroTitleSizeLargeClass)}>
            Resumo da Consulta do Imóvel
          </TextTitle>
          <TextSubtitle className={consultFlowHeroSubtitleClass}>
            Verifique se os dados abaixo estão corretos
          </TextSubtitle>
        </div>

        {summary.length > 0 && (
          <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <SummaryItemsList items={summary} />
          </div>
        )}

        <div className="flex flex-col gap-3 lg:mx-auto lg:max-w-3xl">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:shadow-md">
            <div className="flex flex-col gap-3 border-b border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:p-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-bold text-gray-900 lg:text-lg">Consulta Completa</h2>
                <p className="text-xs font-medium text-gray-500 lg:text-sm">Consulte o histórico do imóvel</p>
              </div>
              <p className="text-lg font-bold text-primary tabular-nums sm:shrink-0 lg:text-xl">
                {formatMoney(consultPrice)}
              </p>
            </div>

            <div className="flex flex-col gap-4 bg-white p-6 lg:p-8">
              <p className="text-[13px] text-gray-600 leading-relaxed font-medium text-left">
                Você recebe uma análise objetiva do imóvel com base nos dados que informou — ideal antes de comprar, vender ou financiar.
              </p>
              <ul className="flex flex-col gap-2.5">
                {VALUE_BULLETS.map((line) => (
                  <li key={line} className="flex gap-2.5 items-start text-[13px] text-gray-700 leading-snug">
                    <span className="mt-0.5 shrink-0 rounded-full bg-primary/10 p-0.5 text-primary">
                      <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              {showCertificatesToggle && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <p className="text-[13px] font-semibold text-gray-900">
                      Incluir certidões oficiais
                    </p>
                    <p className="text-[12px] text-gray-600">
                      +{formatMoney(CERTIFICATES_UPSELL_PRICE)} — emitidas após a análise
                    </p>
                  </div>
                  <Switch
                    checked={includeCertificates}
                    onCheckedChange={(checked) => {
                      setValue('includeCertificates', checked, { shouldValidate: false })
                    }}
                    aria-label="Incluir certidões oficiais"
                  />
                </div>
              )}

              <div className="border-t border-gray-100 pt-4">
                <IncludedCertificatesPanel embedded included={includeCertificates} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white px-4 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-5 shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.12)] md:px-6">
        <div className="mx-auto w-full max-w-lg md:max-w-2xl xl:max-w-3xl">
        <Button
          className="h-12 w-full rounded-xl text-base lg:mx-auto lg:h-11 lg:max-w-md"
          onClick={() => {
            trackGtmEvent('begin_checkout', {
              event_category: 'checkout',
              event_label: 'summary_continue',
              event_description: 'Usuário avançou do resumo para o pagamento.',
              currency: DEFAULT_CURRENCY,
              value: consultPrice,
              items: [buildConsultItem(consultPrice)],
              checkout_step: 'summary',
              include_certificates: includeCertificates,
              entry_path: entryPath,
            })
            trackGtmEvent('summary_continue', {
              event_category: 'summary',
              event_label: 'continue',
              event_description: 'Usuário confirmou o resumo da consulta.',
              address_present: Boolean(values.address),
              registry_present: Boolean(values.registry?.name),
              has_registration_number: Boolean(values.registrationNumber),
              has_allotment: Boolean(values.allotment),
              has_block: Boolean(values.block),
              has_lot: Boolean(values.lot),
              has_document: Boolean(values.document?.id),
              document_type: values.documentType,
              include_certificates: includeCertificates,
              entry_path: entryPath,
            })
            onNext()
          }}
          icon={<ChevronRight className="size-5" />}
        >
          Continuar
        </Button>
        </div>
      </div>
    </div>
  )
}
