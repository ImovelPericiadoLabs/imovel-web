'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  HandCoins,
  Loader2,
  RefreshCw,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { AdminPageShell, AdminStaffGate } from '@/components/admin'
import { Switch } from '@/components/switch/switch'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import { getCostOverview } from '@/services/staff/costs'
import { formatMoney } from '@/utils/text'

const PERIODS = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
]

const INTEGRATION_COLORS = ['#0b1b3a', '#3b5bdb', '#7132f5', '#0ca678', '#f59f00', '#e8590c', '#c2255c', '#1098ad']

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export default function FinanceView() {
  const [period, setPeriod] = useState('30')
  const [showCredits, setShowCredits] = useState(false)

  const params = useMemo(
    () => ({ from: isoDaysAgo(Number(period)), to: isoDaysAgo(0), credits: showCredits }),
    [period, showCredits],
  )

  const overview = useQuery({
    queryKey: ['cost-overview', params.from, params.to, params.credits],
    queryFn: () => getCostOverview(params),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })

  const data = overview.data
  const t = data?.totals
  const risk = data?.risk

  return (
    <AdminStaffGate>
      <AdminPageShell
        actions={
          <>
            <label
              className="flex items-center gap-2 text-sm text-muted-foreground"
              title="Consultas pagas via créditos (estornos reaproveitados e contas de teste) ficam ocultas por padrão"
            >
              <Switch checked={showCredits} onCheckedChange={setShowCredits} />
              Incluir créditos
            </label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => overview.refetch()} disabled={overview.isFetching}>
              {overview.isFetching ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Atualizar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi
              label="Receita"
              value={t ? formatMoney(t.revenue) : '—'}
              hint={t ? `${t.orders} pedidos · ticket ${formatMoney(t.avg_ticket)}` : undefined}
              loading={overview.isLoading}
              icon={<TrendingUp className="size-4 text-emerald-600" />}
            />
            <Kpi
              label="Custo integrações"
              value={t ? formatMoney(t.cost) : '—'}
              hint={t ? `${formatMoney(t.avg_cost_per_order)} / pedido` : undefined}
              loading={overview.isLoading}
              icon={<TrendingDown className="size-4 text-red-500" />}
            />
            <Kpi
              label="Comissão parceiros"
              value={t ? formatMoney(t.commission) : '—'}
              hint={t && t.refunds > 0 ? `+ ${formatMoney(t.refunds)} estornos` : undefined}
              loading={overview.isLoading}
              icon={<HandCoins className="size-4 text-amber-600" />}
            />
            <Kpi
              label="Lucro líquido"
              value={t ? formatMoney(t.net_profit) : '—'}
              hint={t ? `Margem líquida ${t.net_margin.toFixed(1)}% · bruta ${t.margin.toFixed(1)}%` : undefined}
              loading={overview.isLoading}
              icon={<Wallet className="size-4 text-primary" />}
              negative={Boolean(t && t.net_profit < 0)}
            />
          </div>

          {risk && (risk.orders_over_limit > 0 || risk.orders_near_limit > 0 || risk.in_manual_review > 0) && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <span className="flex items-center gap-2 font-semibold">
                <ShieldAlert className="size-4 shrink-0" />
                Trava de margem ({risk.guard_pct.toFixed(0)}% do valor pago)
              </span>
              {risk.orders_over_limit > 0 && (
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5 text-red-600" />
                  <strong>{risk.orders_over_limit}</strong> acima do teto ({formatMoney(risk.excess_cost)} de excesso)
                </span>
              )}
              {risk.orders_near_limit > 0 && (
                <span>
                  <strong>{risk.orders_near_limit}</strong> se aproximando do teto
                </span>
              )}
              {risk.in_manual_review > 0 && (
                <span>
                  <strong>{risk.in_manual_review}</strong> na fila manual pela trava
                </span>
              )}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Receita x Custo</CardTitle>
            </CardHeader>
            <CardContent>
              {overview.isLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={288}>
                  <AreaChart data={data?.series ?? []} margin={{ left: 4, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0ca678" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#0ca678" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="cst" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e03131" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#e03131" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => d.slice(5)}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                      width={48}
                    />
                    <Tooltip
                      formatter={(value) => formatMoney(Number(value))}
                      labelFormatter={(l) => `Dia ${l}`}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="revenue" name="Receita" stroke="#0ca678" fill="url(#rev)" strokeWidth={2} />
                    <Area type="monotone" dataKey="cost" name="Custo" stroke="#e03131" fill="url(#cst)" strokeWidth={2} />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      name="Lucro bruto"
                      stroke="#7132f5"
                      fill="none"
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Custo por integração</CardTitle>
              </CardHeader>
              <CardContent>
                {overview.isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (data?.by_integration?.length ?? 0) === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height={256}>
                    <BarChart data={data?.by_integration ?? []} margin={{ left: 4, right: 8, top: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" vertical={false} />
                      <XAxis
                        dataKey="integration"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                        height={56}
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={48} />
                      <Tooltip
                        formatter={(value, _name, entry) => {
                          const row = entry?.payload as { calls?: number; avg_cost?: number } | undefined
                          const calls = row?.calls ? ` · ${row.calls} chamadas · média ${formatMoney(row.avg_cost ?? 0)}` : ''
                          return [`${formatMoney(Number(value))}${calls}`, 'Custo']
                        }}
                        contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                      />
                      <Bar dataKey="cost" name="Custo" radius={[6, 6, 0, 0]}>
                        {(data?.by_integration ?? []).map((_, i) => (
                          <Cell key={i} fill={INTEGRATION_COLORS[i % INTEGRATION_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ganho / perda por parceiro</CardTitle>
              </CardHeader>
              <CardContent>
                {overview.isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (data?.by_partner?.length ?? 0) === 0 ? (
                  <EmptyChart />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parceiro</TableHead>
                        <TableHead className="hidden text-right sm:table-cell">Receita</TableHead>
                        <TableHead className="text-right">Custo</TableHead>
                        <TableHead className="hidden text-right md:table-cell">Comissão</TableHead>
                        <TableHead className="text-right">Líquido</TableHead>
                        <TableHead className="hidden text-right sm:table-cell">Margem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data?.by_partner ?? []).map((row) => (
                        <TableRow key={row.org_id}>
                          <TableCell className="max-w-[140px] truncate font-medium">
                            {row.name}
                            <span className="block text-[11px] font-normal text-muted-foreground">
                              {row.orders} pagos · {row.commissionable_orders ?? 0} comissionáveis
                            </span>
                          </TableCell>
                          <TableCell className="hidden text-right tabular-nums text-emerald-700 sm:table-cell">
                            {formatMoney(row.revenue)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-red-600">
                            {formatMoney(row.cost)}
                          </TableCell>
                          <TableCell className="hidden text-right tabular-nums text-amber-700 md:table-cell">
                            {formatMoney(row.commission)}
                          </TableCell>
                          <TableCell
                            className={cnProfit(row.net_profit)}
                          >
                            {formatMoney(row.net_profit)}
                          </TableCell>
                          <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">
                            {row.net_margin.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminPageShell>
    </AdminStaffGate>
  )
}

function cnProfit(value: number): string {
  return value < 0
    ? 'text-right font-semibold tabular-nums text-red-600'
    : 'text-right font-semibold tabular-nums'
}

function Kpi({
  label,
  value,
  hint,
  icon,
  loading,
  negative,
}: {
  label: string
  value: string
  hint?: string
  icon?: React.ReactNode
  loading?: boolean
  negative?: boolean
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
          {icon}
        </div>
        {loading ? (
          <Skeleton className="h-7 w-24" />
        ) : (
          <span className={`text-xl font-semibold tabular-nums ${negative ? 'text-red-600' : 'text-foreground'}`}>
            {value}
          </span>
        )}
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </CardContent>
    </Card>
  )
}

function EmptyChart() {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
      Sem dados no período.
    </div>
  )
}
