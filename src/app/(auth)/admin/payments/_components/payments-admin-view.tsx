'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Loader2, RefreshCw, TriangleAlert } from 'lucide-react'

import { AdminPageShell, AdminStaffGate } from '@/components/admin'
import { Switch } from '@/components/switch/switch'
import { Button, Card, CardContent } from '@/components/ui'
import {
  listStaffPaymentMethods,
  setStaffPaymentMethodEnabled,
  type StaffPaymentMethod,
} from '@/services/staff/payment-methods'

const METHOD_HELP: Record<StaffPaymentMethod['code'], string> = {
  PIX: 'Cai sozinho em manutenção se o Asaas não tiver chave Pix cadastrada.',
  BOLETO: 'Gera fatura/PDF. Confirmação pode levar até 3 dias úteis.',
  CREDIT_CARD: 'Abre a página segura do Asaas. O link já aceita crédito e débito.',
  DEBIT_CARD: 'Não entra no checkout: o link do cartão já cobre débito e crédito.',
}

export default function PaymentsAdminView() {
  const queryClient = useQueryClient()
  const methods = useQuery({
    queryKey: ['staff-payment-methods'],
    queryFn: listStaffPaymentMethods,
  })

  const toggle = useMutation({
    mutationFn: ({ code, enabled }: { code: StaffPaymentMethod['code']; enabled: boolean }) =>
      setStaffPaymentMethodEnabled(code, enabled),
    onSuccess: (rows) => {
      queryClient.setQueryData(['staff-payment-methods'], rows)
    },
  })

  return (
    <AdminStaffGate>
      <AdminPageShell
        description="Ligue ou desligue Pix, boleto e cartão no checkout. O cartão abre um link que já aceita crédito e débito. Um meio que o Asaas recusar (zero chaves Pix, chave inválida) entra em manutenção sozinho para o cliente cair em outro."
        actions={
          <Button variant="outline" onClick={() => methods.refetch()} disabled={methods.isFetching}>
            {methods.isFetching ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Atualizar
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          {(methods.data ?? []).filter((row) => row.code !== 'DEBIT_CARD').map((row) => {
            const busy = toggle.isPending && toggle.variables?.code === row.code
            return (
              <Card key={row.code}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <CreditCard className="size-4 text-muted-foreground" />
                      <p className="text-sm font-semibold capitalize">{row.label}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          row.available
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-amber-50 text-amber-900'
                        }`}
                      >
                        {row.available ? 'Ativo no checkout' : 'Em manutenção'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{METHOD_HELP[row.code]}</p>
                    {row.auto_disabled && (
                      <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-800">
                        <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                        {row.auto_disabled_reason || 'Desligado automaticamente após erro do Asaas.'}
                      </p>
                    )}
                    {row.last_error && (
                      <p className="mt-1 text-[11px] text-muted-foreground">Último erro: {row.last_error}</p>
                    )}
                  </div>
                  <label className="flex shrink-0 items-center gap-2 text-sm">
                    <Switch
                      checked={row.enabled}
                      disabled={busy}
                      onCheckedChange={(enabled) => toggle.mutate({ code: row.code, enabled })}
                    />
                    {row.enabled ? 'Ligado' : 'Desligado'}
                  </label>
                </CardContent>
              </Card>
            )
          })}
          {methods.isLoading && (
            <p className="text-sm text-muted-foreground">Carregando meios de pagamento…</p>
          )}
        </div>
      </AdminPageShell>
    </AdminStaffGate>
  )
}
