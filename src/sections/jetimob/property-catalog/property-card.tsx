import { ArrowRight, Bath, BedDouble, Car, Heart, Maximize2 } from 'lucide-react'

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
  /** Delay de entrada em ms — cascata sutil na primeira renderização da linha. */
  animationDelayMs?: number
}

/** "R$ 780.000" — sem centavos, como na referência (valores cheios de imóvel). */
function priceLabel(property: JetimobPropertyRow): string | null {
  const sale = property.sale_price
  const rent = property.rent_price
  if (typeof sale === 'number') return formatMoney(sale).replace(/,\d{2}$/, '')
  if (typeof rent === 'number') return `${formatMoney(rent).replace(/,\d{2}$/, '')}/mês`
  return null
}

function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-[var(--color-jetimob-active-bg)] px-2.5 py-1',
        'text-[11px] font-semibold leading-none text-[var(--color-jetimob-active-text)]',
        'shadow-[var(--shadow-jetimob-float)]',
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-[var(--color-jetimob-active-dot)]" aria-hidden />
      {status}
    </span>
  )
}

function FavoriteButton({ code }: { code: string }) {
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
        'flex size-8 items-center justify-center rounded-full bg-white',
        'text-[var(--color-jetimob-text-subtle)] shadow-[var(--shadow-jetimob-float)]',
        'transition-colors hover:text-red-500',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2',
      )}
    >
      <Heart
        key={String(active)}
        className={cn('size-[18px] jetimob-heart-pop', active && 'fill-red-500 text-red-500')}
        aria-hidden
      />
    </button>
  )
}

/** Linha de características: valor ausente vira "–" (nunca 0 inventado). */
function StatRow({ property }: { property: JetimobPropertyRow }) {
  const stats = [
    { Icon: BedDouble, value: property.bedrooms, label: 'quartos' },
    { Icon: Bath, value: property.bathrooms, label: 'banheiros' },
    { Icon: Car, value: property.parking_spots, label: 'vagas' },
    { Icon: Maximize2, value: property.area_m2 ? `${property.area_m2}m²` : null, label: 'área' },
  ]

  return (
    <ul className="flex items-center gap-[14px]">
      {stats.map(({ Icon, value, label }) => (
        <li
          key={label}
          className="flex items-center gap-1.5 text-[13px] leading-none text-[var(--color-jetimob-text-body)]"
        >
          <Icon className="size-4 shrink-0 text-[var(--color-jetimob-text-subtle)]" aria-hidden />
          <span>
            <span className="sr-only">{label}: </span>
            {value ?? '–'}
          </span>
        </li>
      ))}
    </ul>
  )
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
  const locality = [property.city && property.state ? `${property.city}/${property.state}` : property.city, property.neighborhood]
    .filter(Boolean)
    .join('  •  ')

  const shell = cn(
    'jetimob-card-in group relative flex bg-[var(--color-jetimob-surface)]',
    'rounded-[var(--radius-jetimob-card)] border shadow-[var(--shadow-jetimob-card)]',
    'transition-[transform,box-shadow,border-color] duration-200',
    'hover:-translate-y-0.5 hover:shadow-[var(--shadow-jetimob-card-hover)]',
    selected
      ? 'border-[var(--color-jetimob-accent)] ring-1 ring-[var(--color-jetimob-accent)]'
      : 'border-[var(--color-jetimob-border)]',
  )

  if (layout === 'list') {
    return (
      <article style={{ animationDelay: `${animationDelayMs}ms` }} className={cn(shell, 'items-center gap-4 p-3')}>
        <div className="relative size-[92px] shrink-0 overflow-hidden rounded-[10px] bg-[var(--color-jetimob-surface-muted)]">
          <PropertyPhoto photo={property.photo} title={title} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-bold leading-tight text-[var(--color-jetimob-text-title)]">
                {title}
              </h3>
              {property.address && (
                <p className="mt-1 truncate text-[13px] leading-tight text-[var(--color-jetimob-text-muted)]">
                  {property.address}
                </p>
              )}
            </div>
            {property.status && <StatusBadge status={property.status} className="shrink-0" />}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
            <StatRow property={property} />
            {price && (
              <p className="text-[17px] font-bold leading-none text-[var(--color-jetimob-text-title)]">{price}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelect(property)}
          disabled={!code}
          className={cn(
            'ml-1 hidden h-11 shrink-0 items-center gap-1.5 rounded-[var(--radius-jetimob-field)] border px-5 sm:inline-flex',
            'border-[var(--color-jetimob-border-field)] bg-white',
            'text-[14px] font-semibold text-[var(--color-jetimob-text-title)]',
            'transition-colors hover:border-[var(--color-jetimob-accent)] hover:bg-[var(--color-jetimob-surface-muted)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          Consultar
          <ArrowRight className="size-4" aria-hidden />
        </button>

        {/* Toda a linha é clicável no mobile, onde o botão fica oculto. */}
        <button
          type="button"
          onClick={() => onSelect(property)}
          disabled={!code}
          aria-label={`Consultar ${title}`}
          className="absolute inset-0 rounded-[var(--radius-jetimob-card)] sm:hidden"
        />
      </article>
    )
  }

  return (
    <article style={{ animationDelay: `${animationDelayMs}ms` }} className={cn(shell, 'h-full flex-col overflow-hidden')}>
      <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden bg-[var(--color-jetimob-surface-muted)]">
        <PropertyPhoto photo={property.photo} title={title} />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          {property.status ? <StatusBadge status={property.status} /> : <span />}
          {code && <FavoriteButton code={code} />}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate text-[15px] font-bold leading-tight text-[var(--color-jetimob-text-title)]">
          {title}
        </h3>

        <div className="mt-1.5 space-y-1">
          <p className="truncate text-[13px] leading-tight text-[var(--color-jetimob-text-muted)]">
            {property.address || '—'}
          </p>
          <p className="truncate text-[12px] leading-tight text-[var(--color-jetimob-text-subtle)]">
            {locality || ' '}
          </p>
        </div>

        <div className="mt-3">
          <StatRow property={property} />
        </div>

        <p className="mt-3 text-[20px] font-bold leading-none tracking-[-0.01em] text-[var(--color-jetimob-text-title)]">
          {price ?? 'Preço sob consulta'}
        </p>

        <div className="mt-2.5 flex items-center gap-2">
          {code && (
            <span className="rounded-[var(--radius-jetimob-chip)] bg-[var(--color-jetimob-surface-muted)] px-1.5 py-0.5 font-mono text-[11px] leading-none text-[var(--color-jetimob-text-muted)]">
              #{code}
            </span>
          )}
          {updated && (
            <span className="truncate text-[12px] leading-none text-[var(--color-jetimob-text-subtle)]">
              Atualizado {updated}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onSelect(property)}
          disabled={!code}
          className={cn(
            'mt-4 flex h-11 w-full items-center justify-center gap-1.5 rounded-[var(--radius-jetimob-field)] border',
            'border-[var(--color-jetimob-border-field)] bg-white',
            'text-[14px] font-semibold text-[var(--color-jetimob-text-title)]',
            'transition-colors hover:border-[var(--color-jetimob-accent)] hover:bg-[var(--color-jetimob-surface-muted)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          Consultar
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </article>
  )
}
