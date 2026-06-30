'use client'

import { useRef } from 'react'

import { ImagePlus, Loader2, Building2 } from 'lucide-react'

import { Field, TextArea } from '../field'

export function BrandingStep({
  orgName,
  logoUrl,
  description,
  website,
  uploading,
  onUploadLogo,
  onChangeDescription,
  onChangeWebsite,
}: {
  orgName?: string
  logoUrl: string
  description: string
  website: string
  uploading: boolean
  onUploadLogo: (file: File) => void
  onChangeDescription: (v: string) => void
  onChangeWebsite: (v: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0]
    if (file) onUploadLogo(file)
    e.currentTarget.value = ''
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-primary">Identidade da integração</h2>
        <p className="mt-1 text-sm text-gray-500">
          É o que seu cliente vê na tela de consentimento ao autorizar o acesso.
        </p>
      </div>

      {/* Logo */}
      <div className="flex items-center gap-4">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo" className="size-full object-contain" />
          ) : (
            <Building2 className="size-7 text-gray-300" />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">Logo</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={pick}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-primary hover:border-primary/40 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            {logoUrl ? 'Trocar logo' : 'Enviar logo'}
          </button>
          <span className="text-xs text-gray-400">PNG, JPG ou WebP · até 512 KB.</span>
        </div>
      </div>

      {orgName && (
        <Field label="Nome" value={orgName} readOnly disabled hint="Definido no cadastro. Fale com a equipe Imóvel Periciado para alterar." />
      )}

      <TextArea
        label="Descrição"
        placeholder="Descreva sua empresa/integração em uma frase."
        maxLength={280}
        value={description}
        onChange={(e) => onChangeDescription(e.target.value)}
      />

      <Field
        label="Site"
        type="url"
        inputMode="url"
        placeholder="https://suaempresa.com"
        autoCapitalize="none"
        spellCheck={false}
        value={website}
        onChange={(e) => onChangeWebsite(e.target.value)}
      />
    </div>
  )
}
