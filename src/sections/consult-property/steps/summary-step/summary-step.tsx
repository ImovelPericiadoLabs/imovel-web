'use client'

import { useMemo } from 'react'
import { MapPin, Building, ChevronRight, Hash, Box, Layout, Package } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'
import Button from '@/components/button'

export function SummaryStep({ onNext }: { onNext: () => void }) {
  const { watch } = useFormContext()
  const values = watch()

  const summary = useMemo(() => {
    const { address, registry, registrationNumber, allotment, block, lot } = values

    const items = []

    if (address) {
      items.push({
        key: 'address',
        icon: MapPin,
        title: 'Endereço selecionado',
        value: address,
      })
    }

    if (registry?.name) {
      items.push({
        key: 'registry',
        icon: Building,
        title: 'Cartório',
        value: registry.name,
        badge: 'Reconhecido automaticamente'
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
    <div className="flex flex-col gap-4 min-h-[calc(100vh-7.5rem)] relative pb-32">
      <div className="px-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2 mb-6">
          <TextTitle className="text-white">Resumo da Consulta do Imóvel</TextTitle>
          <TextSubtitle className="text-white/80">Verifique se os dados abaixo estão corretos</TextSubtitle>
        </div>

        {summary.length > 0 && (
          <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {summary.map((item) => {
              if (item.isGroup) {
                return (
                  <div key={item.key} className="w-full flex border-b border-gray-200 last:border-b-0">
                    {item.items.map((subItem, index) => (
                      <div
                        key={subItem.key}
                        className={`flex-1 p-5 flex items-start gap-4 ${index === 0 ? 'border-r border-gray-200' : ''}`}
                      >
                        <div className="shrink-0 my-auto p-2 bg-primary/5 rounded-xl text-primary">
                          <subItem.icon className="size-5" />
                        </div>

                        <div className="flex flex-col gap-0.5 text-start min-w-0">
                          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{subItem.title}</h3>
                          <p className="text-sm font-semibold text-dark leading-tight">
                            {subItem.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }

              return (
                <div
                  key={item.key}
                  className="w-full p-5 flex items-start gap-4 px-5 border-b border-gray-200 last:border-b-0"
                >
                  <div className="shrink-0 my-auto p-2 bg-primary/5 rounded-xl text-primary">
                    <item.icon className="size-5" />
                  </div>

                  <div className="flex flex-col gap-0.5 text-start min-w-0">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.title}</h3>

                    <p className="text-sm font-semibold text-dark leading-tight">
                      {item.value}
                    </p>

                    {item.badge && (
                      <span className="w-fit uppercase text-[9px] font-bold px-2 py-0.5 mt-1 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 bg-white border-b border-gray-200 flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <h2 className="font-bold text-base text-gray-900">Consulta Completa</h2>
                <p className="text-xs text-gray-500 font-medium">Consulte o histórico do imóvel</p>
              </div>
              <p className="text-lg font-bold text-primary">R$ 59,00</p>
            </div>

            <div className="p-6 bg-white">
              <p className="text-[13px] text-gray-600 leading-relaxed font-medium text-left">
                Nossa Inteligência Artificial realiza uma análise técnica e inteligente da matrícula do seu imóvel em segundos. Esqueça a burocracia e a insegurança: identificamos automaticamente pendências, riscos jurídicos e restrições ocultas que podem travar sua venda ou financiamento. Tenha em mãos um diagnóstico claro e comercial para garantir uma transação segura, protegendo seu patrimônio com a precisão tecnológica que você precisa para decidir com total confiança.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pt-5 pb-7 bg-white mt-auto border-t border-gray-200 z-10">
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
