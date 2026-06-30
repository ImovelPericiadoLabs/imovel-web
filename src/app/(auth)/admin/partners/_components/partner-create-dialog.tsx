'use client'

import { useMutation } from '@tanstack/react-query'
import { AlertTriangle, KeyRound, Loader2, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@/components/ui'
import {
  createPartner,
  type CreatePartnerBody,
  type PartnerProvisioned,
  type PartnerScope,
} from '@/services/staff/partners'

import { CopyField } from './copy-field'
import { ScopePicker } from './scope-picker'

const DEFAULT_SCOPES: PartnerScope[] = [
  'analysis:create',
  'analysis:read',
  'certificate:read',
  'webhook:manage',
  'integration:manage',
]

export function PartnerCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [initialCredits, setInitialCredits] = useState('0')
  const [scopes, setScopes] = useState<PartnerScope[]>(DEFAULT_SCOPES)
  const [redirectUris, setRedirectUris] = useState('')
  const [website, setWebsite] = useState('')
  const [description, setDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [provisioned, setProvisioned] = useState<PartnerProvisioned | null>(null)

  const reset = () => {
    setName('')
    setEmail('')
    setInitialCredits('0')
    setScopes(DEFAULT_SCOPES)
    setRedirectUris('')
    setWebsite('')
    setDescription('')
    setLogoUrl('')
    setProvisioned(null)
    mutation.reset()
  }

  const mutation = useMutation({
    mutationFn: (body: CreatePartnerBody) => createPartner(body),
    onSuccess: (data) => {
      setProvisioned(data)
      onCreated()
    },
  })

  const parsedRedirectUris = redirectUris
    .split(/[\s,]+/)
    .map((u) => u.trim())
    .filter(Boolean)

  const submit = () => {
    mutation.mutate({
      name: name.trim(),
      email: email.trim() || undefined,
      initial_credits: Number(initialCredits) || 0,
      scopes,
      redirect_uris: parsedRedirectUris.length ? parsedRedirectUris : undefined,
      website: website.trim() || undefined,
      description: description.trim() || undefined,
      logo_url: logoUrl.trim() || undefined,
    })
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const canSubmit = name.trim().length > 0 && scopes.length > 0 && !mutation.isPending

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        {provisioned ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-600" />
                Parceiro criado
              </DialogTitle>
              <DialogDescription>
                Copie o <strong>client secret</strong> agora — ele é exibido uma única vez. Depois só
                é possível rotacionar.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <CopyField label="Client ID (M2M)" value={provisioned.client_id ?? ''} />
              <CopyField label="Client Secret (M2M)" value={provisioned.client_secret} sensitive />

              {provisioned.consent_client_id && (
                <>
                  <CopyField
                    label="Client ID (login / authorization_code)"
                    value={provisioned.consent_client_id}
                  />
                  {provisioned.consent_client_secret && (
                    <CopyField
                      label="Client Secret (login)"
                      value={provisioned.consent_client_secret}
                      sensitive
                    />
                  )}
                </>
              )}

              <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <p>
                  Guarde o secret em local seguro. Por segurança, não armazenamos o valor em claro —
                  não há como recuperá-lo depois.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Concluir</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="size-5 text-primary" />
                Novo parceiro B2B
              </DialogTitle>
              <DialogDescription>
                Cria a organização e as credenciais OAuth (client_credentials). Se o e-mail já
                existir, o usuário é vinculado como owner.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="partner-name">Nome do parceiro</Label>
                <Input
                  id="partner-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Imobiliária Acme"
                  autoFocus
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="partner-email">E-mail do desenvolvedor (owner)</Label>
                  <Input
                    id="partner-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dev@acme.com"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="partner-credits">Créditos iniciais (R$)</Label>
                  <Input
                    id="partner-credits"
                    type="number"
                    min="0"
                    step="0.01"
                    value={initialCredits}
                    onChange={(e) => setInitialCredits(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Permissões (escopos)</Label>
                <ScopePicker value={scopes} onChange={setScopes} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="partner-redirects">
                  Redirect URIs do login do cliente{' '}
                  <span className="font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <textarea
                  id="partner-redirects"
                  value={redirectUris}
                  onChange={(e) => setRedirectUris(e.target.value)}
                  placeholder={'https://app.parceiro.com/callback\nhttps://...'}
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  https, um por linha. Se preenchido, provisiona também a credencial de{' '}
                  <strong>login do cliente</strong> (authorization_code + PKCE). Deixe vazio para
                  criar só a credencial M2M.
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-lg border border-dashed border-input p-3">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Branding da integração (opcional)
                </Label>
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="Site — https://parceiro.com"
                />
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição curta (até 280 caracteres)"
                  maxLength={280}
                />
                <Input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="Logo (link https) — o upload pode ser feito depois, no detalhe"
                />
              </div>

              {mutation.isError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <p>
                    {(mutation.error as Error)?.message ?? 'Não foi possível criar o parceiro.'}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={submit} disabled={!canSubmit}>
                {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
                Criar parceiro
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
