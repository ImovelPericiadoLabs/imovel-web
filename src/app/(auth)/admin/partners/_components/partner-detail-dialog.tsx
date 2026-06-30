'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ImagePlus,
  Loader2,
  Mail,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Separator,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui'
import {
  getPartner,
  rotatePartnerSecret,
  sendPartnerOnboarding,
  topUpPartnerCredits,
  updatePartner,
  uploadPartnerLogo,
  type Partner,
  type PartnerScope,
} from '@/services/staff/partners'

import { CopyField } from './copy-field'
import { ScopePicker } from './scope-picker'
import { formatBRL } from './partner-utils'

type Feedback = { kind: 'success' | 'error'; message: string } | null

export function PartnerDetailDialog({
  partnerId,
  open,
  onOpenChange,
  onChanged,
}: {
  partnerId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onChanged: () => void
}) {
  const [rotatedSecret, setRotatedSecret] = useState<string | null>(null)
  const [rotatedLabel, setRotatedLabel] = useState('Novo Client Secret')
  const [topUpAmount, setTopUpAmount] = useState('')
  const [scopesEdit, setScopesEdit] = useState<PartnerScope[] | null>(null)
  const [redirectUrisEdit, setRedirectUrisEdit] = useState<string | null>(null)
  const [newConsentSecret, setNewConsentSecret] = useState<string | null>(null)
  const [websiteEdit, setWebsiteEdit] = useState<string | null>(null)
  const [descriptionEdit, setDescriptionEdit] = useState<string | null>(null)
  const [logoLink, setLogoLink] = useState('')
  const [feedback, setFeedback] = useState<Feedback>(null)

  const detail = useQuery({
    queryKey: ['staff-partner', partnerId],
    queryFn: () => getPartner(partnerId as string),
    enabled: open && Boolean(partnerId),
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  })

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setRotatedSecret(null)
      setRotatedLabel('Novo Client Secret')
      setTopUpAmount('')
      setScopesEdit(null)
      setRedirectUrisEdit(null)
      setNewConsentSecret(null)
      setWebsiteEdit(null)
      setDescriptionEdit(null)
      setLogoLink('')
      setFeedback(null)
    }
    onOpenChange(next)
  }

  const p = detail.data
  const scopes = scopesEdit ?? p?.scopes ?? []
  const scopesDirty = p
    ? JSON.stringify([...scopes].sort()) !== JSON.stringify([...p.scopes].sort())
    : false

  const redirectUrisText = redirectUrisEdit ?? (p?.redirect_uris ?? []).join('\n')
  const parsedRedirects = redirectUrisText
    .split(/[\s,]+/)
    .map((u) => u.trim())
    .filter(Boolean)
  const redirectsDirty = p
    ? JSON.stringify(parsedRedirects) !== JSON.stringify(p.redirect_uris)
    : false

  const website = websiteEdit ?? p?.website ?? ''
  const description = descriptionEdit ?? p?.description ?? ''
  const brandingDirty = p
    ? website !== (p.website ?? '') || description !== (p.description ?? '')
    : false

  const afterChange = (message: string) => {
    setFeedback({ kind: 'success', message })
    onChanged()
    void detail.refetch()
  }

  const onError = (err: unknown) =>
    setFeedback({
      kind: 'error',
      message: err instanceof Error ? err.message : 'Operação falhou.',
    })

  const rotate = useMutation({
    mutationFn: (app: 'm2m' | 'consent') => rotatePartnerSecret(partnerId as string, app),
    onSuccess: (data) => {
      setRotatedSecret(data.client_secret)
      setRotatedLabel(
        data.app === 'consent' ? 'Novo Client Secret (consent)' : 'Novo Client Secret (M2M)',
      )
      setFeedback({ kind: 'success', message: 'Secret rotacionado. Copie agora.' })
    },
    onError,
  })

  const topUp = useMutation({
    mutationFn: () => topUpPartnerCredits(partnerId as string, { amount: Number(topUpAmount) }),
    onSuccess: () => {
      setTopUpAmount('')
      afterChange('Créditos adicionados.')
    },
    onError,
  })

  const setStatus = useMutation({
    mutationFn: (status: Partner['status']) => updatePartner(partnerId as string, { status }),
    onSuccess: (p) => afterChange(p.status === 'SUSPENDED' ? 'Parceiro suspenso.' : 'Parceiro ativado.'),
    onError,
  })

  const saveScopes = useMutation({
    mutationFn: () => updatePartner(partnerId as string, { scopes }),
    onSuccess: () => {
      setScopesEdit(null)
      afterChange('Escopos atualizados.')
    },
    onError,
  })

  const onboarding = useMutation({
    mutationFn: () => sendPartnerOnboarding(partnerId as string),
    onSuccess: (r) => setFeedback({ kind: 'success', message: `Onboarding enviado para ${r.email}.` }),
    onError,
  })

  const saveRedirects = useMutation({
    mutationFn: () => updatePartner(partnerId as string, { redirect_uris: parsedRedirects }),
    onSuccess: (r) => {
      setRedirectUrisEdit(null)
      if (r.consent_client_secret) setNewConsentSecret(r.consent_client_secret)
      afterChange(
        r.consent_client_secret
          ? 'App de consent criado. Copie o secret agora.'
          : 'Redirect URIs atualizados.',
      )
    },
    onError,
  })

  const saveBranding = useMutation({
    mutationFn: () => updatePartner(partnerId as string, { website, description }),
    onSuccess: () => {
      setWebsiteEdit(null)
      setDescriptionEdit(null)
      afterChange('Branding atualizado.')
    },
    onError,
  })

  const applyLogoLink = useMutation({
    mutationFn: () => updatePartner(partnerId as string, { logo_url: logoLink.trim() }),
    onSuccess: () => {
      setLogoLink('')
      afterChange('Logo (link) aplicado.')
    },
    onError,
  })

  const logoUpload = useMutation({
    mutationFn: (file: File) => uploadPartnerLogo(partnerId as string, file),
    onSuccess: () => afterChange('Logo enviado.'),
    onError,
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {p?.name ?? 'Parceiro'}
            {p && (
              <Badge variant={p.status === 'ACTIVE' ? 'success' : 'warning'}>
                {p.status === 'ACTIVE' ? 'Ativo' : 'Suspenso'}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>{p?.owner_email ?? 'Gestão do parceiro B2B'}</DialogDescription>
        </DialogHeader>

        {feedback && (
          <div
            className={
              feedback.kind === 'success'
                ? 'flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700'
                : 'flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700'
            }
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>{feedback.message}</p>
          </div>
        )}

        {detail.isLoading || !p ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <Tabs defaultValue="overview">
            <TabsList className="w-full">
              <TabsTrigger value="overview" className="flex-1">
                Visão geral
              </TabsTrigger>
              <TabsTrigger value="credentials" className="flex-1">
                Credenciais
              </TabsTrigger>
              <TabsTrigger value="branding" className="flex-1">
                Branding
              </TabsTrigger>
              <TabsTrigger value="credits" className="flex-1">
                Créditos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="flex flex-col gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Stat label="Saldo" value={formatBRL(p.credits_balance)} />
                  <Stat label="Owner" value={p.owner_email ?? '—'} />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Permissões (escopos)</Label>
                  <ScopePicker value={scopes} onChange={setScopesEdit} />
                  {scopesDirty && (
                    <Button
                      size="sm"
                      className="self-start"
                      onClick={() => saveScopes.mutate()}
                      disabled={saveScopes.isPending || scopes.length === 0}
                    >
                      {saveScopes.isPending && <Loader2 className="size-4 animate-spin" />}
                      Salvar escopos
                    </Button>
                  )}
                </div>

                <Separator />

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => onboarding.mutate()} disabled={onboarding.isPending}>
                    {onboarding.isPending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                    Enviar onboarding
                  </Button>
                  {p.status === 'ACTIVE' ? (
                    <Button
                      variant="outline"
                      onClick={() => setStatus.mutate('SUSPENDED')}
                      disabled={setStatus.isPending}
                    >
                      <PauseCircle className="size-4" />
                      Suspender
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setStatus.mutate('ACTIVE')}
                      disabled={setStatus.isPending}
                    >
                      <PlayCircle className="size-4" />
                      Ativar
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="credentials">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-3">
                  <CopyField label="Client ID (M2M / client_credentials)" value={p.client_id ?? ''} />
                  <Button
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() => rotate.mutate('m2m')}
                    disabled={rotate.isPending}
                  >
                    {rotate.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                    Rotacionar secret (M2M)
                  </Button>
                </div>

                <Separator />

                <div className="flex flex-col gap-3">
                  <Label>Consent delegado (authorization_code + PKCE)</Label>

                  {p.consent_client_id ? (
                    <>
                      <CopyField label="Client ID (consent)" value={p.consent_client_id} />
                      <Button
                        variant="outline"
                        size="sm"
                        className="self-start"
                        onClick={() => rotate.mutate('consent')}
                        disabled={rotate.isPending}
                      >
                        {rotate.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                        Rotacionar secret (consent)
                      </Button>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Sem app de consent. Cadastre os redirect URIs abaixo para provisioná-lo
                      (libera o fluxo de criação de pedidos delegada pelo cliente final).
                    </p>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="redirects">Redirect URIs (https, um por linha)</Label>
                    <textarea
                      id="redirects"
                      value={redirectUrisText}
                      onChange={(e) => setRedirectUrisEdit(e.target.value)}
                      rows={2}
                      placeholder="https://app.parceiro.com/callback"
                      className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    {redirectsDirty && (
                      <Button
                        size="sm"
                        className="self-start"
                        onClick={() => saveRedirects.mutate()}
                        disabled={saveRedirects.isPending || parsedRedirects.length === 0}
                      >
                        {saveRedirects.isPending && <Loader2 className="size-4 animate-spin" />}
                        Salvar redirect URIs
                      </Button>
                    )}
                  </div>

                  {newConsentSecret && (
                    <CopyField label="Client Secret (consent)" value={newConsentSecret} sensitive />
                  )}
                </div>

                <Separator />

                {rotatedSecret ? (
                  <CopyField label={rotatedLabel} value={rotatedSecret} sensitive />
                ) : (
                  <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                    <p>
                      O secret é exibido apenas na criação/rotação. Se o parceiro perdeu, rotacione
                      para gerar um novo (invalida o anterior).
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="branding">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  {p.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.logo_url}
                      alt={p.name}
                      className="h-14 w-14 rounded-xl border border-border bg-white object-contain p-1"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-muted text-lg font-bold text-muted-foreground">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <label className="inline-flex cursor-pointer items-center gap-2 self-start rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:bg-muted">
                      <ImagePlus className="size-4" />
                      {logoUpload.isPending ? 'Enviando...' : 'Enviar logo'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) logoUpload.mutate(f)
                          e.target.value = ''
                        }}
                      />
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      PNG/JPG/WebP, até 512KB (re-encodado no servidor).
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="logo-link">Ou use um link de imagem</Label>
                  <div className="flex gap-2">
                    <Input
                      id="logo-link"
                      value={logoLink}
                      onChange={(e) => setLogoLink(e.target.value)}
                      placeholder="https://.../logo.png"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => applyLogoLink.mutate()}
                      disabled={applyLogoLink.isPending || !logoLink.trim()}
                    >
                      {applyLogoLink.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Aplicar'}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="b-website">Site</Label>
                  <Input
                    id="b-website"
                    value={website}
                    onChange={(e) => setWebsiteEdit(e.target.value)}
                    placeholder="https://parceiro.com"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="b-desc">Descrição</Label>
                  <Input
                    id="b-desc"
                    value={description}
                    onChange={(e) => setDescriptionEdit(e.target.value)}
                    maxLength={280}
                    placeholder="Descrição curta exibida na tela de consent"
                  />
                </div>

                {brandingDirty && (
                  <Button
                    size="sm"
                    className="self-start"
                    onClick={() => saveBranding.mutate()}
                    disabled={saveBranding.isPending}
                  >
                    {saveBranding.isPending && <Loader2 className="size-4 animate-spin" />}
                    Salvar branding
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="credits">
              <div className="flex flex-col gap-4">
                <Stat label="Saldo atual" value={formatBRL(p.credits_balance)} />

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="topup">Adicionar créditos (R$)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="topup"
                      type="number"
                      min="0"
                      step="0.01"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      placeholder="100,00"
                    />
                    <Button
                      onClick={() => topUp.mutate()}
                      disabled={topUp.isPending || !(Number(topUpAmount) > 0)}
                    >
                      {topUp.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}
