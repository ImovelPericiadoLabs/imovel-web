'use client'

import type { ReactNode } from 'react'
import { cn } from '@/utils/tailwind'
import {
  ADMIN_TABLE_HEAD,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_ROW_ACTIVE,
  ADMIN_TABLE_ROW_HOVER,
  ADMIN_TABLE_WRAP,
} from './admin-styles'

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
        <tr key={i} className={ADMIN_TABLE_ROW}>
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-3 py-2.5">
              <div className="h-3.5 animate-pulse rounded bg-[rgba(133,91,251,0.12)]" />
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
  loadingRows = 8,
}: Props<T>) {
  return (
    <div className={ADMIN_TABLE_WRAP}>
      <div className="max-h-[min(70vh,48rem)] overflow-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead>
            <tr className={ADMIN_TABLE_HEAD}>
              {columns.map((col) => (
                <th key={col.key} scope="col" className={cn('px-3 py-2.5', col.headerClassName)}>
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
                      ADMIN_TABLE_ROW,
                      onRowClick && ADMIN_TABLE_ROW_HOVER,
                      active && ADMIN_TABLE_ROW_ACTIVE,
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn('px-3 py-2.5 text-[#101114]', col.cellClassName)}
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
