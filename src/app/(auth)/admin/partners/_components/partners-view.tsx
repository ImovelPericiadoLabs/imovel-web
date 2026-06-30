'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Loader2, Plus, RefreshCw, Search, ShieldCheck } from 'lucide-react'

import { AdminKpiStrip, AdminPageShell, AdminStaffGate } from '@/components/admin'
import {
  Badge,
  Button,
  Card,
  Input,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import { listPartners, type Partner } from '@/services/staff/partners'

import { PartnerCreateDialog } from './partner-create-dialog'
import { PartnerDetailDialog } from './partner-detail-dialog'
import { formatBRL, formatDate } from './partner-utils'

export default function PartnersView() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchDebounced(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const list = useQuery({
    queryKey: ['staff-partners', page, searchDebounced],
    queryFn: () => listPartners(page, searchDebounced),
    staleTime: 20_000,
    refetchOnWindowFocus: false,
  })

  const rows = list.data?.results ?? []
  const activeCount = rows.filter((r) => r.status === 'ACTIVE').length
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['staff-partners'] })

  return (
    <AdminStaffGate>
      <AdminPageShell
        metrics={
          <AdminKpiStrip
            items={[
              { id: 'total', label: 'Parceiros', value: list.data?.count ?? '—', icon: Building2 },
              { id: 'active', label: 'Ativos', value: activeCount, tone: 'success' },
              {
                id: 'page',
                label: 'Página',
                value: page,
                hint: searchDebounced ? `Busca: ${searchDebounced}` : undefined,
              },
            ]}
          />
        }
        actions={
          <>
            <Button variant="outline" onClick={() => list.refetch()} disabled={list.isFetching}>
              {list.isFetching ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Atualizar
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Novo parceiro
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou slug…"
              className="pl-9"
            />
          </div>

          {list.isError && (
            <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {(list.error as Error)?.message ?? 'Não foi possível carregar os parceiros.'}
            </Card>
          )}

          <Card className="overflow-hidden">
            {list.isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                <ShieldCheck className="size-9 text-muted-foreground/50" />
                <p className="text-sm font-medium text-foreground">Nenhum parceiro</p>
                <p className="max-w-xs text-sm text-muted-foreground">
                  {searchDebounced ? 'Ajuste a busca.' : 'Crie o primeiro parceiro B2B com credenciais OAuth.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parceiro</TableHead>
                    <TableHead className="hidden md:table-cell">Client ID</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Criado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row: Partner) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => setDetailId(row.id)}
                    >
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{row.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {row.owner_email ?? row.slug}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <code className="truncate font-mono text-xs text-muted-foreground">
                          {row.client_id ? `${row.client_id.slice(0, 16)}…` : '—'}
                        </code>
                      </TableCell>
                      <TableCell className="font-semibold tabular-nums text-emerald-700">
                        {formatBRL(row.credits_balance)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.status === 'ACTIVE' ? 'success' : 'warning'}>
                          {row.status === 'ACTIVE' ? 'Ativo' : 'Suspenso'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground lg:table-cell">
                        {formatDate(row.created)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || list.isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">Página {page}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={!list.data?.next || list.isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Seguinte
            </Button>
          </div>
        </div>
      </AdminPageShell>

      <PartnerCreateDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={refresh} />
      <PartnerDetailDialog
        partnerId={detailId}
        open={Boolean(detailId)}
        onOpenChange={(o) => !o && setDetailId(null)}
        onChanged={refresh}
      />
    </AdminStaffGate>
  )
}
