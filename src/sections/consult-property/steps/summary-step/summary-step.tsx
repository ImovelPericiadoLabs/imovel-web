'use client'

import { MapPin, Building, Users, Check } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import TextTitle from '@/components/text-title'
import Button from '@/components/button'
import Modal from '@/components/modal'
import SelectedAddressCard from '@/components/selected-address-card'

const registretionData = [
  'Histórico de proprietários e transmissões',
  'Ações judiciais (usucapião, execução, inventário)',
  'Regularidade do imóvel (averbações e registros)',
  'Risco de impedimento de compra e venda (%)',
  'Score de regularidade da matrícula',
  'Probabilidade de regularização (%)',
  'Situação fiscal e ambiental',
  'Conformidade com regras estaduais',
  'Relatório de impedimentos por cores',
  'Gráficos de risco jurídico',
  'Sugestões de regularização',
  'Compatibilidade entre matrícula e imóvel',
  'Servidões e restrições urbanísticas',
  'Histórico de averbações (construção, demolição, desmembramento)',
  'Divergências cadastrais (cartório x prefeitura)',
  'Status de registro do loteamento/condomínio',
  'Relatório visual simplificado para o comprador',
  'Avaliação do impacto ambiental',
]

export function SummaryStep({ onNext }: { onNext: () => void }) {
  const { getValues } = useFormContext()

  const mapDocumentType: Record<string, string> = {
    agreement: 'Contrato de compra e venda',
    registration: 'Matrícula',
    deed: 'Escritura',
  }

  const summary = {
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
  }

  return (
    <div className="flex flex-col gap-5 min-h-[calc(100vh-7.5rem)] relative">
      <div className="px-4 flex flex-col gap-5">
        <SelectedAddressCard address={getValues('address')} />
        <TextTitle className="text-dark">Resumo do imóvel</TextTitle>

        <div className="w-full mt-3.5 bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          {Object.entries(summary)
            .filter(([_, value]) => !!value?.value)
            .map(([key, value]) => (
              <div
                key={key}
                className="w-full p-4 flex items-start gap-4 px-4 border-b border-gray-50 last:border-b-0"
              >
                <div className="shrink-0 my-auto text-primary">
                  <value.icon className="size-6" />
                </div>

                <div className="flex flex-col gap-1 text-start min-w-0">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{value.title}</h3>

                  <p className="text-sm font-medium text-dark leading-tight">
                    {value.value}
                  </p>

                  {key === 'document' && (
                    <span className="w-fit uppercase text-[10px] font-bold px-2 py-0.5 mt-1 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full">
                      Reconhecido automaticamente
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <TextTitle className="text-dark">Consulta Selecionada</TextTitle>

          <div className="p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-base text-dark">Consulta completa</h2>

                <Modal
                  title="Dados oficiais da matrícula"
                  content={
                    <div className="flex flex-col px-4 pb-0">
                      {registretionData.map((data) => (
                        <div
                          key={data}
                          className="flex gap-1 py-6 border-b border-box"
                        >
                          <Check className="size-4 text-primary" />
                          <p className="text-xs font-normal leading-[130%]">{data}</p>
                        </div>
                      ))}
                    </div>
                  }
                >
                  <button className="cursor-pointer uppercase font-normal leading-[130%] text-xs text-primary">
                    Ver detalhes
                  </button>
                </Modal>
              </div>

              <hr className="border border-box" />

              <p className="text-xs text-gray-500 leading-relaxed">
                Verifique se o imóvel é seguro para comprar. Detecte ônus, ações e pendências
                ocultas e receba um relatório claro com o status legal completo. Não compre
                sem consultar.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pt-5 pb-7 bg-white mt-auto border-t border-gray-100 z-10">
        <div className="flex w-full justify-between items-center">
          <div className="flex flex-col">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</p>
            <p className="text-xl font-bold text-primary leading-tight">R$ 59,00</p>
          </div>

          <Button className="px-10 h-12 text-base rounded-xl" onClick={onNext}>
            Continuar
          </Button>
        </div>
      </div>
    </div>
  )
}
