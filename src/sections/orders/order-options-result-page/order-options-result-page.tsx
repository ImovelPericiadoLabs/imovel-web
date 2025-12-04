import { useCallback } from 'react'
import {
  Building,
  Grid2X2,
  RulerDimensionLineIcon,
  User,
  MapPin,
  FileQuestionMark,
  House,
  FileXCorner,
  IdCard,
  FileCheckCorner,
} from 'lucide-react'
import { cn } from '@/utils/tailwind'
import Badge from '@/components/badge'
import { mapCircleStatus, mapBadgeStatus } from '@/sections/orders/constants'

type SectionStatus = 'ALL_GOOD' | 'IRREGULARITIES_FOUND' | 'PURCHASE_AND_SALE_BLOCKED'
type Item = {
  icon: React.ComponentType<{ className?: string }>
  message: string
}

type ResultSection = {
  status?: SectionStatus
  badge?: string
  number?: string
  office?: string
  propertyType?: string
  totalArea?: string
  builtArea?: string
  items?: Item[]
  message?: string
}

type ResultSections = {
  Matrícula: ResultSection
  'Ônus e Restrições': ResultSection
  'Pendências Financeiras': ResultSection
  Documentos: ResultSection
  Conclusão: ResultSection
}

export default function OrderOptionsResultPage() {
  const mapBadgeText: Record<string, string> = {
    ALL_GOOD: 'Sinal Verde',
    IRREGULARITIES_FOUND: 'Sinal Amarelo',
    PURCHASE_AND_SALE_BLOCKED: 'Sinal Vermelho',
  }

  const result: ResultSections = {
    ['Matrícula']: {
      number: '35529',
      status: 'PURCHASE_AND_SALE_BLOCKED',
      badge: 'Sinal vermelho',
      office: '6º Ofício De Registro De Imóveis - Vila Mariana - SP',
      propertyType: 'Terreno Urbano com Edificação',
      totalArea: '308.8 m²',
      builtArea: '0.48 m²',
    },

    ['Ônus e Restrições']: {
      status: 'PURCHASE_AND_SALE_BLOCKED',
      items: [
        { icon: User, message: 'Proprietário divergente do informado' },
        { icon: MapPin, message: 'Endereço não coincide com dados da prefeitura' },
        { icon: FileQuestionMark, message: 'Averbação registrada com restrição ativa' },
      ],
    },

    ['Pendências Financeiras']: {
      status: 'PURCHASE_AND_SALE_BLOCKED',
      items: [
        { icon: User, message: 'IPTU em atraso' },
        { icon: FileQuestionMark, message: 'Multas municipais em aberto' },
        { icon: House, message: 'Débitos vinculados ao imóvel e ao proprietário' },
      ],
    },

    ['Documentos']: {
      status: 'PURCHASE_AND_SALE_BLOCKED',
      items: [
        { icon: FileXCorner, message: 'Certidão negativa não disponíve' },
        { icon: IdCard, message: 'Divergências em dados cadastrais' },
        { icon: FileCheckCorner, message: 'Histórico da matrícula apresenta inconsistências' },
      ],
    },

    ['Conclusão']: {
      message:
        'O imóvel apresenta pendências jurídicas, financeiras e cadastrais. A negociação não é recomendada até a regularização completa.',
    },
  }

  const header = useCallback((title: string, number?: string, status?: SectionStatus) => {
    if (title === 'Matrícula')
      return (
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <p className="text-new-black text-xs font-normal leading-[130%]">{title}</p>
            <p className="text-primary text-sm font-medium leading-[130%]">{number}</p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={mapBadgeStatus[status || '']}>{mapBadgeText[status || '']}</Badge>
            <div className={cn('size-2 rounded-full', mapCircleStatus[status || ''])} />
          </div>
        </div>
      )

    return (
      <div className="flex justify-between items-center">
        <div className="flex">
          <p className="text-new-black text-sm font-medium leading-[140%]">{title}</p>
        </div>

        {!!status && <div className={cn('size-2 rounded-full', mapCircleStatus[status || ''])} />}
      </div>
    )
  }, [])

  const content = useCallback(
    (
      title: string,
      message?: string,
      items?: Item[],
      office?: string,
      propertyType?: string,
      totalArea?: string,
      builtArea?: string,
    ) => {
      if (title === 'Matrícula') {
        return (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 items-center">
              <Building className="size-6 text-primary" />
              <p className="text-new-black text-xs font-normal leading-[130%] truncate">{office}</p>
            </div>

            <div className="flex gap-2 items-center">
              <Grid2X2 className="size-6 text-primary" />
              <p className="text-new-black text-xs font-normal leading-[130%]">{propertyType}</p>
            </div>

            <div className="flex gap-2 items-center">
              <div className="flex gap-2 items-center">
                <div className="flex items-center gap-2">
                  <RulerDimensionLineIcon className="size-6 text-primary" />
                  <p className="text-new-black text-xs font-normal leading-[130%]">Área Total</p>
                </div>
                <p className="text-primary text-xs font-normal leading-[130%]">{totalArea}</p>
              </div>

              <div className="flex gap-2 items-center">
                <div className="flex items-center gap-2">
                  <RulerDimensionLineIcon className="size-6 text-primary" />
                  <p className="text-new-black text-xs font-normal leading-[130%]">
                    Área Construída
                  </p>
                </div>
                <p className="text-primary text-xs font-normal leading-[130%]">{builtArea}</p>
              </div>
            </div>
          </div>
        )
      }

      if (title === 'Conclusão') {
        return <p className="text-xs font-normal leading-[150%]">{message}</p>
      }

      return (
        <div className="flex flex-col gap-4">
          {items?.map((item) => (
            <div key={item.message} className="flex gap-2 items-center">
              <item.icon className="size-6 text-primary" />
              <p className="text-new-black text-xs font-normal leading-[130%]">{item.message}</p>
            </div>
          ))}
        </div>
      )
    },
    [],
  )

  return (
    <div className="flex flex-col gap-4 p-4 lg:px-0 w-full mx-auto lg:max-w-lg">
      {Object.entries(result).map(([title, value]) => (
        <div
          key={title}
          className="cursor-pointer p-4 flex flex-col  border border-box rounded-sm group hover:border-primary"
        >
          {header(title, value?.number, value.status)}

          <hr className="border border-box mt-2 mb-4" />

          {content(
            title,
            value?.message,
            value?.items,
            value?.office,
            value?.propertyType,
            value?.totalArea,
            value?.builtArea,
          )}
        </div>
      ))}
    </div>
  )
}
