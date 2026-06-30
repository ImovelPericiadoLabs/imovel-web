'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, RefreshCw, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
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

  const params = useMemo(() => ({ from: isoDaysAgo(Number(period)), to: isoDaysAgo(0) }), [period])

  const overview = useQuery({
    queryKey: ['cost-overview', params.from, params.to],
    queryFn: () => getCostOverview(params),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })

  const data = overview.data
  const t = data?.totals

  return (
    <AdminStaffGate>
      <AdminPageShell
        actions={
          <>
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
              loading={overview.isLoading}
              icon={<TrendingUp className="size-4 text-emerald-600" />}
            />
            <Kpi
              label="Custo"
              value={t ? formatMoney(t.cost) : '—'}
              loading={overview.isLoading}
              icon={<TrendingDown className="size-4 text-red-500" />}
            />
            <Kpi
              label="Lucro"
              value={t ? formatMoney(t.profit) : '—'}
              loading={overview.isLoading}
              icon={<Wallet className="size-4 text-primary" />}
            />
            <Kpi
              label="Margem"
              value={t ? `${t.margin.toFixed(1)}%` : '—'}
              hint={t ? `${t.orders} pedidos` : undefined}
              loading={overview.isLoading}
            />
          </div>

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
                        formatter={(value) => formatMoney(Number(value))}
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
                <CardTitle>Custo por parceiro</CardTitle>
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
                        <TableHead className="text-right">Custo</TableHead>
                        <TableHead className="hidden text-right sm:table-cell">Receita</TableHead>
                        <TableHead className="text-right">Lucro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data?.by_partner ?? []).map((row) => (
                        <TableRow key={row.org_id}>
                          <TableCell className="max-w-[160px] truncate font-medium">{row.name}</TableCell>
                          <TableCell className="text-right tabular-nums text-red-600">
                            {formatMoney(row.cost)}
                          </TableCell>
                          <TableCell className="hidden text-right tabular-nums text-emerald-700 sm:table-cell">
                            {formatMoney(row.revenue)}
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {formatMoney(row.profit)}
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

function Kpi({
  label,
  value,
  hint,
  icon,
  loading,
}: {
  label: string
  value: string
  hint?: string
  icon?: React.ReactNode
  loading?: boolean
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
          <span className="text-xl font-semibold tabular-nums text-foreground">{value}</span>
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
