'use client'

import { useMemo } from 'react'
import { MapPin, Building, Users, ChevronRight } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'
import Button from '@/components/button'
import SelectedAddressCard from '@/components/selected-address-card'

export function SummaryStep({ onNext }: { onNext: () => void }) {
  const { getValues } = useFormContext()

  const mapDocumentType: Record<string, string> = useMemo(() => ({
    agreement: 'Contrato de compra e venda',
    registration: 'Matrícula',
    deed: 'Escritura',
  }), [])

  const summary = useMemo(() => ({
    address: {
      icon: MapPin,
      title: 'Endereço',
      value: getValues('address'),
    },
    document: {
      icon: Building,
      title: 'Cartório',
      value: getValues('registry')?.name,
    },
    documentType: {
      icon: Users,
      title: 'Tipo de documento',
      value: mapDocumentType[getValues('documentType')],
    },
    registrationNumber: {
      icon: Building,
      title: 'Matrícula',
      value: getValues('registrationNumber'),
    },
    allotment: {
      icon: Building,
      title: 'Loteamento',
      value: getValues('allotment'),
    },
    block: {
      icon: Building,
      title: 'Quadra',
      value: getValues('block'),
    },
    lot: {
      icon: Building,
      title: 'Lote',
      value: getValues('lot'),
    },
  }), [getValues, mapDocumentType])

  return (
    <div className="flex flex-col gap-5 min-h-[calc(100vh-7.5rem)] relative">
      <div className="px-4 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <TextTitle className="text-white">Resumo da Consulta do Imóvel</TextTitle>
          <TextSubtitle className="text-white/80">Verifique se os dados abaixo estão corretos</TextSubtitle>
        </div>

        <div className="w-full mt-3.5 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {Object.entries(summary)
            .filter(([_, value]) => !!value?.value)
            .map(([key, value]) => (
              <div
                key={key}
                className="w-full p-4 flex items-start gap-4 px-4 border-b border-gray-50 last:border-b-0"
              >
                <div className="shrink-0 my-auto text-primary">
                  <value.icon className="size-5" />
                </div>

                <div className="flex flex-col gap-0.5 text-start min-w-0">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{value.title}</h3>

                  <p className="text-sm font-semibold text-dark leading-tight">
                    {value.value}
                  </p>

                  {key === 'document' && (
                    <span className="w-fit uppercase text-[9px] font-bold px-2 py-0.5 mt-1 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl">
                      Reconhecido automaticamente
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 bg-white border-b border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-1">
                  <h2 className="font-bold text-base text-gray-900">Consulta Completa</h2>
                  <p className="text-xs text-gray-500 font-medium">Consulte o histórico do imóvel</p>
                </div>
                <p className="text-lg font-bold text-primary">R$ 59,00</p>
              </div>
            </div>

            <div className="p-6 bg-white">
              <p className="text-[13px] text-gray-700 leading-relaxed font-medium text-left">
                Nossa Inteligência Artificial realiza uma análise técnica e inteligente da matrícula do seu imóvel em segundos. Esqueça a burocracia e a insegurança: identificamos automaticamente pendências, riscos jurídicos e restrições ocultas que podem travar sua venda ou financiamento. Tenha em mãos um diagnóstico claro e comercial para garantir uma transação segura, protegendo seu patrimônio com a precisão tecnológica que você precisa para decidir com total confiança.
              </p>
            </div>

          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pt-5 pb-7 bg-white mt-auto border-t border-gray-100 z-10">
        <Button 
          className="w-full h-12 text-base rounded-xl" 
          onClick={onNext}
          icon={<ChevronRight className="size-5" />}
        >
          Continuar
        </Button>
      </div>
    </div>
  )
}
