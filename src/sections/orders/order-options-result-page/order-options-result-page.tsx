'use client'

import { useCallback } from 'react'
import {
  Building,
  Grid2X2,
  RulerDimensionLineIcon,
  User,
  MapPin,
  FileQuestionMark,
  House,
  FileCheck,
  AlertTriangle,
  Ban,
  CheckCircle2,
} from 'lucide-react'

import { cn } from '@/utils/tailwind'
import Badge from '@/components/badge'
import { STATUS_THEME } from '@/sections/orders/constants'

type SectionStatus =
  | 'ALL_GOOD'
  | 'IRREGULARITIES_FOUND'
  | 'PURCHASE_AND_SALE_BLOCKED'

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

const SECTION_STATUS_CONFIG: Record<
  SectionStatus,
  {
    label: string
    theme: typeof STATUS_THEME[keyof typeof STATUS_THEME]
  }
> = {
  ALL_GOOD: {
    label: 'Sinal Verde',
    theme: STATUS_THEME.success,
  },
  IRREGULARITIES_FOUND: {
    label: 'Sinal Amarelo',
    theme: STATUS_THEME.warning,
  },
  PURCHASE_AND_SALE_BLOCKED: {
    label: 'Sinal Vermelho',
    theme: STATUS_THEME.danger,
  },
}

export default function OrderOptionsResultPage() {
  const result: ResultSections = {
    Matrícula: {
      number: '35529',
      status: 'ALL_GOOD',
      office: '6º Ofício De Registro De Imóveis - Vila Mariana - SP',
      propertyType: 'Terreno Urbano com Edificação',
      totalArea: '308.8 m²',
      builtArea: '0.48 m²',
    },

    'Ônus e Restrições': {
      status: 'PURCHASE_AND_SALE_BLOCKED',
      items: [
        { icon: Ban, message: 'Bloqueio judicial ativo na matrícula' },
        { icon: MapPin, message: 'Indisponibilidade de bens do proprietário' },
        { icon: AlertTriangle, message: 'Averbação premonitória identificada' },
      ],
    },

    'Pendências Financeiras': {
      status: 'IRREGULARITIES_FOUND',
      items: [
        { icon: User, message: 'IPTU do exercício atual em atraso' },
        { icon: FileQuestionMark, message: 'Taxa de lixo pendente' },
        { icon: House, message: 'Débitos de condomínio em aberto' },
      ],
    },

    Documentos: {
      status: 'ALL_GOOD',
      items: [
        { icon: CheckCircle2, message: 'Todas as certidões negativas emitidas' },
        { icon: FileCheck, message: 'Dados cadastrais validados com sucesso' },
        { icon: CheckCircle2, message: 'Histórico da matrícula sem inconsistências' },
      ],
    },

    Conclusão: {
      message:
        'O imóvel apresenta restrições graves que impedem a venda imediata (Sinal Vermelho em Ônus), além de pendências financeiras regularizáveis (Sinal Amarelo). Recomenda-se sanar os bloqueios judiciais antes de prosseguir.',
    },
  }

  const header = useCallback(
    (title: string, number?: string, status?: SectionStatus) => {
      if (!status) return null

      const config = SECTION_STATUS_CONFIG[status]

      const statusElement = (
        <div className="flex items-center gap-2">
          <Badge
            variant={config.theme.variant}
            className={cn('bg-transparent border', config.theme.badge)}
          >
            {config.label}
          </Badge>

          <div className={cn('size-2 rounded-full', config.theme.dot)} />
        </div>
      )

      if (title === 'Matrícula') {
        return (
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <p className="text-new-black text-xs font-normal leading-[130%]">
                {title}
              </p>
              <p className="text-primary text-sm font-medium leading-[130%]">
                {number}
              </p>
            </div>
            {statusElement}
          </div>
        )
      }

      return (
        <div className="flex justify-between items-center">
          <p className="text-new-black text-sm font-medium leading-[140%]">
            {title}
          </p>
          {statusElement}
        </div>
      )
    },
    []
  )

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
              <p className="text-new-black text-xs font-normal leading-[130%] truncate">
                {office}
              </p>
            </div>

            <div className="flex gap-2 items-center">
              <Grid2X2 className="size-6 text-primary" />
              <p className="text-new-black text-xs font-normal leading-[130%]">
                {propertyType}
              </p>
            </div>

            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <RulerDimensionLineIcon className="size-6 text-primary" />
                <p className="text-new-black text-xs">Área Total</p>
                <p className="text-primary text-xs">{totalArea}</p>
              </div>

              <div className="flex items-center gap-2">
                <RulerDimensionLineIcon className="size-6 text-primary" />
                <p className="text-new-black text-xs">Área Construída</p>
                <p className="text-primary text-xs">{builtArea}</p>
              </div>
            </div>
          </div>
        )
      }

      if (title === 'Conclusão') {
        return <p className="text-xs leading-[150%]">{message}</p>
      }

      return (
        <div className="flex flex-col gap-4">
          {items?.map(item => (
            <div key={item.message} className="flex gap-2 items-center">
              <item.icon className="size-6 text-primary" />
              <p className="text-new-black text-xs">{item.message}</p>
            </div>
          ))}
        </div>
      )
    },
    []
  )

  return (
    <div className="flex flex-col gap-4 p-4 lg:px-0 w-full mx-auto lg:max-w-lg">
      {Object.entries(result).map(([title, value]) => (
        <div
          key={title}
          className="p-4 flex flex-col border border-box rounded-sm group hover:border-primary"
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
            value?.builtArea
          )}
        </div>
      ))}
    </div>
  )
}
