'use client'

import type { ReactNode } from 'react'
import { cn } from '@/utils/tailwind'
import { ADMIN_CARD } from './admin-styles'

export type AdminTableColumn<T> = {
  key: string
  header: string
  headerClassName?: string
  cellClassName?: string
  render: (row: T) => ReactNode
}

type Props<T> = {
  columns: AdminTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  activeRowKey?: string | null
  empty?: ReactNode
  loading?: boolean
  loadingRows?: number
}

function TableSkeleton({ cols, rows }: { cols: number; rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-[#dedee5]">
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded-md bg-[rgba(148,151,169,0.2)]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export default function AdminDataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  activeRowKey,
  empty,
  loading,
  loadingRows = 5,
}: Props<T>) {
  return (
    <div className={cn(ADMIN_CARD, 'overflow-hidden')}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#dedee5] bg-[rgba(148,151,169,0.06)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#686b82]',
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton cols={columns.length} rows={loadingRows} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const key = rowKey(row)
                const active = activeRowKey === key
                return (
                  <tr
                    key={key}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      'border-b border-[#dedee5] last:border-b-0 transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-[rgba(133,91,251,0.04)]',
                      active && 'bg-[rgba(133,91,251,0.08)]',
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn('px-4 py-3 text-[#101114]', col.cellClassName)}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
