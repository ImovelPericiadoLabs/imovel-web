'use client'
import type { FormContextWithSteps } from '@/sections/consult-property/types'
import { MapPin, Building, Users, Check } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import TextTitle from '@/components/text-title'
import Button from '@/components/button'
import Modal from '@/components/modal'

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
  'Relatório visual simplificado para o comprado',
  'Avaliação do impacto ambiental',
]

export function SummaryStep() {
  const { getValues, handleNextStep } = useFormContext() as FormContextWithSteps

  const mapDocumentType: Record<string, string> = {
    contract: 'Contrato de compra e venda',
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
  }

  return (
    <div className="flex flex-col gap-5 min-h-[calc(100vh-7.5rem)] relative -mt-4">
      <div className="px-4">
        <TextTitle>Resumo do imóvel </TextTitle>

        <div className="w-full mt-3.5 bg-white rounded-sm border-[0.5px] border-box">
          {Object.entries(summary)
            .filter(([_, value]) => !!value?.value?.length)
            .map(([key, value]) => (
              <div
                key={key}
                className="w-full p-4 flex items-start gap-4 px-4 border-b border-hr last:border-b-0"
              >
                <div className="shrink-0 my-auto">
                  <value.icon className="size-6" />
                </div>
                <div className="flex flex-col gap-2 text-start min-w-0">
                  <h3 className="text-sm font-semibold leading-[130%]">{value.title}</h3>

                  <p className="text-xs font-normal leading-[130%] text-gray-2">{value.value}</p>

                  {key === 'document' && (
                    <span className="w-fit uppercase text-xs font-medium leading-[130%] px-2 py-0.5 text-primary border border-primary rounded-full">
                      Reconhecido automaticamente
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <TextTitle className="text-dark">Consulta Selecionada</TextTitle>

          <div className="p-4 bg-white border border-box rounded-sm">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between">
                <h2 className="font-medium text-sm leading-[130%]">Consulta completa</h2>
                <Modal
                  title="Dados oficiais da matrícula"
                  content={
                    <div className="flex flex-col px-4 pb-0">
                      {registretionData.map((data) => (
                        <div key={data} className="flex gap-1 py-6 border-b border-box">
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
              <p className="text-xs font-normal leading-[150%]">
                Verifique se o imóvel é seguro para comprar. Detecte ônus, ações e pendências
                ocultas e receba um relatório claro com o status legal completo. Não compre sem
                consultar.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 px-4 pt-5 pb-7 bg-white mt-auto border-t border-box">
        <div className="flex w-full justify-between">
          <div className="flex flex-col pl-4">
            <p className="text-sm font-medium leading-[130%]">Total</p>
            <p className="text-sm font-medium leading-[130%]">R$ 67,56</p>
          </div>

          <Button className="w-fit" onClick={handleNextStep}>
            Continuar
          </Button>
        </div>
      </div>
    </div>
  )
}
