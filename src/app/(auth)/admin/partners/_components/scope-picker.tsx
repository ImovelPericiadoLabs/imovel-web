'use client'

import { Check } from 'lucide-react'

import { cn } from '@/utils/tailwind'
import { ALL_SCOPES, type PartnerScope } from '@/services/staff/partners'

export function ScopePicker({
  value,
  onChange,
}: {
  value: PartnerScope[]
  onChange: (next: PartnerScope[]) => void
}) {
  const toggle = (scope: PartnerScope) => {
    onChange(value.includes(scope) ? value.filter((s) => s !== scope) : [...value, scope])
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {ALL_SCOPES.map((scope) => {
        const active = value.includes(scope.value)
        return (
          <button
            key={scope.value}
            type="button"
            onClick={() => toggle(scope.value)}
            className={cn(
              'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
              active ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted',
            )}
          >
            <span
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-md border',
                active ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
              )}
            >
              {active && <Check className="size-3.5" />}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">{scope.label}</span>
              <span className="block truncate font-mono text-xs text-muted-foreground">
                {scope.value}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
