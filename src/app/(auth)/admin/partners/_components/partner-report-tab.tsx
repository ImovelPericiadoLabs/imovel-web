'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { Eye, FileText, Loader2, Send } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge, Button, Input, Label, Separator, Skeleton } from '@/components/ui'
import { Switch } from '@/components/switch/switch'
import {
  getPartnerIntegrationReport,
  previewPartnerIntegrationReport,
  sendPartnerIntegrationReport,
  updatePartnerIntegrationReport,
} from '@/services/staff/partners'

type Props = {
  partnerId: string
  ownerEmail: string | null
  onFeedback: (message: string, kind?: 'success' | 'error') => void
}

export function PartnerReportTab({ partnerId, ownerEmail, onFeedback }: Props) {
  const [enabled, setEnabled] = useState(true)
  const [emailsText, setEmailsText] = useState('')
  const [commission, setCommission] = useState('')
  const [testEmail, setTestEmail] = useState('')

  const report = useQuery({
    queryKey: ['staff-partner-report', partnerId],
    queryFn: () => getPartnerIntegrationReport(partnerId),
    enabled: Boolean(partnerId),
  })

  useEffect(() => {
    if (!report.data) return
    setEnabled(report.data.weekly_enabled)
    setEmailsText((report.data.recipient_emails ?? []).join(', '))
    setCommission(report.data.commission_per_order ?? '')
  }, [report.data])

  const toggleWeekly = useMutation({
    mutationFn: (next: boolean) =>
      updatePartnerIntegrationReport(partnerId, { weekly_enabled: next }),
    onSuccess: (data) => {
      setEnabled(data.weekly_enabled)
      onFeedback(data.weekly_enabled ? 'Relatório semanal ativado.' : 'Relatório semanal pausado.')
      void report.refetch()
    },
    onError: (err: unknown) => {
      setEnabled(report.data?.weekly_enabled ?? true)
      onFeedback(err instanceof Error ? err.message : 'Falha ao atualizar o envio semanal.', 'error')
    },
  })

  const save = useMutation({
    mutationFn: () =>
      updatePartnerIntegrationReport(partnerId, {
        weekly_enabled: enabled,
        recipient_emails: emailsText
          .split(/[,;\s]+/)
          .map((e) => e.trim())
          .filter(Boolean),
        commission_per_order: commission.trim() ? Number(commission.replace(',', '.')) : null,
      }),
    onSuccess: () => {
      onFeedback('Configuração do relatório salva.')
      void report.refetch()
    },
    onError: (err: unknown) =>
      onFeedback(err instanceof Error ? err.message : 'Falha ao salvar.', 'error'),
  })

  const previewHtml = useMutation({
    mutationFn: () => previewPartnerIntegrationReport(partnerId, 'html'),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
      onFeedback('Preview HTML aberto em nova aba.')
    },
    onError: (err: unknown) =>
      onFeedback(err instanceof Error ? err.message : 'Falha no preview.', 'error'),
  })

  const previewPdf = useMutation({
    mutationFn: () => previewPartnerIntegrationReport(partnerId, 'pdf'),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
      onFeedback('Preview PDF aberto em nova aba.')
    },
    onError: (err: unknown) =>
      onFeedback(err instanceof Error ? err.message : 'Falha no preview PDF.', 'error'),
  })

  const forceSend = useMutation({
    mutationFn: () =>
      sendPartnerIntegrationReport(partnerId, {
        email: testEmail.trim() || undefined,
        async: true,
      }),
    onSuccess: (data) => onFeedback(data.detail ?? 'Relatório enfileirado para envio.'),
    onError: (err: unknown) =>
      onFeedback(err instanceof Error ? err.message : 'Falha ao enviar.', 'error'),
  })

  if (report.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  const cfg = report.data

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Relatório semanal automático</p>
          <p className="text-xs text-muted-foreground">
            PDF de consumo da integração OAuth · toda segunda-feira às 08:00
          </p>
        </div>
        <Switch
          checked={enabled}
          disabled={toggleWeekly.isPending}
          onCheckedChange={(next) => {
            setEnabled(next)
            toggleWeekly.mutate(next)
          }}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="report-emails">Destinatários (vazio = owner)</Label>
          <Input
            id="report-emails"
            value={emailsText}
            onChange={(e) => setEmailsText(e.target.value)}
            placeholder={ownerEmail ?? 'email@parceiro.com'}
          />
          {cfg?.resolved_recipients?.length ? (
            <p className="text-xs text-muted-foreground">
              Efetivos: {cfg.resolved_recipients.join(', ')}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="report-commission">Comissão unitária (R$)</Label>
          <Input
            id="report-commission"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            placeholder="6,87"
          />
        </div>
      </div>

      {cfg?.last_sent_at ? (
        <p className="text-xs text-muted-foreground">
          Último envio: {new Date(cfg.last_sent_at).toLocaleString('pt-BR')}
        </p>
      ) : (
        <Badge variant="outline">Nunca enviado</Badge>
      )}

      {cfg?.last_error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {cfg.last_error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending && <Loader2 className="size-4 animate-spin" />}
          Salvar configuração
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => previewHtml.mutate()}
          disabled={previewHtml.isPending}
        >
          {previewHtml.isPending ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
          Preview HTML
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => previewPdf.mutate()}
          disabled={previewPdf.isPending}
        >
          {previewPdf.isPending ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
          Preview PDF
        </Button>
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <Label htmlFor="report-test-email">Forçar envio (teste)</Label>
        <div className="flex flex-wrap gap-2">
          <Input
            id="report-test-email"
            className="max-w-sm"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder={ownerEmail ?? 'opcional — usa destinatários configurados'}
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => forceSend.mutate()}
            disabled={forceSend.isPending}
          >
            {forceSend.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Enviar agora
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Ignora o toggle de pausa · enfileira na fila PDF · útil para validar design e entrega
        </p>
      </div>
    </div>
  )
}
