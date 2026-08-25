import { BedDouble, Bath, Car, ChevronRight, Heart, Ruler } from 'lucide-react'

import { Badge, Button } from '@/components/ui'
import { useJetimobFavorites } from '@/hooks/use-jetimob-favorites'
import { formatRelativeDate } from '@/lib/relative-time'
import type { JetimobPropertyRow } from '@/services/jetimob'
import { formatMoney } from '@/utils/text/text'
import { cn } from '@/utils/tailwind'

import { PropertyPhoto } from './property-photo'

type PropertyCardProps = {
  property: JetimobPropertyRow
  layout: 'grid' | 'list'
  selected?: boolean
  onSelect: (property: JetimobPropertyRow) => void
  /** Delay de entrada em ms — cria o efeito de cascata na primeira renderização. */
  animationDelayMs?: number
}

function StatRow({ property }: { property: JetimobPropertyRow }) {
  const stats = [
    { Icon: BedDouble, value: property.bedrooms },
    { Icon: Bath, value: property.bathrooms },
    { Icon: Car, value: property.parking_spots },
    { Icon: Ruler, value: property.area_m2 ? `${property.area_m2}m²` : null },
  ]

  return (
    <div className="flex items-center gap-3 text-xs text-gray-500">
      {stats.map(({ Icon, value }, idx) => (
        <span key={idx} className="flex items-center gap-1">
          <Icon className="size-3.5 text-gray-400" aria-hidden />
          {value ?? '–'}
        </span>
      ))}
    </div>
  )
}

function FavoriteButton({
  code,
  className,
}: {
  code: string
  className?: string
}) {
  const { isFavorite, toggleFavorite } = useJetimobFavorites()
  const active = isFavorite(code)

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      onClick={(e) => {
        e.stopPropagation()
        toggleFavorite(code)
      }}
      className={cn(
        'flex size-8 items-center justify-center rounded-full bg-white/90 text-gray-400 shadow-sm backdrop-blur transition hover:text-red-500',
        className,
      )}
    >
      <Heart
        key={String(active)}
        className={cn('size-4 jetimob-heart-pop', active && 'fill-red-500 text-red-500')}
        aria-hidden
      />
    </button>
  )
}

function priceLabel(property: JetimobPropertyRow): string | null {
  if (typeof property.sale_price === 'number') return formatMoney(property.sale_price)
  if (typeof property.rent_price === 'number') return `${formatMoney(property.rent_price)}/mês`
  return null
}

export function PropertyCard({
  property,
  layout,
  selected,
  onSelect,
  animationDelayMs = 0,
}: PropertyCardProps) {
  const code = String(property.code || '')
  const title = property.title || (code ? `Imóvel ${code}` : 'Imóvel')
  const price = priceLabel(property)
  const updated = formatRelativeDate(property.updated_at)

  const addressLines = (property.address || '').split('\n').filter(Boolean)
  const addressLine1 = addressLines[0] || property.address || ''
  const addressLine2 = [property.city, property.state].filter(Boolean).join('/')

  if (layout === 'list') {
    return (
      <button
        type="button"
        onClick={() => onSelect(property)}
        disabled={!code}
        style={{ animationDelay: `${animationDelayMs}ms` }}
        className={cn(
          'jetimob-card-in flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
          selected ? 'border-primary ring-2 ring-primary/20' : 'border-gray-100 hover:border-primary/40',
        )}
      >
        <span className="relative size-16 shrink-0 overflow-hidden rounded-xl md:size-20">
          <PropertyPhoto photo={property.photo} title={title} />
          {property.status && (
            <Badge variant="success" className="absolute left-1 top-1 px-1.5 py-0 text-[10px]">
              {property.status}
            </Badge>
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-gray-900">{title}</span>
          {addressLine1 && (
            <span className="mt-0.5 block truncate text-xs text-gray-500">{addressLine1}</span>
          )}
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {code && (
              <span className="inline-block rounded-md bg-primary/5 px-2 py-0.5 font-mono text-[11px] font-medium text-primary">
                #{code}
              </span>
            )}
            {price && <span className="text-xs font-semibold text-gray-900">{price}</span>}
          </span>
        </span>

        <ChevronRight
          className={cn('size-5 shrink-0 transition', selected ? 'text-primary' : 'text-gray-300')}
          aria-hidden
        />
      </button>
    )
  }

  return (
    <div
      style={{ animationDelay: `${animationDelayMs}ms` }}
      className={cn(
        'jetimob-card-in group flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-gray-100',
      )}
    >
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-gray-100">
        <PropertyPhoto photo={property.photo} title={title} />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          {property.status ? (
            <Badge variant="success" className="shadow-sm">
              {property.status}
            </Badge>
          ) : (
            <span />
          )}
          {code && <FavoriteButton code={code} />}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="truncate text-sm font-bold text-gray-900">{title}</h3>
        <div className="min-h-8 text-xs text-gray-500">
          {addressLine1 && <p className="truncate">{addressLine1}</p>}
          {addressLine2 && (
            <p className="truncate">
              {addressLine2}
              {property.neighborhood ? ` • ${property.neighborhood}` : ''}
            </p>
          )}
        </div>

        <StatRow property={property} />

        <p className="mt-1 text-lg font-bold text-gray-900">{price ?? 'Preço sob consulta'}</p>

        <div className="flex items-center justify-between text-[11px] text-gray-400">
          {code && (
            <span className="rounded-md bg-gray-50 px-2 py-0.5 font-mono font-medium text-gray-500">
              #{code}
            </span>
          )}
          {updated && <span>Atualizado {updated}</span>}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => onSelect(property)}
          disabled={!code}
          className="mt-2 h-10 w-full justify-center gap-1.5 rounded-xl text-sm font-semibold"
        >
          Consultar
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  )
}
