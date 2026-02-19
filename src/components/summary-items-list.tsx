import React from 'react'
import type { LucideIcon } from 'lucide-react'

export type SummaryItem = {
  key: string
  title: string
  value: React.ReactNode
  icon: LucideIcon
  badge?: string
  isGroup?: false
}

export type SummaryGroup = {
  key: string
  isGroup: true
  items: SummaryItem[]
}

export type SummaryItems = Array<SummaryItem | SummaryGroup>

type Props = {
  items: SummaryItems
  className?: string
}

export function SummaryItemsList({ items, className }: Props) {
  return (
    <div className={className}>
      {items.map((item) => {
        if (item.isGroup) {
          return (
            <div key={item.key} className="w-full flex border-b border-gray-200 last:border-b-0">
              {item.items.map((subItem, index) => {
                const SubItemIcon = subItem.icon
                return (
                  <div
                    key={subItem.key}
                    className={`flex-1 p-5 flex items-start gap-4 ${index === 0 ? 'border-r border-gray-200' : ''}`}
                  >
                    <div className="shrink-0 my-auto p-2 bg-primary/5 rounded-xl text-primary">
                      <SubItemIcon className="size-5" />
                    </div>

                    <div className="flex flex-col gap-0.5 text-start min-w-0">
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {subItem.title}
                      </h3>
                      <div className="text-sm font-semibold text-dark leading-tight">
                        {subItem.value}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }

        const ItemIcon = item.icon
        return (
          <div
            key={item.key}
            className="w-full p-5 flex items-start gap-4 px-5 border-b border-gray-200 last:border-b-0"
          >
            <div className="shrink-0 my-auto p-2 bg-primary/5 rounded-xl text-primary">
              <ItemIcon className="size-5" />
            </div>

            <div className="flex flex-col gap-0.5 text-start min-w-0">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {item.title}
              </h3>

              <div className="text-sm font-semibold text-dark leading-tight">
                {item.value}
              </div>

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
  )
}
